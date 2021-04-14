import math
import numpy as np

class floor_plan_validation(object):
    def __init__(self,j_object):
        self.j_object = j_object
        self.error_log = []
        self.warning_log = []
        self.room_view_names = {}
        self.room_name = []
        self.update_all(self)

    @property
    def warning(self):
        warning_log_clean = []
        for items in self.warning_log:
            if isinstance(items, unicode):
                warning_log_clean.append(items)
        return warning_log_clean
    
    @property
    def json_object(self):
        return self.j_object

    @property
    def error(self):
        error_log_clean = []
        for items in self.error_log:
            if isinstance(items, unicode):
                error_log_clean.append(items)
        return error_log_clean
    
    @property
    def room_names(self):
        return self.room_name

    @property
    def room_view_name(self):
        return self.room_view_names
    
    


    @staticmethod
    def update_all(self):
        error_log, warning_log = self.error_log, self.warning_log
        json_object = self.j_object
        #validating the project details   
        error_log, warning_log = self._project_details(self,error_log, warning_log, json_object)
        #validating the org_details
        error_log, warning_log = self._org_details(self,error_log, warning_log, json_object)
        #validating floor_plan
        error_log, warning_log, room_names = self._floor_plan(self,error_log, warning_log, json_object)
        if not len(room_names) == 0:
            #validating the rooms
            error_log, warning_log = self._rooms(self, room_names)
        #returning the final error and warning logs
        self.error_log, self.warning_log = error_log, warning_log
        return room_names


    @staticmethod
    def _project_details(self,error_log, warning_log, json_object):
        #validaitng if key exists- if not then returned as error
        #checking if any additional keys exist- if yes then returned as warning   
        if json_object.has_key('project_details'):
            project_details_names = ['project_no','project_name','apartment_name','designer_name','flat_number','client_id','client_name','contract_date','name_title','target_date']
            
            json_project_details = json_object['project_details']
            for items in json_project_details:
                
                if not items in project_details_names: #is_it:
                    warning_log.append('Additional key name: '+items+' exists in the project_details.')
                else:
                    project_details_names_duplicate = project_details_names
        else:
            error_log.append('Json object does not contain the key name: project_details' )
        return error_log, warning_log



    @staticmethod
    def _org_details(self,error_log, warning_log, json_object):
        #validaitng if key exists- if not then returned as error
        #checking if any additional keys exist- if yes then returned as warning 
        if json_object.has_key('org_details'):
            org_details_names = ['org_name','org_logo_url','org_address']
            json_org_details = json_object['org_details']
            for items in json_org_details:
                
                if not items in org_details_names: #is_it:
                    warning_log.append('Additional key name: '+items+' exists in the org_details.')
        else:
            error_log.append('Json object does not contain the key name: org_details.' )
        return error_log, warning_log
   

    @staticmethod
    def _floor_plan(self, error_log, warning_log, json_object):
        #validaitng if key exists - floor_plan, room_name_positions, outline  
        #storing the room names for a later use
        #validating the room name position coordinates 
        #validating the format of outline
        room_names = []
        if json_object.has_key('floor_plan'):
            json_floor_plan = json_object['floor_plan']
            if json_floor_plan.has_key('room_name_positions') and json_floor_plan.has_key('outline'):
                error_log, warning_log, limit_coord, new_outline = self._outline('Json object[floor_plan][outline]', json_floor_plan['outline'], error_log, warning_log, PerformCheck = True)
                json_floor_plan['outline'] = new_outline
                json_floor_plan["thickness"] = int(self._thickness(limit_coord,'floor_plan'))
                if json_floor_plan['room_name_positions']:
                    for keys in json_floor_plan['room_name_positions']:
                        room_names.append(keys)

                        if len(json_floor_plan['room_name_positions'][keys]) != 2:
                            error_log.append('Json object[floor_plan][room_name_positions]['+ keys+ '] contains invalid data: more than or less than 2 coordinates are provided for a point .')
                        else: #Updating the room name positins coordinates
                            json_floor_plan['room_name_positions'][keys][0] -= limit_coord[0][0] #updating x
                            json_floor_plan['room_name_positions'][keys][1] -= limit_coord[0][1] #updating y
                else:
                    error_log.append('Json object[floor_plan][room_name_positions] is empty') 
            else:
                if not json_floor_plan.has_key('room_name_positions'):
                    if not json_floor_plan.has_key('outline'):
                        error_log.append('Json object[floor_plan] does not contain the key name: room_name_positions.' )
                        error_log.append('Json object[floor_plan] does not contain the key name: outline.' )
                    else:
                        error_log.append('Json object[floor_plan] does not contain the key name: room_name_positions.' )
                else:
                    error_log.append('Json object[floor_plan] does not contain the key name: outline.' )
                
        else:
            error_log.append('Json object does not contain the key name: floor_plan.' )

        return error_log, warning_log, room_names

    @staticmethod
    def _thickness(limit_coords,plan_name):
        x1, y1, x2, y2 = limit_coords[0][0],limit_coords[0][1],limit_coords[1][0],limit_coords[1][1]
        diagonal = np.sqrt(np.power((x2-x1),2)+np.power((y2-y1),2))
        thickness = 250
        if plan_name == 'floor_plan':
            thickness = diagonal/60
        elif  plan_name == 'room_top_view':
            thickness = diagonal/40
        
        if thickness == abs(np.inf):
            thickness = 250
        
        return thickness



    @staticmethod
    def _outline(string_id, outline, error_log, warning_log, x0 = 0, y0 =0, PerformCheck = False, Shutter =False):
        x_min, y_min, x_max, y_max = np.inf, np.inf, -np.inf, -np.inf  #[[x1 y1][x2 y2]]
        x_list, y_list = [], []
        new_outline = []
        
        if not isinstance(outline, list):
            warning_log.append(string_id +'is not a list or array.')
        elif len(outline) != 0:
            outline_ok = 1
            #negative_ok = 1
            for lines in outline:
                if len(lines[0]) != 2 or len(lines[1]) != 2 or len(lines) !=2:
                    outline_ok*= 0
                else:
                    x_list.append(lines[0][0])
                    x_list.append(lines[1][0])
                    y_list.append(lines[0][1])
                    y_list.append(lines[1][1])
                    new_outline.append([[lines[0][0]-x0,lines[0][1]-y0],[lines[1][0]-x0,lines[1][1]-y0]])
                    
                #add here if negative coordinates are not allowed.
            if outline_ok == 0:
                error_log.append(string_id + 'contains invalid data: more than or less than 2 coordinates are provided for either a point or a line.')
            else:
                x_min = min(x_list)
                x_max = max(x_list)
                y_min = min(y_list)
                y_max = max(y_list)
                if PerformCheck: #when its florr plam/ room top view stuff
                    new_outline_main_view = []
                    for lines in new_outline:
                        new_outline_main_view.append([[lines[0][0]-x_min,lines[0][1]-y_min],[lines[1][0]-x_min,lines[1][1]-y_min]])
                    new_outline = new_outline_main_view
                
                if Shutter: #then shutter outline is arranged such that top right up and down comes okay.
                    if len(new_outline) == 4:
                        new_outline_shutter_view =[]
                        print(new_outline)

                        print('---')
                        new_outline_shutter_view.append([[x_min-x0,y_min-y0],[x_min-x0,y_max-y0]])
                        new_outline_shutter_view.append([[x_min-x0,y_max-y0],[x_max-x0,y_max-y0]])
                        new_outline_shutter_view.append([[x_max-x0,y_max-y0],[x_max-x0,y_min-y0]])
                        new_outline_shutter_view.append([[x_max-x0,y_min-y0],[x_min-x0,y_min-y0]])
                        print(new_outline_shutter_view)

                        print('-------')
                        new_outline = new_outline_shutter_view

        else:
            warning_log.append(string_id +'contains no data')
        return error_log, warning_log, [[x_min,y_min],[x_max,y_max]], new_outline


    @staticmethod
    def _rooms(self, room_names):
        error_log, warning_log = self.error_log, self.warning_log
        json_object = self.j_object
        if json_object.has_key('rooms'):
            json_rooms = json_object['rooms']
            if not json_rooms:
                error_log.append('Json object[rooms] is empty.')
            else:
                
                for items in list(json_rooms): #for all the rooms in room names
                    
                    if items in room_names: #when item exits in the list
                        self.room_view_names[items] = []
                        self.room_name.append(items)
                        json_room = json_rooms[items]
                        if json_room.has_key('room_top_view'):
                            self.room_view_names[items].append('room_top_view')
                            string_id = 'Json object[rooms]['+items+'][room_top_view]'
                            error_log, warning_log = self._room_top_view(self,string_id,json_room['room_top_view'],error_log, warning_log)
                        else:
                            error_log.append('The room ' + items + ' does not contain room_top_view.' )

                        #check_con = 
                        
                        if json_room.has_key('render_individual_comps'):
                            #check_len = 
                            if len(json_room['render_individual_comps']) == 0 :
                                warning_log.append('Json object[rooms]['+items+'][render_individual_comps] is empty.') #warning
                                del json_object['rooms'][items]['render_individual_comps']
                                
                                
                            else:
                                json_room_render_individual_comps = json_room['render_individual_comps']
                                for ext_items in list(json_room_render_individual_comps):
                                    if not json_room_render_individual_comps[ext_items]:
                                        warning_log.append('Json object[rooms]['+items+'][render_individual_comps]['+ext_items+'] is empty.') #warning

                        else:
                            warning_log.append('The room ' + items + ' does not contain render_individual_comps.' ) #warning


                        view_number = 1
                        
                        while view_number !=0 :
                            view_number_name = 'view_' + str(view_number)
                            if json_room.has_key(view_number_name) :
                                if not json_room[view_number_name]:
                                    warning_log.append('Json object[rooms]['+items+']['+view_number_name+'] is empty.') #error
                                else:
                                    self.room_view_names[items].append(view_number_name)
                                    string_id_view_number ='Json object[rooms]['+items+']['+view_number_name+']'
                                    error_log, warning_log = self._room_view_number(self,string_id_view_number,json_room[view_number_name],error_log, warning_log)
                                view_number += 1
                            else:
                                if view_number == 1:
                                    warning_log.append('The room ' + items + ' contains no views.' ) #error
                                view_number =0
                        
                        fake_room_name_list = self.room_view_names[items] #using it to delete additional items
                        fake_room_name_list.append('render_individual_comps')
                        for room_items in list(json_room):
                            if not room_items in fake_room_name_list:
                                del json_room[room_items]
                    
                    elif items == 'material_thumbnails':
                        check_len = len(json_rooms['material_thumbnails'])

                        if check_len == 0:
                            warning_log.append('Json object[rooms][material_thumbnails] is empty.')
                            del json_rooms['material_thumbnails']

                        else:
                            json_rooms_material_thumbnails = json_rooms['material_thumbnails']
                            for materials in json_rooms_material_thumbnails:
                                if not json_rooms_material_thumbnails[materials]:
                                    warning_log.append('Json object[rooms][material_thumbnails]['+materials+'] is empty.')

                    else: 
                        warning_log.append('Additional key name: '+items+' exists in the rooms.')
                        del json_rooms[items]

            print(self.room_view_names)
                

                    
        
        else:
            error_log.append('Json object does not contain the key name: rooms.' )

        return error_log, warning_log
    
    @staticmethod
    def _room_top_view(self,string_id,json_room_top_view,error_log, warning_log):
        init_error_len = len(error_log)
        x_list_min, x_list_max, y_list_min, y_list_max = [], [], [], []
        x_list_min.append(np.inf)
        y_list_min.append(np.inf)
        x_list_max.append(-np.inf)
        y_list_max.append(-np.inf)
        check_len = len(json_room_top_view)
        if check_len == 0:# if the dictionary is empty
            error_log.append(string_id + 'is empty')
        else:
            check_con = json_room_top_view.has_key('outline')
            if check_con:
                room_top_view_outline = json_room_top_view['outline']
                error_log, warning_log, limit_coord, new_outline = self._outline(string_id+'[outline]', room_top_view_outline, error_log, warning_log, PerformCheck = True)
                json_room_top_view['outline'] = new_outline

                
                json_room_top_view["thickness"] = int(self._thickness(limit_coord,'room_top_view'))
                
                check_len_outline = len(room_top_view_outline)
                
                if check_len_outline == 0:
                    
                    del json_room_top_view['outline']
                
                else:
                    check_con = json_room_top_view.has_key('floor_components')
                    if check_con:
                        check_con1 = json_room_top_view['floor_components'].has_key('library')
                        if check_con1:
                            check_con2 = len(json_room_top_view['floor_components']['library'])
                            if check_con2 == 0:
                                del json_room_top_view['floor_components']
                                warning_log.append(string_id+'[floor_components][library] is empty.')
                            else:
                                json_room_top_view_library = json_room_top_view['floor_components']['library']
                                error_log, warning_log, lines = self._room_top_view_library_or_external(self,string_id+'[floor_components][library]',json_room_top_view_library,error_log, warning_log,limit_coord)
                                x_list_min.append(lines[0][0])
                                y_list_min.append(lines[0][1])
                                x_list_max.append(lines[1][0])
                                y_list_max.append(lines[1][1])
                        else:
                            del json_room_top_view['floor_components']
                            warning_log.append(string_id + '[floor_components] does not contain the key name library') #error
                    else:
                        warning_log.append(string_id + 'does not contain the key name floor_components') #error
                    
                    check_con = json_room_top_view.has_key('external')
                    if check_con:
                        
                        check_len = len(json_room_top_view['external'])
                        if check_len == 0:
                            del json_room_top_view['external']
                        else:
                            json_room_top_view_external = json_room_top_view['external']
                            error_log, warning_log, lines = self._room_top_view_library_or_external(self,string_id+'[external]',json_room_top_view_external,error_log, warning_log,limit_coord)
                            x_list_min.append(lines[0][0])
                            y_list_min.append(lines[0][1])
                            x_list_max.append(lines[1][0])
                            y_list_max.append(lines[1][1])
                    else:
                        warning_log.append(string_id + 'does not contain the key name external')
            
            else:
                error_log.append(string_id + 'does not contain the key name outline')

            x_min = min(x_list_min)
            y_min = min(y_list_min)
            x_max = max(x_list_max)
            y_max = max(y_list_max)
            #final_error_len = len(error_log)
            #if final_error_len == init_error_len:
            if check_len_outline != 0:
                error_log, warning_log = self._check_component_outside_outline(string_id, limit_coord, [[x_min,y_min],[x_max,y_max]],error_log, warning_log)
        return error_log, warning_log

    @staticmethod
    def _check_component_outside_outline(string_id, limit_coord, lines, error_log, warning_log):
        good = 1
        if abs(lines[0][0]) == np.inf or abs(lines[1][0]) == np.inf or abs(lines[0][1]) == np.inf or abs(lines[1][1]) == np.inf:
            warning_log.append(string_id + ': Components do not exists.')
        else:
            if limit_coord[0][0] > lines[0][0]:
                good *= 0

            if limit_coord[1][0] < lines[1][0]:
                good *= 0

            if limit_coord[0][1] > lines[0][1]:
                good *= 0

            if limit_coord[1][1] < lines[1][1]:
                good *= 0
                
        if good == 0:
            error_log.append(string_id + ': Components/external are outsize the outline')
        return error_log, warning_log


    @staticmethod 
    def _room_top_view_library_or_external(self,string_id,json_room_top_view_library,error_log, warning_log, limit_coord):
        x_list_min, x_list_max, y_list_min, y_list_max = [], [], [], []
        x_min, x_max, y_min, y_max = np.inf, -np.inf, np.inf, -np.inf
        x_list_min.append(np.inf)
        y_list_min.append(np.inf)
        x_list_max.append(-np.inf)
        y_list_max.append(-np.inf)
        if not json_room_top_view_library:
            warning_log.append(string_id+' is empty.')
        else:
            for items in list(json_room_top_view_library):
                if not json_room_top_view_library[items]:
                    warning_log.append(string_id+'['+items+'] is empty.')
                else:
                    if json_room_top_view_library[items].has_key('comp_details'):
                        if len(json_room_top_view_library[items]['comp_details']) < 5:
                            warning_log.append('Some items are missing from ' + string_id+'['+items+'][comp_details].')
                        elif len(json_room_top_view_library[items]['comp_details']) > 5:
                            warning_log.append('Some additional items exists in ' + string_id+'['+items+'][comp_details].')
                    else:
                        warning_log.append(string_id+'['+items+'] has no key comp_details.')
                    
                    if json_room_top_view_library[items].has_key('outline'):
                        error_log, warning_log, lines, new_outline = self._outline(string_id+'['+items+'][outline]',json_room_top_view_library[items]['outline'],error_log, warning_log,limit_coord[0][0],limit_coord[0][1])
                        json_room_top_view_library[items]['outline'] = new_outline
                        x_list_min.append(lines[0][0])
                        x_list_max.append(lines[1][0])
                        y_list_min.append(lines[0][1])
                        y_list_max.append(lines[1][1])
                    else:
                        warning_log.append(string_id+'['+items+'] has no key outline.') 
            x_min = min(x_list_min)
            x_max = max(x_list_max)
            y_min = min(y_list_min)
            y_max = max(y_list_max)
        return error_log, warning_log, [[x_min,y_min],[x_max,y_max]] 

    @staticmethod
    def _room_view_number(self,string_id,json_room_view_number,error_log, warning_log):
        view_names = ['top_view','front_view','internal_view','render_wall_view']
        for view_items in list(json_room_view_number):
            if not view_items in view_names:
                warning_log.append('Additional key name' +view_items + 'exist in ' + string_id)
            else:
                if view_items == 'render_wall_view':
                    print(string_id)
                    check_len = len(json_room_view_number['render_wall_view'])
                    if check_len == 0:
                        del json_room_view_number['render_wall_view']
                    else:
                        check_con = json_room_view_number['render_wall_view'].has_key('image_url')
                        if not check_con:  # render wall view has no image url
                            warning_log.append(string_id +'[' +view_items+'] does not contain image_url')
                            del json_room_view_number['render_wall_view']
                        else:
                            check_len = len(json_room_view_number['render_wall_view']['image_url'])
                            if check_len == 0: #size of image_url is zero
                                warning_log.append(string_id +'[' +view_items+'][image_url] is empty')
                                del json_room_view_number['render_wall_view']
                else:
                    if not json_room_view_number[view_items]:
                        warning_log.append(string_id+'][' +view_items + 'is empty. ')
                    else: #top_view, front_view or external_view
                        json_room_view_name = json_room_view_number[view_items]
                        x_list_min, x_list_max, y_list_min, y_list_max = [], [], [], []
                        init_error_len = len(error_log)
                        x_list_min.append(np.inf)
                        y_list_min.append(np.inf)
                        x_list_max.append(-np.inf)
                        y_list_max.append(-np.inf)
                        check_con = json_room_view_number[view_items].has_key('outline')
                        for key_views in list(json_room_view_number[view_items]):
                            if not key_views in ["outline","floor_components","external","openings" ]:
                                warning_log.append('Additional item: ' +string_id+'][' +view_items + '][' + key_views + 'exists.' )
                                del json_room_view_number[view_items][key_views]
                        if check_con: #if view numebr has outline
                            string_outline = string_id + '][' +view_items + '][outline]'
                            error_log, warning_log, limit_coord, new_outline = self._outline(string_outline, json_room_view_name['outline'], error_log, warning_log, PerformCheck=True)
                            json_room_view_name['outline'] = new_outline

                            #outline
            
                            check_len_outline = len(json_room_view_number[view_items]['outline'])
                            if check_len_outline == 0:
                                error_log.append(string_id+'][' +view_items + '][outline] is empty. ')
                                del json_room_view_number[view_items]['outline']
                            else:
                                check_con1 = json_room_view_number[view_items].has_key('floor_components')
                                
                                if check_con1: #floor components exists
                                    check_con2 = json_room_view_number[view_items]['floor_components'].has_key('library')
                                    if check_con2: #library exists
                                        string_floor_library = string_id + '][' +view_items + '][floor_components][library]'
                                        check_len = len(json_room_view_number[view_items]['floor_components']['library'])
                                    
                                        if check_len !=0:
                                            json_room_view_name_library = json_room_view_number[view_items]['floor_components']['library']
                                            for items in list(json_room_view_name_library):
                                                del_yes = 1
                                                if not json_room_view_name_library[items]:
                                                    warning_log.append(string_floor_library+'['+items+'] is empty.')
                                                    del_yes *=0
                                                else:
                                                    if json_room_view_name_library[items].has_key('comp_details'):
                                                        if len(json_room_view_name_library[items]['comp_details']) < 5:
                                                            warning_log.append('Some items are missing from ' + string_floor_library+'['+items+'][comp_details].')
                                                        elif len(json_room_view_name_library[items]['comp_details']) > 5:
                                                            warning_log.append('Some additional items exists in ' + string_floor_library+'['+items+'][comp_details].')
                                                    else:
                                                        warning_log.append(string_floor_library+'['+items+'] has no key comp_details.')
                                                    
                                                    if 'external_points' in list(json_room_view_name_library[items]):
                                                        check_len_ext = len(json_room_view_name_library[items]['external_points'])
                                                        if check_len_ext != 0 :
                                                            error_log, warning_log, lines = self._library_external_points(self, string_floor_library+'['+items+'][external_points]',json_room_view_name_library[items]['external_points'],error_log, warning_log,limit_coord)
                                                            x_list_min.append(lines[0][0])
                                                            x_list_max.append(lines[1][0])
                                                            y_list_min.append(lines[0][1])
                                                            y_list_max.append(lines[1][1])
                                                            #component
                                                        else:
                                                            warning_log.append(string_floor_library+'['+items+'][external_points] is empty.')
                                                            del_yes *=0

                                                    else:
                                                        warning_log.append(string_floor_library+'['+items+'] has no key external_points.') 
                                                        del_yes *=0
                                                if del_yes ==0:
                                                    del json_room_view_name_library[items]
                                                    
                                        else: #library is empty
                                            del json_room_view_number[view_items]['floor_components']
                                            warning_log.append(string_id + '][' +view_items + '][floor_components][library] is empty.')

                                    else: #library does not exists
                                        warning_log.append(string_id + '][' +view_items + '][floor_components][library] does not exist.') #error
                                        del json_room_view_number[view_items]['floor_components']
                                    
                                else:
                                    warning_log.append(string_id + '][' +items + '][floor_components] does not exist.') #error

                                if 'external' in list(json_room_view_name):
                                    string_floor_external = string_id + '][' +view_items + '][external]'

                                    if len(json_room_view_name['external']) != 0:
                                        for external_items in list(json_room_view_name['external']):
                                            if json_room_view_name['external'][external_items]:
                                                json_room_view_name_external_item = json_room_view_name['external'][external_items]
                                                if 'outline' in json_room_view_name_external_item:
                                                    string_outline = string_floor_external + '[' +external_items + '][outline]'
                                                    error_log, warning_log, lines, new_outline = self._outline(string_outline, json_room_view_name_external_item['outline'], error_log, warning_log,limit_coord[0][0],limit_coord[0][1])
                                                    json_room_view_name_external_item['outline'] = new_outline
                                                    x_list_min.append(lines[0][0])
                                                    x_list_max.append(lines[1][0])
                                                    y_list_min.append(lines[0][1])
                                                    y_list_max.append(lines[1][1])
                                                #check what to do with it
                                    else:
                                        warning_log.append(string_floor_external+ 'is empty.' )
                                        del json_room_view_number[view_items]['external']

                                if 'openings' in list(json_room_view_name):
                                    string_floor_openings = string_id + '][' +view_items + '][openings]'
                                    check_len = len(json_room_view_name['openings'])
                                    if check_len == 0: #if length of opening is zero
                                        del json_room_view_number[view_items]['openings']
                                    #########
                                    #########
                                    # what to check here? - its not consistent


                                x_min, x_max, y_min, y_max  = min(x_list_min), max(x_list_max), min(y_list_min), max(y_list_max)
                                final_error_len = len(error_log)
                                if final_error_len == init_error_len:
                                    error_log, warning_log = self._check_component_outside_outline(string_id +'['+view_items+']', limit_coord, [[x_min,y_min],[x_max,y_max]],error_log, warning_log)
                        

                        else:
                            error_log.append(string_id + '][' +view_items + '][outline] does not exist.')
                            del json_room_view_number[view_items]['outline']
                        

        return error_log, warning_log


    @staticmethod
    def _library_external_points(self, string_id,json_room_view_name_library_external_points,error_log, warning_log,limit_coord):
        x_list_min, x_list_max, y_list_min, y_list_max = [], [], [], []
        x_min, x_max, y_min, y_max = np.inf, -np.inf, np.inf, -np.inf
        x_list_min.append(np.inf)
        y_list_min.append(np.inf)
        x_list_max.append(-np.inf)
        y_list_max.append(-np.inf)

        if not json_room_view_name_library_external_points:
            warning_log.append(string_id + ' is empty.')
        else:
            external_points_names = ['shutter','carcass','fillers','skirting','loft_skirting','cover_panels','internal']
            for items in list(json_room_view_name_library_external_points):
                if items in external_points_names:
                    if items == 'shutter':
                        
                        check_len = len(json_room_view_name_library_external_points[items])
                        if check_len > 0: #if anything in shutter
                            if json_room_view_name_library_external_points[items]:
                                len_out = 0

                                for item in list(json_room_view_name_library_external_points[items]):
                                    if json_room_view_name_library_external_points[items][item].has_key('handle'):
                                        if json_room_view_name_library_external_points[items][item]['handle'].has_key('outline'):
                                            string_id_shutter_handle = string_id + '[' + items + '][' + item + '][handle][outline]'
                                            error_log,  warning_log, lines, new_outline = self._outline(string_id_shutter_handle, json_room_view_name_library_external_points[items][item]['handle']['outline'], error_log, warning_log,limit_coord[0][0],limit_coord[0][1] )
                                            json_room_view_name_library_external_points[items][item]['handle']['outline'] = new_outline
                                            x_list_min.append(lines[0][0])
                                            x_list_max.append(lines[1][0])
                                            y_list_min.append(lines[0][1])
                                            y_list_max.append(lines[1][1])
                                    if 'outline' in list(json_room_view_name_library_external_points[items][item]):
                                        len_out = len(json_room_view_name_library_external_points[items][item]['outline'])
                                        string_id_shutter_outline = string_id + '[' + items + '][' + item + '][outline]'
                                        error_log,  warning_log, lines, new_outline = self._outline(string_id_shutter_outline, json_room_view_name_library_external_points[items][item]['outline'], error_log, warning_log,limit_coord[0][0],limit_coord[0][1],Shutter=True )
                                        json_room_view_name_library_external_points[items][item]['outline'] = new_outline
                                        x_list_min.append(lines[0][0])
                                        x_list_max.append(lines[1][0])
                                        y_list_min.append(lines[0][1])
                                        y_list_max.append(lines[1][1])
                                    if len_out != 4:
                                        del json_room_view_name_library_external_points[items][item]
                                        
                        else:
                            del json_room_view_name_library_external_points[items]
                    
                        
                    else: #Other than shutter
                        check_len = len(json_room_view_name_library_external_points[items])
                        if check_len > 0: #if anything is carcass fillers etc.

                            error_log,  warning_log, lines, new_outline = self._outline(string_id + '[' + items + ']', json_room_view_name_library_external_points[items], error_log, warning_log,limit_coord[0][0],limit_coord[0][1] )
                            json_room_view_name_library_external_points[items] = new_outline
                            x_list_min.append(lines[0][0])
                            x_list_max.append(lines[1][0])
                            y_list_min.append(lines[0][1])
                            y_list_max.append(lines[1][1])
                        else:
                            del json_room_view_name_library_external_points[items]
            
                else:
                    warning_log.append('Additional key ' + items + 'exists in ' + string_id)
            x_min = min(x_list_min)
            x_max = max(x_list_max)
            y_min = min(y_list_min)
            y_max = max(y_list_max)

        return error_log, warning_log, [[x_min,y_min],[x_max,y_max]]   
   

            
            







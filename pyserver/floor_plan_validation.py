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
            if isinstance(items, str):
                warning_log_clean.append(items)
        return warning_log_clean
    
    @property
    def json_object(self):
        return self.j_object

    @property
    def error(self):
        error_log_clean = []
        for items in self.error_log:
            if isinstance(items, str):
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
        if 'project_details' in json_object:
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
        if 'org_details' in json_object:
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
        if 'floor_plan' in json_object:
            json_floor_plan = json_object['floor_plan']
            if 'room_name_positions' in json_floor_plan and 'outline' in json_floor_plan:
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
                if 'room_name_positions' not in json_floor_plan:
                    if 'outline' not in json_floor_plan:
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
        if 'rooms' in json_object:
            json_rooms = json_object['rooms']
            if not json_rooms:
                error_log.append('Json object[rooms] is empty.')
            else:
                
                for items in list(json_rooms): #for all the rooms in room names
                    
                    if items in room_names: #when item exits in the list
                        self.room_view_names[items] = []
                        self.room_name.append(items)
                        json_room = json_rooms[items]
                        if 'room_top_view' in json_room:
                            self.room_view_names[items].append('room_top_view')
                            string_id = 'Json object[rooms]['+items+'][room_top_view]'
                            if 'views' not in json_room['room_top_view']:
                                del json_object['rooms'][items]
                            error_log, warning_log = self._room_top_view(self,string_id,json_room['room_top_view'],error_log, warning_log)
                        else:
                            error_log.append('The room ' + items + ' does not contain room_top_view.' )

                        #check_con = 
                        
                        if 'render_individual_comps' in json_room:
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
                        
                        # while view_number !=0 :
                        #     view_number_name = 'view_' + str(view_number)
                        #     if view_number_name in json_room :
                        #         if not json_room[view_number_name]:
                        #             warning_log.append('Json object[rooms]['+items+']['+view_number_name+'] is empty.') #error
                        #         else:
                        #             self.room_view_names[items].append(view_number_name)
                        #             string_id_view_number ='Json object[rooms]['+items+']['+view_number_name+']'
                        #             error_log, warning_log = self._room_view_number(self,string_id_view_number,json_room[view_number_name],error_log, warning_log)
                        #         view_number += 1
                        #     else:
                        #         if view_number == 1:
                        #             warning_log.append('The room ' + items + ' contains no views.' ) #error
                        #         view_number =0

                        for k in json_room.keys():
                            if (k != 'room_top_view' and k != 'render_individual_comps'):
                                string_id_view_number = 'Json object[rooms][' + \
                                    items+']['+k+']'
                                error_log, warning_log = self._room_view_number(
                                    self, string_id_view_number, json_room[k], error_log, warning_log)
                                self.room_view_names[items].append(
                                    k)
                        
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

            print(self.room_view_names, 'Room view names in _rooms')
                

                    
        
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
            check_con = 'outline' in json_room_top_view
            if check_con:
                room_top_view_outline = json_room_top_view['outline']
                error_log, warning_log, limit_coord, new_outline = self._outline(string_id+'[outline]', room_top_view_outline, error_log, warning_log, PerformCheck = True)
                json_room_top_view['outline'] = new_outline
                if('views' in json_room_top_view):
                    json_room_top_view_views = json_room_top_view['views']
                    for views in json_room_top_view_views.keys():
                        for j in range(0,len(json_room_top_view['views'][views])):
                            for i in range(0,(len(json_room_top_view['views'][views][j]))):
                                json_room_top_view['views'][views][j][i][0][0] = json_room_top_view['views'][views][j][i][0][0] - limit_coord[0][0]
                                json_room_top_view['views'][views][j][i][0][1] = json_room_top_view['views'][views][j][i][0][1] - limit_coord[0][1]
                                json_room_top_view['views'][views][j][i][1][0] = json_room_top_view['views'][views][j][i][1][0] - limit_coord[0][0]
                                json_room_top_view['views'][views][j][i][1][1] = json_room_top_view['views'][views][j][i][1][1] - limit_coord[0][1]

                            
                    #json_room_top_view['views'][views] = new_outline_views
                if('openings' in json_room_top_view):
                    json_room_top_view_views = json_room_top_view['openings']
                    for views in json_room_top_view_views.keys():
                        for i in range(0,(len(json_room_top_view['openings'][views]))):
                            json_room_top_view['openings'][views][i][0][0] = json_room_top_view['openings'][views][i][0][0] - limit_coord[0][0]
                            json_room_top_view['openings'][views][i][0][1] = json_room_top_view['openings'][views][i][0][1] - limit_coord[0][1]
                            json_room_top_view['openings'][views][i][1][0] = json_room_top_view['openings'][views][i][1][0] - limit_coord[0][0]
                            json_room_top_view['openings'][views][i][1][1] = json_room_top_view['openings'][views][i][1][1] - limit_coord[0][1]    
                
                json_room_top_view["thickness"] = int(self._thickness(limit_coord,'room_top_view'))
                
                check_len_outline = len(room_top_view_outline)
                # outline deleted if there is no values...json_room_top_view['outline']. 
                if check_len_outline == 0:
                    
                    del json_room_top_view['outline']
                
                else:
                    # del json_room_top_view['floor_components']
                    check_con = 'floor_components' in json_room_top_view
                    if check_con:
                        check_con1 = 'library' in json_room_top_view['floor_components']
                        if check_con1:
                            check_con2 = len(json_room_top_view['floor_components']['library'])
                            if check_con2 == 0:
                                del json_room_top_view['floor_components']
                                warning_log.append(string_id+'[floor_components][library] is empty.')
                            else:
                                json_room_top_view_library = json_room_top_view['floor_components']['library']
                                error_log, warning_log, lines = self._room_top_view_library_or_external(self,string_id+'[floor_components][library]',json_room_top_view_library,error_log, warning_log,limit_coord,new_outline)
                                x_list_min.append(lines[0][0])
                                y_list_min.append(lines[0][1])
                                x_list_max.append(lines[1][0])
                                y_list_max.append(lines[1][1])
                        else:
                            del json_room_top_view['floor_components']
                            warning_log.append(string_id + '[floor_components] does not contain the key name library') #error
                    else:
                        warning_log.append(string_id + 'does not contain the key name floor_components') #error
                    
                    del json_room_top_view['external']
                    check_con = 'external' in json_room_top_view
                    if check_con:
                        
                        check_len = len(json_room_top_view['external'])
                        if check_len == 0:
                            del json_room_top_view['external']
                        else:
                            json_room_top_view_external = json_room_top_view['external']
                            error_log, warning_log, lines = self._room_top_view_library_or_external(self,string_id+'[external]',json_room_top_view_external,error_log, warning_log,limit_coord,new_outline)
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
                
        # if good == 0:
        #     error_log.append(string_id + ': Components/external are outsize the outline')
        return error_log, warning_log

    
    

    @staticmethod 
    def _room_top_view_library_or_external(self,string_id,json_room_top_view_library,error_log, warning_log, limit_coord, room_outline):
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
                    if 'comp_details' in json_room_top_view_library[items]:
                        if len(json_room_top_view_library[items]['comp_details']) < 5:
                            warning_log.append('Some items are missing from ' + string_id+'['+items+'][comp_details].')
                        elif len(json_room_top_view_library[items]['comp_details']) > 5:
                            warning_log.append('Some additional items exists in ' + string_id+'['+items+'][comp_details].')
                        # if json_room_top_view_library[items]['comp_details']['materials']:
                        #     mat_tmp = json_room_top_view_library[items]['comp_details']['materials']
                        #     mat_set = set(mat_tmp)
                        #     json_room_top_view_library[items]['comp_details']['materials'] = list(mat_set)
                        if json_room_top_view_library[items]['comp_details']['accessories']:
                            mat_tmp = json_room_top_view_library[items]['comp_details']['accessories']
                            mat_set = set(mat_tmp)
                            json_room_top_view_library[items]['comp_details']['acceessories'] = list(mat_set)
                            
                    else:
                        warning_log.append(string_id+'['+items+'] has no key comp_details.')
                    
                    if 'outline' in json_room_top_view_library[items]:
                        error_log, warning_log, lines, new_outline = self._outline(string_id+'['+items+'][outline]',json_room_top_view_library[items]['outline'],error_log, warning_log,limit_coord[0][0],limit_coord[0][1])
                        # if(lines[0][0] < limit_coord[0][0] or lines[0][1] < limit_coord[0][1] or lines[1][0] > limit_coord[1][0] or lines[1][1] > limit_coord[1][1]):
                        #     del json_room_top_view_library[items]
                        #     continue

                        if self._check_on_outline(room_outline, new_outline) == True:
                            del json_room_top_view_library[items]
                            continue

                        if 'filler' in str(items).lower() or 'skirting' in str(items).lower() or 'ledge' in str(items).lower():
                            del json_room_top_view_library[items]
                            continue
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
    def _check_on_outline(r_outline, c_outline):
        
        for x in c_outline:
            #Vertical line
            x_ver, x_hor = np.inf, np.inf
            
            if x[0][0]==x[1][0]:
                x_ver = abs(x[1][1]-x[0][1])
            #Horizonal Line
            if x[0][1] == x[1][1]:
                x_hor = abs(x[0][0]-x[1][0])
            for y in r_outline:
                if x[0][0]==x[1][0] and y[0][0]==y[1][0] and x[0][0]==y[0][0]:
                    if x[1][1]<x[0][1]:
                        x[1][1],x[0][1] = x[0][1],x[1][1]
                    if y[1][1]<y[0][1]:
                        y[1][1], y[0][1] = y[0][1], y[1][1]
                    if y[0][1]<=x[0][1] and y[1][1]>=x[1][1]:
                        return True
                    if y[0][1]>x[0][1] and y[0][1]<x[1][1]:
                        x_ver = x_ver - (x[1][1]-y[0][1])
                        if x_ver == 0:
                            return True
                    if y[1][1]>x[0][1] and y[1][1]<x[1][1]:
                        x_ver = x_ver - (y[1][1]-x[0][1])
                        if x_ver == 0:
                            return True
                    
                if x[0][1]==x[1][1] and y[0][1]==y[1][1] and x[0][1]==y[0][1]:
                    if x[0][0]>x[1][0]:
                        x[0][0], x[1][0] = x[1][0], x[0][0]
                    if y[0][0]>y[1][0]:
                        y[0][0], y[1][0] = y[1][0], y[0][0]
                    if y[0][0]<=x[0][0] and y[1][0] >= x[1][0]:
                        return True
                    if y[0][0] >x[0][0] and y[0][0]<x[1][0]:
                        x_hor = x_hor - (x[1][0]-y[0][0])
                        if x_hor == 0:
                            return True
                    if y[1][0]>x[0][0] and y[1][0]<x[1][0]:
                        x_hor = x_hor - (y[1][0]-x[0][0])
                        if x_hor == 0:
                            return True
            if x_hor==0 or x_ver==0:
                return True


        return False

    @staticmethod
    def _get_intersect(a1, a2, b1, b2):
        """ 
        Returns the point of intersection of the lines passing through a2,a1 and b2,b1.
        a1: [x, y] a point on the first line
        a2: [x, y] another point on the first line
        b1: [x, y] a point on the second line
        b2: [x, y] another point on the second line
        """
        s = np.vstack([a1,a2,b1,b2])        # s for stacked
        h = np.hstack((s, np.ones((4, 1)))) # h for homogeneous
        l1 = np.cross(h[0], h[1])           # get first line
        l2 = np.cross(h[2], h[3])           # get second line
        x, y, z = np.cross(l1, l2)          # point of intersection
        if z == 0:                          # lines are parallel
            return (float('inf'), float('inf'))
        return (x/z, y/z)

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
                        check_con = 'image_url' in json_room_view_number['render_wall_view']
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
                        check_con = 'outline' in json_room_view_number[view_items]
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
                                check_con1 = 'floor_components' in json_room_view_number[view_items]
                                
                                if check_con1: #floor components exists
                                    check_con2 = 'library' in json_room_view_number[view_items]['floor_components']
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
                                                    if 'comp_details' in json_room_view_name_library[items]:
                                                        if len(json_room_view_name_library[items]['comp_details']) < 5:
                                                            warning_log.append('Some items are missing from ' + string_floor_library+'['+items+'][comp_details].')
                                                        elif len(json_room_view_name_library[items]['comp_details']) > 5:
                                                            warning_log.append('Some additional items exists in ' + string_floor_library+'['+items+'][comp_details].')
                                                        
                                                        # if json_room_view_name_library[items]['comp_details']['materials']:
                                                        #     mat_tmp = json_room_view_name_library[items]['comp_details']['materials']
                                                        #     mat_set = set(mat_tmp)
                                                        #     json_room_view_name_library[items]['comp_details']['materials'] = list(mat_set)
                                                        if json_room_view_name_library[items]['comp_details']['accessories']:
                                                            mat_tmp = json_room_view_name_library[items]['comp_details']['accessories']
                                                            mat_set = set(mat_tmp)
                                                            json_room_view_name_library[items]['comp_details']['acceessories'] = list(mat_set)
                                                    else:
                                                        warning_log.append(string_floor_library+'['+items+'] has no key comp_details.')
                                                    
                                                    if 'external_points' in list(json_room_view_name_library[items]):
                                                        check_len_ext = len(json_room_view_name_library[items]['external_points'])
                                                        if check_len_ext != 0 :
                                                            warning_log, lines = self._library_external_points(self, string_floor_library+'['+items+'][external_points]',json_room_view_name_library[items]['external_points'],error_log, warning_log,limit_coord)
                                                            # if not(lines[0][0] < limit_coord[0][0] or lines[0][1] < limit_coord[0][1] or lines[1][0] > limit_coord[1][0] or lines[1][1] > limit_coord[1][1]):
                                                                
                                                            x_list_min.append(lines[0][0])
                                                            x_list_max.append(lines[1][0])
                                                            y_list_min.append(lines[0][1])
                                                            y_list_max.append(lines[1][1])
                                                            if not(lines[0][0] < limit_coord[0][0] or lines[0][1] < limit_coord[0][1] or lines[1][0] > limit_coord[1][0] or lines[1][1] > limit_coord[1][1]):
                                                                print('Items outside the outline ', items)
                                                            #     del json_room_view_name_library[items]
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
                                            #when library is empty we delete the front/internal view
                                            del json_room_view_number[view_items]
                                            continue;
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
                                                    if not(lines[0][0] < limit_coord[0][0] or lines[0][1] < limit_coord[0][1] or lines[1][0] > limit_coord[1][0] or lines[1][1] > limit_coord[1][1]):
                                                                
                                                        x_list_min.append(lines[0][0])
                                                        x_list_max.append(lines[1][0])
                                                        y_list_min.append(lines[0][1])
                                                        y_list_max.append(lines[1][1])
                                                    else: 
                                                        print('Item deleted external ',view_items)
                                                        del json_room_view_number[view_items]['external']
                                                    # x_list_min.append(lines[0][0])
                                                    # x_list_max.append(lines[1][0])
                                                    # y_list_min.append(lines[0][1])
                                                    # y_list_max.append(lines[1][1])
                                                #check what to do with it
                                    else:
                                        warning_log.append(string_floor_external+ 'is empty.' )
                                        del json_room_view_number[view_items]['external']

                                if 'openings' in list(json_room_view_name):
                                    string_floor_external = string_id + '][' +view_items + '][openings]'

                                    if len(json_room_view_name['openings']) != 0:
                                        for openings_dw in list(json_room_view_name['openings']):
                                            if json_room_view_name['openings'][openings_dw]:
                                                json_room_view_name_external_item = json_room_view_name['openings'][openings_dw]
                                                string_outline = string_floor_external + '[' +openings_dw + ']'
                                                error_log, warning_log, lines, new_outline = self._outline(string_outline, json_room_view_name_external_item, error_log, warning_log,limit_coord[0][0],limit_coord[0][1])
                                                json_room_view_name['openings'][openings_dw] = new_outline
                                                if not(lines[0][0] < limit_coord[0][0] or lines[0][1] < limit_coord[0][1] or lines[1][0] > limit_coord[1][0] or lines[1][1] > limit_coord[1][1]):
                                                                
                                                    x_list_min.append(lines[0][0])
                                                    x_list_max.append(lines[1][0])
                                                    y_list_min.append(lines[0][1])
                                                    y_list_max.append(lines[1][1])
                                                else: 
                                                    print('Item deleted openings ',view_items)
                                                    del json_room_view_number[view_items]['openings'][openings_dw]
                                                # x_list_min.append(lines[0][0])
                                                # x_list_max.append(lines[1][0])
                                                # y_list_min.append(lines[0][1])
                                                # y_list_max.append(lines[1][1])
                                                #check what to do with it
                                    else:
                                        warning_log.append(string_floor_external+ 'is empty.' )
                                        del json_room_view_number[view_items]['openings']

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
                                    if 'handle' in json_room_view_name_library_external_points[items][item]:
                                        if 'outline' in json_room_view_name_library_external_points[items][item]['handle']:
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

        return warning_log, [[x_min,y_min],[x_max,y_max]]   
   

            
            







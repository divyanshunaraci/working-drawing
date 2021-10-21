#This class is used for all views in view_1 and view_2 such as front view, internal view and top view and also works for room top view
import numpy as np
class floor_plan_component1(object):

    def __init__(self,room_name, view_name, view_angle,j_object):
        self.j_object = j_object

        self.room_name, self.view_name = room_name,view_name
        if self.view_name != 'room_top_view':
            self.view_angle = view_angle
            
        else:
            
            self.all_1_data = view_angle
        
        self.dimension_list, self.component, self.ID_dict = self.return_new_j_object(self)
        

    @property
    def components(self):
        return self.component    
    
    @property
    def data(self): #data to return
        return self.dimension_list
    
    @property
    def texts(self):
        return self.ID_dict
        
    

    @staticmethod
    def return_new_j_object(self):
        if self.view_name == 'room_top_view':
            drawing_list, component_list, ID_dict = self.output_list_room_top_views(self)  
        else:
            drawing_list, component_list, ID_dict = self.output_list_views(self)
        return drawing_list, component_list, ID_dict


    @staticmethod
    def __clean_drawing_list(drawing_list):
        for i in range(len(drawing_list)-1,0,-1):
            if len(drawing_list[i][0]) == 0:
                del drawing_list[i]
            elif len(drawing_list[i][1]) == 0:
                del drawing_list[i]
        return drawing_list


    @staticmethod
    def output_list_room_top_views(self):
        #
        dict_for_view={}
        ID_dict = {}
        room_name, view_name, j_object = self.room_name,self.view_name, self.j_object
        if 'outline' in j_object['rooms'][room_name][view_name]:
            component_list = []
            '''Room top view outline is stored in drawing_1_list'''
            drawing_1_list = j_object['rooms'][room_name][view_name]['outline']
            if len(drawing_1_list) != 0:
                '''Any edges which are missing any coordinates are deleted in this function'''
                drawing_1_list  = self.__clean_drawing_list(drawing_1_list)
                #converting the list to dictionary of  for outline
                dict_for_view['outline'] = self.__create_dict(self,drawing_1_list,True)
                if 'openings' in list(j_object['rooms'][room_name][view_name]):
                    for items in j_object['rooms'][room_name][view_name]['openings']:
                        if len(j_object['rooms'][room_name][view_name]['openings'][items]) >0:
                            drawing_2_list= j_object['rooms'][room_name][view_name]['openings'][items]
                            drawing_2_list = self.__clean_drawing_list(drawing_2_list)
                            drawing_1_list += drawing_2_list
                            dict_for_view['openings'+items] = self.__create_dict(self,drawing_2_list)
                if 'floor_components' in list(j_object['rooms'][room_name][view_name]):
                    if 'library' in list(j_object['rooms'][room_name][view_name]['floor_components']):

                        for items in j_object['rooms'][room_name][view_name]['floor_components']['library']:
                            if view_name == "top_view":
                                if 'cover_panel' in items:
                                    continue
                            drawing_2_list= j_object['rooms'][room_name][view_name]['floor_components']['library'][items]['outline']
                            drawing_2_list  = self.__clean_drawing_list(drawing_2_list)
                            
                            xx = str(items).lower()
                            
                            #converting the list to dictionary for components
                            # dict_for_view[items] = self.__create_dict(self,drawing_2_list)
                            drawing_1_list += drawing_2_list
                            if 'filler' not in xx and 'ledge' not in xx:
                                if 'cover_panel' in xx:
                                    dict_for_view[items] = self.__create_dict(self,drawing_2_list)
                                    component_list += drawing_2_list
                                else:
                                    dict_for_view[items] = self.__create_dict(self,drawing_2_list)
                                    component_list += drawing_2_list
                                    ID_dict[items] =  dict_for_view[items]['dims']
                        
                        #Getting the dimension list from dictionary and the list of demarkation of rooms
                
                dimension_list = self.__creating_dimensions_room_top_view(self,dict_for_view,drawing_1_list)
                for x, y in dimension_list['IDs'].items():
                    if 'cover_panel' in x:
                        dimension_list['IDs'].pop(x)
                """ t_d2 = dict1[keys]['dims']
            x0c, y0c = t_d2['x0'], t_d2['y0']
            xnc, ync = t_d2['xn'], t_d2['yn']"""
                return dimension_list, component_list, ID_dict
            else:  #if outline of room top view is empty
                return [], [], {}
        else: #if outline does not exist in room top view
            return [], [], {}      

    @staticmethod
    def output_list_views(self):
        
        dict_for_view={}
              
        room_name, view_name, view_angle, j_object = self.room_name,self.view_name,self.view_angle, self.j_object
        component_list = []
        
        if j_object['rooms'][room_name][view_name][view_angle].has_key('outline'):
            drawing_1_list = []
            drawing_1_list = j_object['rooms'][room_name][view_name][view_angle]['outline'] 

            if len(drawing_1_list) != 0 :
                dict_for_view['outline'] = self.__create_dict(self,drawing_1_list,True)
                if 'floor_components' in j_object['rooms'][room_name][view_name][view_angle]:
                    if 'library' in j_object['rooms'][room_name][view_name][view_angle]['floor_components']:
                        for items in j_object['rooms'][room_name][view_name][view_angle]['floor_components']['library']:
                            
                            #cover panels removed from front view
                            item_check = str(items).lower()
                            if 'cover_panel' in item_check:
                                continue
                            if 'external_points' in j_object['rooms'][room_name][view_name][view_angle]['floor_components']['library'][items]:
                                drawing_2_list = []
                                if view_angle == 'internal_view':
                                    item_ext = ['internal','carcass']
                                else:
                                    item_ext = ['internal','carcass','skirting','loft_skirting','cover_panels','fillers']
                                for internal_items in item_ext: #'fillers'
                                    if internal_items in j_object['rooms'][room_name][view_name][view_angle]['floor_components']['library'][items]['external_points']:
                                        drawing_2_list+= j_object['rooms'][room_name][view_name][view_angle]['floor_components']['library'][items]['external_points'][internal_items]
                                    
                                    if 'shutter' in j_object['rooms'][room_name][view_name][view_angle]['floor_components']['library'][items]['external_points']:
                                        for item in j_object['rooms'][room_name][view_name][view_angle]['floor_components']['library'][items]['external_points']['shutter']:
                                            if 'outline' in j_object['rooms'][room_name][view_name][view_angle]['floor_components']['library'][items]['external_points']['shutter'][item]:
                                                drawing_2_list+= j_object['rooms'][room_name][view_name][view_angle]['floor_components']['library'][items]['external_points']['shutter'][item]['outline']
                                            if 'handle' in j_object['rooms'][room_name][view_name][view_angle]['floor_components']['library'][items]['external_points']['shutter'][item]:
                                                if 'outline' in j_object['rooms'][room_name][view_name][view_angle]['floor_components']['library'][items]['external_points']['shutter'][item]['handle']:
                                                    if len(j_object['rooms'][room_name][view_name][view_angle]['floor_components']['library'][items]['external_points']['shutter'][item]['handle']['outline']) != 0:
                                                        component_list += j_object['rooms'][room_name][view_name][view_angle]['floor_components']['library'][items]['external_points']['shutter'][item]['handle']['outline']
                                
                                 
                                if len(drawing_2_list) != 0:
                                                            
                                    dict_for_view[items] = self.__create_dict(self,drawing_2_list)
                                    component_list += drawing_2_list
                                    drawing_1_list += drawing_2_list 
                                    
                                        


                if view_angle == 'internal_view':
                    dimension_list = self.__creating_dimensions_internal(self,dict_for_view,drawing_1_list)
                else: #front view and top view
                    
                    dimension_list = self.__creating_dimensions_top_front(self,dict_for_view,drawing_1_list) 
                    
            else:
                dimension_list = []
        else:
            dimension_list = []
        return dimension_list, component_list, {}

    @staticmethod
    def __component_ID_detail(dict1):
        
        outline_dim = dict1['outline']['dims']
        x0, y0 = outline_dim['x0'], outline_dim['y0']
        com_dtemp = {}
        rank = []
        def __unique_rank_number(rank, keys, com_dtemp, r1):
            if not r1 in list(com_dtemp):
                com_dtemp[r1] = keys
                rank.append(r1)
            else:
                r1 += 1
                rank=__unique_rank_number(rank, keys, com_dtemp, r1)
            return rank

        for keys in dict1:
            if keys == 'outline' or 'openings' in keys:
                continue
            t_d2 = dict1[keys]['dims']
            
            x0c, y0c, xnc, ync = t_d2['x0'], t_d2['y0'], t_d2['xn'], t_d2['yn']
            xc, yc = (x0c+xnc)/2, (y0c+ync)/2
            r1 = np.sqrt((xc-x0)^2+(yc-y0)^2)+np.power((yc-y0),2)
            
            rank = __unique_rank_number(rank, keys, com_dtemp, r1)
            """com_dtemp[r1] = keys
            rank.append(r1) """
        #ascend the rank then call the com_dtemp to define the names
        rank = sorted(rank)
        com_ID={}
        for i in range(len(rank)):
            c_ID = 'C-'+str(i+1)
            com_ID[com_dtemp[rank[i]]] = c_ID
        return com_ID


    
    def __unique_rank_number(rank, keys, com_dtemp, r1):
        if not r1 in list(com_dtemp):
            com_dtemp[r1] = keys
            rank.append(r1)
        else:
            r1 += 1
            rank=__unique_rank_number(rank, keys, com_dtemp, r1)
        return rank


    @staticmethod
    def __creating_dimensions_internal(self,dict1,drawing_list):
        #the_array = self.__creating_drawing_shade(dict1)
        dim_dict, dimension_list, outline_dim = {'hor':{}, 'ver': {}}, [], dict1['outline']['dims']
       
        dim_dict, dimension_list = self.draw_inner_dimension_component(self,dim_dict,dimension_list,dict1)
        
        x0, y0, xn, yn = outline_dim['x0'], outline_dim['y0'], outline_dim['xn'], outline_dim['yn']    #xi0, yi0, xin, yin = outline_dim['xi0'], outline_dim['yi0'], outline_dim['xin'], outline_dim['yin']   
        lengths = {'x0' :x0, 'y0' : y0 , 'xn' : xn, 'yn' :yn, 'length' : xn-x0, 'width' : yn- y0}
        com_ID= self.__component_ID_detail(dict1)
        

        return {'dimension': dimension_list, 'lengths': lengths, 'IDs':com_ID}


    @staticmethod
    def draw_inner_dimension_component(self,dim_dict,dimension_list,dict1):
        for keys in dict1: #this we are doing for inner dimension of the component
            if keys == 'outline':
                continue
            
            ls1, ls2 = self.__reveal_keys(dict1[keys]['horizontal']), self.__reveal_keys(dict1[keys]['vertical'])

            dim_dict, dimension_list =self.make_horizontal_vertical_line_internal(ls1,'ver',dim_dict,dimension_list,keys,dict1) #str1 ==ver or hor
            dim_dict, dimension_list =self.make_horizontal_vertical_line_internal(ls2,'hor',dim_dict,dimension_list,keys,dict1) #str1 ==ver or hor
        return dim_dict, dimension_list

          
    @staticmethod
    def make_horizontal_vertical_line_internal(ls1,str1,dim_dict,dimension_list,keys,dict1): #str1 ==ver or hor
        f_str1 = 'horizontal' if str1 == 'ver' else 'vertical'
        for i in range(len(ls1)-2):        
            if ls1[i+1] - ls1[i] > 50:
                ver_string = 'v' + str(ls1[i]) + '&' + str(ls1[i+1]) if str1 == 'ver' else 'h' + str(ls1[i]) + '&' + str(ls1[i+1])
                if not dim_dict[str1].has_key(ver_string):
                    x_opt = 100 + max(dict1[keys][f_str1][ls1[i]][0][0],dict1[keys][f_str1][ls1[i+1]][0][0])
                    dim_dict[str1][ver_string] = [x_opt,[ls1[i],ls1[i+1]]]
                    if str1 == 'ver':
                        dimension_list.append([[x_opt,ls1[i]],[x_opt,ls1[i+1]]])  
                    else:
                        dimension_list.append([[ls1[i],x_opt],[ls1[i+1],x_opt]]) 
        return dim_dict, dimension_list

    @staticmethod
    def __draw_overall_dimension_component(self,dict1,str1,dim_dict,the_array,outline_dim,outer_dim_dict,dimension_list):
        #this we are doing for overall dimension of the component
        # print(dim_dict,'Check 1')
        unique_dim_x = []
        unique_dim_y = []
        for keys in dict1: 
            if keys == 'outline' or 'cover_panel' in keys or 'filler' in keys or 'skirting' in keys:
                continue
            t_d2 = dict1[keys]['dims']
            x0c, y0c = t_d2['x0'], t_d2['y0']
            xnc, ync = t_d2['xn'], t_d2['yn']
            
            x_dim = abs(xnc-x0c)
            y_dim = abs(ync-y0c)
            xtmp = 'front_view'
            if str1 == 'room_top_view':
                ps = y0c -100
                pe = ps + 100
                x0, y0 = outline_dim['x0'], outline_dim['y0']
                qw = sum(the_array[x0c-x0:xnc-x0,ps-y0:pe-y0])
                if (x_dim in unique_dim_x or y_dim in unique_dim_y or isinstance(qw,int)):
                    continue
                unique_dim_x.append(x_dim)
                unique_dim_y.append(y_dim)
                def line_equation(a1,b1,a2,b2,c1,c2):
                    x1 = abs(b1-c2)
                    x2 = abs(c2-b2)
                    y1 = abs(a1-c1)
                    y2 = abs(c1-a2)
                    if(min(x1,x2,y1,y2)==x1 or min(x1,x2,y1,y2)==x2):
                        return 'hor'
                    return 'ver'   
                    # return abs(((a1-b1)*(a2-c2))-((a2-b2)*(a1-c1)))/np.sqrt(((a1-b1)*(a1-b1))+((a2-b2)*(a2-b2)))
                midc_x = (x0c+xnc)/2
                midc_y = (y0c+ync)/2
                xtmp = line_equation(outline_dim['x0'],outline_dim['y0'],outline_dim['xn'],outline_dim['yn'],midc_x,midc_y)
                # if xxx == 'hor'

            hor_string = 'h' + str(x0c) + '&' + str(xnc)
            ver_string = 'v' + str(y0c) + '&' + str(ync)

            if dim_dict['hor'].has_key(hor_string) and dim_dict['ver'].has_key(ver_string):
                then_chill = 1 #because both the dimensions are already displayed and listed in dim_dict

            elif not dim_dict['hor'].has_key(hor_string) and dim_dict['ver'].has_key(ver_string): #vertical exists but horizontal does not exist
                if str1 == 'room_top_view' and xtmp == 'ver':
                    y_opt = self.__update_hornver_dim_room_top_view(self,t_d2,the_array,outline_dim,outer_dim_dict,'y_opt')
                else:
                    y_opt = self.__update_hornver_dim(self,t_d2,the_array,outline_dim,outer_dim_dict,'y_opt')
                if(xtmp == 'ver'):
                    dim_dict['hor'][hor_string] = [y_opt, [x0c,xnc]]
                    dimension_list.append([[x0c,y_opt],[xnc,y_opt]])
                else:
                    dim_dict['hor'][hor_string] = [y_opt, [x0c,xnc]]
                    dimension_list.append([[x0c,y_opt],[xnc,y_opt]])
            elif dim_dict['hor'].has_key(hor_string) and not dim_dict['ver'].has_key(ver_string): #horizontal exists but vertical does not exists
                if str1 == 'room_top_view' and xtmp == 'hor':
                    x_opt = self.__update_hornver_dim_room_top_view(self,t_d2,the_array,outline_dim,outer_dim_dict,'x_opt')
                else:
                    x_opt = self.__update_hornver_dim(self,t_d2,the_array,outline_dim,outer_dim_dict,'x_opt')
                if xtmp == 'hor':
                    dim_dict['ver'][ver_string] = [x_opt, [y0c,ync]]
                    dimension_list.append([[x_opt,y0c],[x_opt,ync]])
                else:
                    dim_dict['ver'][ver_string] = [x_opt, [y0c,ync]]
                    dimension_list.append([[x_opt,y0c],[x_opt,ync]])

            else: # both L and B of the component do not exist
                if str1 == 'room_top_view':
                    randomNumber = 1 #this to be debugged later
                    x_opt, y_opt = self.__update_hornver_dim_room_top_view(self,t_d2,the_array,outline_dim,outer_dim_dict,'xy_opt')
                    
                else:
                    x_opt, y_opt = self.__update_hornver_dim(self,t_d2,the_array,outline_dim,outer_dim_dict,'xy_opt')
                # the problem is y_opt does not take into acccount if x1-x2 has already been shown
                
                if (xtmp == 'ver'):
                    dim_dict['hor'][hor_string] = [y_opt, [x0c,xnc]]
                    dimension_list.append([[x0c,y_opt],[xnc,y_opt]])
                
                elif (xtmp == 'hor'):
                    dim_dict['ver'][ver_string] = [x_opt, [y0c,ync]]
                    dimension_list.append([[x_opt,y0c],[x_opt,ync]])
                
                if xtmp == 'front_view':
                    dim_dict['hor'][hor_string] = [y_opt, [x0c,xnc]]
                    dimension_list.append([[x0c,y_opt],[xnc,y_opt]])
                    dim_dict['ver'][ver_string] = [x_opt, [y0c,ync]]
                    dimension_list.append([[x_opt,y0c],[x_opt,ync]])

        return dimension_list




    @staticmethod
    def __creating_dimensions_room_top_view(self,dict1,drawing_list):
        """return dimension list from dictionary and drawing list"""
        #creates the array shade that determines where to place dimension and where not to place it
        the_array = self.__creating_drawing_shade_room_top_view(self,dict1)
        
        outline_dim = dict1['outline']['dims']
        dim_dict = {'hor':{}, 'ver': {}}
        outer_dim_dict = {'hor':{}, 'ver': {}}
        dimension_list = []

        #Add distances for components
        dimension_list = self.__distance_to_component_room_top_view(self, dict1, outer_dim_dict, dim_dict, dimension_list, 200)
        

        #drwaing overall component dimensions
        # dimension_list = self.__draw_overall_dimension_component(self,dict1,'room_top_view',dim_dict,the_array,outline_dim,outer_dim_dict,dimension_list)
        
                
        #drawing inner dimension of the component
        ###dim_dict, dimension_list = self.draw_inner_dimension_component(self,dim_dict,dimension_list,dict1)

        
        x0, y0 = dict1['outline']['dims']['x0'], dict1['outline']['dims']['y0']
        xn, yn = dict1['outline']['dims']['xn'], dict1['outline']['dims']['yn']
        
       
        hor_string = 'h' + str(x0) + '&' + str(xn)
        y1 = self.__checking_outer_existence(self,outer_dim_dict,'hor', y0-200,-1, x0,xn, x0,xn)
        dim_dict['hor'][hor_string] = [y1,[x0,xn]]
        dimension_list.append([[x0,y1],[xn,y1]])

        ver_string = 'v' + str(y0) + '&' + str(yn)
        x1 = self.__checking_outer_existence(self,outer_dim_dict,'ver', x0-200,-1, y0,yn,y0,yn)
        dim_dict['ver'][ver_string] = [x1, [y0,yn]]
        dimension_list.append([[x1,y0],[x1,yn]])

        #Add distances for components
        #dimension_list = self.__distance_to_component(self, dict1, outer_dim_dict, dim_dict, dimension_list, 200)
        
        lengths = {'x0' :x0, 'y0' : y0 , 'xn' : xn, 'yn' :yn, 'length' : xn-x0, 'width' : yn- y0}
        com_ID= self.__component_ID_detail(dict1)
        return {'dimension': dimension_list, 'lengths': lengths, 'IDs':com_ID}

    @staticmethod
    def __distance_to_component_room_top_view(self,dict1, outer_dim_dict, dim_dict,dimension_list,thickness):
        x0, y0 = dict1['outline']['dims']['x0'], dict1['outline']['dims']['y0']
        xn, yn = dict1['outline']['dims']['xn'], dict1['outline']['dims']['yn']
        xc0, yc0 = (x0 + xn)/2, (y0 +yn)/2

        #quad_info = {'hor':{1:[],2:[],3:[],4:[]},'ver':{1:[],2:[],3:[],4:[]} }
        quad_info = {'hor':{1:set(),2:set(),3:set(),4:set()},'ver':{1:set(),2:set(),3:set(),4:set()} }

        for keys in dict1:
            if keys == 'outline':
                continue
            t_d2 = dict1[keys]['dims']
            x0c, y0c = t_d2['x0'], t_d2['y0']
            xnc, ync = t_d2['xn'], t_d2['yn']

            #Drawing the horizontal distance first
            quadrant_x = (x0c+xnc)/2 - xc0 #if negative then on the left side, otherwise right
            quadrant_y = (y0c+ync)/2 - yc0 #if negative then on the bottom side, otherwise top  
            
            #total 4 cases
            if quadrant_x == 0 and quadrant_y == 0 or quadrant_x >= 0 and quadrant_y >= 0: #quadrant 1 - top right
                #define x1, x2, y1 and y2 for each case
                x1, x2, y1, y2 = xnc, xn, ync, yn
                #hor_start_pt, ver_start_pt = yn + 200, xn + 200
                hor_up_down, ver_up_down = 1, 1
                hor_start_pt, ver_start_pt = yn + hor_up_down * 250, xn + ver_up_down * 250
                quadrant = 1

            elif quadrant_x <= 0 and quadrant_y <= 0: #quadrant 3 - bottom left
                x1, x2, y1, y2 = x0, x0c, y0, y0c
                #hor_start_pt, ver_start_pt = y0 - 200, x0 - 200
                hor_up_down, ver_up_down = -1, -1
                hor_start_pt, ver_start_pt = y0 + hor_up_down * 250, x0 + ver_up_down * 250
                quadrant = 3
            
            elif quadrant_x <= 0 and quadrant_y >= 0: #quadrant 2 - top left
                x1, x2, y1, y2 = x0, x0c, ync, yn
                #hor_start_pt, ver_start_pt = yn + 200, x0 - 200
                hor_up_down, ver_up_down = 1, -1
                hor_start_pt, ver_start_pt = yn + hor_up_down * 250, x0 + ver_up_down * 250
                quadrant = 2

            elif quadrant_x >= 0 and quadrant_y <= 0: #quadrant 4 - bottom right
                x1, x2, y1, y2 = xnc, xn, y0, y0c
                #hor_start_pt, ver_start_pt = y0 - 200, xn + 200
                hor_up_down, ver_up_down = -1, 1
                hor_start_pt, ver_start_pt = y0 + hor_up_down * 250, xn + ver_up_down * 250
                quadrant = 4
            
            #check whether to draw horizontal or vertical dim
            hor_dim_check = True
            ver_dim_check = True

            if x1 == x2: #check whether to draw horizontal or vertical dim
                hor_dim_check = False
            if y1 == y2:
                ver_dim_check = False

            if hor_dim_check:
                quad_info['hor'][quadrant].add(x1) # storing the data earlier to squeeze it
                quad_info['hor'][quadrant].add(x2) 

            if ver_dim_check:
                quad_info['ver'][quadrant].add(y1) # storing the data earlier to squeeze it
                quad_info['ver'][quadrant].add(y2)

        """ 
            1: xn, yn, yn +1, xn +1
            2: x0, yn, yn +1, x0 -1
            3: x0, y0, y0 -1, x0 -1
            4: xn, y0, y0 -1, xn +1 
            """

        #####
        help_outer_dim_dis = {'hor':{1:1,2:1,3:-1,4:-1},'ver':{1:1,2:-1,3:-1,4:1}}
        
        # print(x0,y0,xn,yn,'Wall coordinates')
        # print(quad_info,'QUAD INFO before splicing')
        for q_value in list(quad_info['hor']):
            all_coords_tmp = list(quad_info['hor'][q_value])
            all_coords_tmp.sort()
            # print(all_coords_tmp,'all coords tmp hor')
            
            if len(all_coords_tmp)>2:
                if all_coords_tmp[0] == x0:
                    all_coords_tmp = all_coords_tmp[0:3]
                if all_coords_tmp[len(all_coords_tmp)-1] == xn:
                    all_coords_tmp = all_coords_tmp[len(all_coords_tmp)-3:len(all_coords_tmp)]
                quad_info['hor'][q_value] = all_coords_tmp

        for q_value in list(quad_info['ver']):
            all_coords_tmp = list(quad_info['ver'][q_value])
            all_coords_tmp.sort()
            # print(all_coords_tmp,'all coords tmp ver')
            
            if len(all_coords_tmp)>2:
                if all_coords_tmp[0] == y0:
                    all_coords_tmp = all_coords_tmp[0:3]
                if all_coords_tmp[len(all_coords_tmp)-1] == yn:
                    all_coords_tmp = all_coords_tmp[len(all_coords_tmp)-3:len(all_coords_tmp)]
                quad_info['ver'][q_value] = all_coords_tmp

        # print(quad_info,'QUAD INFO after splicing')
            
        for dirn in list(quad_info): #'hor 'ver'
            if dirn == 'hor': #when horizonal
                zz = [y0, yn]
                ww = [x0, xn]
            else: #when vertical
                zz = [x0, xn]
                ww = [y0, yn]
            for quad in list(quad_info[dirn]): #1 2 3 4 
                all_coords = list(quad_info[dirn][quad])
                all_coords.sort()
                quad_info[dirn][quad] = all_coords
                pick = 1 if help_outer_dim_dis[dirn][quad] == 1 else 0 #this determines which end is chosen
                start_pt = zz[pick] + help_outer_dim_dis[dirn][quad]*200
                up_down = help_outer_dim_dis[dirn][quad]
                if len(all_coords) < 2:
                    continue

                z_optimum = self.__checking_outer_existence(self, outer_dim_dict, dirn, start_pt, up_down, all_coords[0], all_coords[-1], ww[0], ww[1], thickness) 
                # at the location of z_optimum all the dimension are drawn in all_coords
                for it1 in range(0, len(all_coords)-1):
                    if all_coords[it1+1] - all_coords[it1] < 10 :
                        continue
                    zer_string = dirn[0] + str(all_coords[it1]) +'&'+ str(all_coords[it1+1])
                    if not dim_dict[dirn].has_key(zer_string): #then only we draw and add
                        #no need ot calculate the new location cause it is already calculated
                        dim_dict[dirn][zer_string] = [z_optimum, [all_coords[it1], all_coords[it1+1]]]
                        if dirn == 'hor':
                            dimension_list.append([[all_coords[it1],z_optimum],[all_coords[it1+1],z_optimum]])
                        else: #then 'ver'
                            dimension_list.append([[z_optimum,all_coords[it1]],[z_optimum,all_coords[it1+1]]])


            """if hor_dim_check:
                hor_string = 'h' + str(x1) + '&' + str(x2) 
                if not dim_dict['hor'].has_key(hor_string): #then only draw later add it too
                    y_new = self.__checking_outer_existence(self,outer_dim_dict, 'hor', hor_start_pt, hor_up_down, x1, x2, x0, xn, thickness)
                    dim_dict['hor'][hor_string] = [y_new, [x1, x2]]
                    dimension_list.append([[x1, y_new], [x2, y_new]])

            
            if ver_dim_check:
                ver_string = 'v' + str(y1) + '&' + str(y2)
                if not dim_dict['ver'].has_key(ver_string): #then only draw later add it too
                    x_new = self.__checking_outer_existence(self,outer_dim_dict, 'ver', ver_start_pt, ver_up_down, y1, y2, y0, yn, thickness)
                    dim_dict['ver'][ver_string] = [x_new, [y1, y2]]
                    dimension_list.append([[x_new,y1],[x_new,y2]])"""

        
        return dimension_list
                    

    @staticmethod
    def __distance_to_component(self,dict1, outer_dim_dict, dim_dict,dimension_list,thickness):
        x0, y0 = dict1['outline']['dims']['x0'], dict1['outline']['dims']['y0']
        xn, yn = dict1['outline']['dims']['xn'], dict1['outline']['dims']['yn']
        xc0, yc0 = (x0 + xn)/2, (y0 +yn)/2
        print(xc0, yc0, "xc0, yc0")

        #quad_info = {'hor':{1:[],2:[],3:[],4:[]},'ver':{1:[],2:[],3:[],4:[]} }
        quad_info = {'hor':{1:set(),2:set(),3:set(),4:set()},'ver':{1:set(),2:set(),3:set(),4:set()} }

        #Outline is skipped in calculation of the distance to the component
        for keys in dict1:
            if keys == 'outline':
                continue
            t_d2 = dict1[keys]['dims']
            x0c, y0c = t_d2['x0'], t_d2['y0']
            xnc, ync = t_d2['xn'], t_d2['yn']

            #Drawing the horizontal distance first
            quadrant_x = (x0c+xnc)/2 - xc0 #if negative then on the left side, otherwise right
            quadrant_y = (y0c+ync)/2 - yc0 #if negative then on the bottom side, otherwise top  
            
            '''
            if quadrant_x>=0 then right else left
            if quadrant_y>=0 then top else bottom
            '''

            #total 4 cases
            if quadrant_x == 0 and quadrant_y == 0 or quadrant_x >= 0 and quadrant_y >= 0: #quadrant 1 - top right
                #define x1, x2, y1 and y2 for each case
                x1, x2, y1, y2 = xnc, xn, ync, yn
                #hor_start_pt, ver_start_pt = yn + 200, xn + 200
                hor_up_down, ver_up_down = 1, 1
                hor_start_pt, ver_start_pt = yn + hor_up_down * 200, xn + ver_up_down * 200
                quadrant = 1
            
            elif quadrant_x <= 0 and quadrant_y >= 0: #quadrant 2 - top left
                x1, x2, y1, y2 = x0, x0c, ync, yn
                #hor_start_pt, ver_start_pt = yn + 200, x0 - 200
                hor_up_down, ver_up_down = 1, -1
                hor_start_pt, ver_start_pt = yn + hor_up_down * 200, x0 + ver_up_down * 200
                quadrant = 2

            elif quadrant_x <= 0 and quadrant_y <= 0: #quadrant 3 - bottom left
                x1, x2, y1, y2 = x0, x0c, y0, y0c
                #hor_start_pt, ver_start_pt = y0 - 200, x0 - 200
                hor_up_down, ver_up_down = -1, -1
                hor_start_pt, ver_start_pt = y0 + hor_up_down * 200, x0 + ver_up_down * 200
                quadrant = 3

            elif quadrant_x >= 0 and quadrant_y <= 0: #quadrant 4 - bottom right
                x1, x2, y1, y2 = xnc, xn, y0, ync
                #hor_start_pt, ver_start_pt = y0 - 200, xn + 200
                hor_up_down, ver_up_down = -1, 1
                hor_start_pt, ver_start_pt = y0 + hor_up_down * 200, xn + ver_up_down * 200
                quadrant = 4
            
            #check whether to draw horizontal or vertical dim
            hor_dim_check = True
            ver_dim_check = True

            '''
            
            '''
            if x1 == x2: #check whether to draw horizontal or vertical dim
                hor_dim_check = False
            if y1 == y2:
                ver_dim_check = False

            if hor_dim_check:
                quad_info['hor'][quadrant].add(x1) # storing the data earlier to squeeze it
                quad_info['hor'][quadrant].add(x2) 

            if ver_dim_check:
                quad_info['ver'][quadrant].add(y1) # storing the data earlier to squeeze it
                quad_info['ver'][quadrant].add(y2)

        """ 
            1: xn, yn, yn +1, xn +1
            2: x0, yn, yn +1, x0 -1
            3: x0, y0, y0 -1, x0 -1
            4: xn, y0, y0 -1, xn +1 
            """

        #####
        help_outer_dim_dis = {'hor':{1:1,2:1,3:-1,4:-1},'ver':{1:1,2:-1,3:-1,4:1}}
        
        '''
        All the dimensions x and y coordinates are seperately stored in quad info
        and it is being traversed
        '''
        for dirn in list(quad_info): #'hor 'ver'
            if dirn == 'hor': #when horizonal
                zz = [y0, yn]
                ww = [x0, xn]
            else: #when vertical
                zz = [x0, xn]
                ww = [y0, yn]
            for quad in list(quad_info[dirn]): #1 2 3 4 
                all_coords = list(quad_info[dirn][quad])
                all_coords.sort()
                for i in all_coords:
                    if i != 0:
                        i += 200
                print(all_coords, 'all coords')
                quad_info[dirn][quad] = all_coords
                pick = 1 if help_outer_dim_dis[dirn][quad] == 1 else 0 #this determines which end is chosen
                start_pt = zz[pick] + help_outer_dim_dis[dirn][quad]*200
                up_down = help_outer_dim_dis[dirn][quad]
                if len(all_coords) < 2:
                    continue

                z_optimum = self.__checking_outer_existence(self, outer_dim_dict, dirn, start_pt, up_down, all_coords[0], all_coords[-1], ww[0], ww[1], thickness) 
                # at the location of z_optimum all the dimension are drawn in all_coords
                for it1 in range(0, len(all_coords)-1):
                    if all_coords[it1+1] - all_coords[it1] < 2 :
                        continue
                    zer_string = dirn[0] + str(all_coords[it1]) +'&'+ str(all_coords[it1+1])
                    if not dim_dict[dirn].has_key(zer_string): #then only we draw and add
                        #no need ot calculate the new location cause it is already calculated
                        dim_dict[dirn][zer_string] = [z_optimum, [all_coords[it1], all_coords[it1+1]]]
                        if dirn == 'hor':
                            dimension_list.append([[all_coords[it1],z_optimum],[all_coords[it1+1],z_optimum]])
                        else: #then 'ver'
                            dimension_list.append([[z_optimum,all_coords[it1]],[z_optimum,all_coords[it1+1]]])


            """if hor_dim_check:
                hor_string = 'h' + str(x1) + '&' + str(x2) 
                if not dim_dict['hor'].has_key(hor_string): #then only draw later add it too
                    y_new = self.__checking_outer_existence(self,outer_dim_dict, 'hor', hor_start_pt, hor_up_down, x1, x2, x0, xn, thickness)
                    dim_dict['hor'][hor_string] = [y_new, [x1, x2]]
                    dimension_list.append([[x1, y_new], [x2, y_new]])

            
            if ver_dim_check:
                ver_string = 'v' + str(y1) + '&' + str(y2)
                if not dim_dict['ver'].has_key(ver_string): #then only draw later add it too
                    x_new = self.__checking_outer_existence(self,outer_dim_dict, 'ver', ver_start_pt, ver_up_down, y1, y2, y0, yn, thickness)
                    dim_dict['ver'][ver_string] = [x_new, [y1, y2]]
                    dimension_list.append([[x_new,y1],[x_new,y2]])"""

        
        return dimension_list
                    


        

    @staticmethod
    def __creating_dimensions_top_front(self,dict1,drawing_list):
        #It is used to create the_array which is the complete matrix of 0's and 1's for canvas drawing
        the_array = self.__creating_drawing_shade(dict1) 
        
        outline_dim = dict1['outline']['dims']
        #lets do this
        dim_dict = {'hor':{}, 'ver': {}}
        outer_dim_dict = {'hor':{}, 'ver': {}}
        dimension_list = []

        #distance to component
        dimension_list = self.__distance_to_component(self, dict1, outer_dim_dict, dim_dict, dimension_list, 100)
                
        #drwaing overall component dimensions
        dimension_list = self.__draw_overall_dimension_component(self,dict1,'top_front',dim_dict,the_array,outline_dim,outer_dim_dict,dimension_list) 

        #drawing ineer dimension of hte componenets
        ###dim_dict, dimension_list = self.draw_inner_dimension_component(self,dim_dict,dimension_list,dict1)
              

        
        x0, y0 = dict1['outline']['dims']['x0'], dict1['outline']['dims']['y0']
        xn, yn = dict1['outline']['dims']['xn'], dict1['outline']['dims']['yn']
        xi0, yi0 = dict1['outline']['dims']['xi0'], dict1['outline']['dims']['yi0']
        xin, yin = dict1['outline']['dims']['xin'], dict1['outline']['dims']['yin']


        if xi0 -x0 !=0:
            hor_string = 'h' + str(x0) + '&' + str(xi0)
            y1 = self.__checking_outer_existence(self,outer_dim_dict,'hor', y0-100,-1, x0,xi0, x0,xn)
            dim_dict['hor'][hor_string] = [y1,[x0,xi0]]
            dimension_list.append([[x0,y1],[xi0,y1]])
        if xn -xin !=0:
            y1 = self.__checking_outer_existence(self,outer_dim_dict,'hor', y0-100,-1, xin,xn, x0,xn)
            hor_string = 'h' + str(xin) + '&' + str(xn)
            dim_dict['hor'][hor_string] = [y1,[xin,xn]]
            dimension_list.append([[xin,y1],[xn,y1]])
        if yi0 -y0 !=0:
            ver_string = 'v' + str(y0) + '&' + str(yi0)
            x1 = self.__checking_outer_existence(self,outer_dim_dict,'ver', x0-100,-1, y0,yi0, y0,yn)
            dim_dict['ver'][ver_string] = [x1, [y0,yi0]]
            dimension_list.append([[x1,y0],[x1,yi0]])
        if yn -yin !=0:
            ver_string = 'v' + str(yin) + '&' + str(yn)
            x1 = self.__checking_outer_existence(self,outer_dim_dict,'ver', x0-100,-1, yin,yn, y0,yn)
            dim_dict['ver'][ver_string] = [x1, [yin,yn]]
            dimension_list.append([[x1,yin],[x1,yn]])

        
        hor_string = 'h' + str(x0) + '&' + str(xn)
        y1 = self.__checking_outer_existence(self,outer_dim_dict,'hor', y0-200,-1, x0,xn, x0,xn)
        dim_dict['hor'][hor_string] = [y1,[x0,xn]]
        dimension_list.append([[x0,y1],[xn,y1]])

        ver_string = 'v' + str(y0) + '&' + str(yn)
        x1 = self.__checking_outer_existence(self,outer_dim_dict,'ver', x0-200,-1, y0,yn,y0,yn)
        dim_dict['ver'][ver_string] = [x1, [y0,yn]]
        dimension_list.append([[x1,y0],[x1,yn]])

        #distance to component
        #dimension_list = self.__distance_to_component(self, dict1, outer_dim_dict, dim_dict, dimension_list, 100)
        

        lengths = {'x0' :x0, 'y0' : y0 , 'xn' : xn, 'yn' :yn, 'length' : xn-x0, 'width' : yn- y0}
        com_ID= self.__component_ID_detail(dict1)
        
       
        return {'dimension': dimension_list, 'lengths': lengths, 'IDs':com_ID}
    

    @staticmethod 
    def __checking_outer_existence(self,outer_dim_dict,key1, yi,up_or_down, x1,x2, x0,xn,thickness=200): #x1 to x2 are already x1-x2
        """
        outer_dim_dict contains 'hor' and 'ver' dimensions details
        key1 shows either horizontal dimension or vertical dimension 
        the x1 x2 x0 xn nomanclature made for  horizontal dimension
        """
        if not outer_dim_dict[key1].has_key(yi):
            
            outer_dim_dict[key1][yi] = np.zeros(xn-x0)
            outer_dim_dict[key1][yi][x1-x0:x2-x0]=1
            return yi
        else:
            np_array_yi = outer_dim_dict[key1][yi]
            if sum(np_array_yi[x1-x0:x2-x0]) < 5:#it was 10 , i made it 100 that messed up - now all looks too good.
                
                outer_dim_dict[key1][yi][x1-x0:x2-x0]=1
                return yi
            else:
                yi = yi +up_or_down*thickness #it was 100, i made it 10 that messed up- now all looks too good.
                
                yi = self.__checking_outer_existence(self,outer_dim_dict,key1, yi,up_or_down, x1,x2, x0, xn)
                return yi
                # = self.__checking_outer_existence(self,outer_dim_dict,key1, xi, y1,y2, y0,yn)


    @staticmethod
    def __update_hornver_dim_room_top_view(self,t_d2,the_array,outline_dim,outer_dim_dict,xy_string):
        x0, y0 = outline_dim['x0'], outline_dim['y0']
        xn, yn = outline_dim['xn'], outline_dim['yn']
        xi0, yi0 = outline_dim['xi0'], outline_dim['yi0']
        xin, yin = outline_dim['xin'], outline_dim['yin']
        

        x0c, y0c = t_d2['x0'], t_d2['y0']
        xnc, ync = t_d2['xn'], t_d2['yn']
        

        #xcc, ycc = (x0c+xnc)/2, (y0c+ync)/2

        #lets start with horizontal line
        def spit_out_opt_y(self,x0c,xnc,y0c,ync,x0,y0,xi0,yi0,xin,yin,xn,yn,the_array,outer_dim_dict):
            if y0c - 200 < y0:
                y1 = self.__checking_outer_existence(self,outer_dim_dict,'hor', y0-200,-1, x0c,xnc, x0,xn)
                
                #y1 = y0 - 100
            else:
                bool_y1 = True
                ps = y0c-100 
                while ps > y0+200:
                    pe = ps + 100
                    if sum(sum(the_array[x0c-x0:xnc-x0,ps-y0:pe-y0])) < 100:
                        #we found it
                        y1 = ps
                        the_array[x0c-x0:xnc-x0,ps-y0] = np.ones(xnc-x0c)
                        bool_y1 = False
                        break
                    else:
                        
                        ps -=1


                if bool_y1:
                    y1 = self.__checking_outer_existence(self,outer_dim_dict,'hor', y0-200,-1, x0c,xnc, x0,xn)
                    
                    
            
            if ync + 200 < yn:
                y2 = self.__checking_outer_existence(self,outer_dim_dict,'hor', yn+200,1, x0c,xnc, x0,xn)
                
            else:
                bool_y2 = True
                pe = ync +100
                while pe < yn-200:
                    ps = pe - 100
                    if sum(sum(the_array[x0c-x0:xnc-x0,ps-y0:pe-y0])) < 100:
                        #we found it
                        y2 = pe
                        the_array[x0c-x0:xnc-x0,pe-y0] = np.ones(xnc-x0c)
                        bool_y2 = False
                        break
                    else:
                        
                        pe -=1

                if bool_y2:
                    y2 = self.__checking_outer_existence(self,outer_dim_dict,'hor', yn+200,1, x0c,xnc, x0,xn)
                    
            ycc = (y0c+ync)/2
            
            if abs(y1-ycc) < abs(y2-ycc):
                
                if outer_dim_dict['hor'].has_key(y2):
                    
                    outer_dim_dict['hor'][y2][x0c-x0:xnc-x0] = np.zeros(xnc-x0c)
                return y1
            else:
                
                if outer_dim_dict['hor'].has_key(y1):
                    
                    outer_dim_dict['hor'][y1][x0c-x0:xnc-x0] = np.zeros(xnc-x0c)
                
                return y2

        #lets go to vertical lines now
        def spit_out_opt_x(self,x0c,xnc,y0c,ync,x0,y0,xi0,yi0,xin,yin,xn,yn,the_array,outer_dim_dict): #y0c,ync,x0c,xnc,x0,y0,xn,the_array
            if y0c - 200 < x0:
                y1 = self.__checking_outer_existence(self,outer_dim_dict,'ver', x0-200,-1, x0c,xnc, y0,yn)
                
            else:
                bool_y1 = True
                ps = y0c-100 #component edge - 100 to check if dimension can be drawn inside
                while ps > x0 +200: # we assume 200 is thickness, thats why only if we can drawn outer dim of comp until x0+200 then we draw, otherwise we draw it outside
                    pe = ps + 100 # x0c
                    if np.sum(the_array[ps-x0:pe-x0,x0c-y0:xnc-y0]) < 100:
                        #we found it
                        the_array[ps-x0,x0c-y0:xnc-y0] = np.ones(xnc-x0c)
                        y1 = ps
                        bool_y1 = False
                        break
                    else:
                        ps -= 1
                if bool_y1:
                    y1 = self.__checking_outer_existence(self,outer_dim_dict,'ver', x0-200,-1, x0c,xnc, y0,yn)
                    
            
            if ync + 200 < xn:
                y2 = self.__checking_outer_existence(self,outer_dim_dict,'ver', xn+200,+1, x0c,xnc, y0,yn)
                
            else:
                bool_y2 = True
                pe = ync +100
                while pe < xn-200: #it was yn -200
                    ps = pe - 100
                    
                    if np.sum(the_array[ps-x0:pe-x0,x0c-y0:xnc-y0]) < 100:
                        
                        y2 = pe
                        

                        the_array[pe-x0,x0c-y0:xnc-y0] = np.ones(xnc-x0c)
                        bool_y2 = False
                        break
                    else:
                        pe -= 1
                if bool_y2:
                    y2 = self.__checking_outer_existence(self,outer_dim_dict,'ver', xn+200,+1, x0c,xnc, y0,yn)
                    
            ycc = (y0c+ync)/2
            
            if abs(y1-ycc) < abs(y2-ycc):
                
                if outer_dim_dict['ver'].has_key(y2):
                    
                    outer_dim_dict['ver'][y2][x0c-y0:xnc-y0] = np.zeros(xnc-x0c)
                return y1
                
            else:
                
                if outer_dim_dict['ver'].has_key(y1):
                    
                    outer_dim_dict['ver'][y1][x0c-y0:xnc-y0] = np.zeros(xnc-x0c)
                
                return y2

        if xy_string == 'x_opt':
            x_opt = spit_out_opt_x(self,y0c,ync,x0c,xnc,x0,y0,xi0,yi0,xin,yin,xn,yn,the_array,outer_dim_dict)
            return x_opt
        elif xy_string == 'y_opt':
            y_opt = spit_out_opt_y(self,x0c,xnc,y0c,ync,x0,y0,xi0,yi0,xin,yin,xn,yn,the_array,outer_dim_dict)
            return y_opt
        else:
            y_opt = spit_out_opt_y(self,x0c,xnc,y0c,ync,x0,y0,xi0,yi0,xin,yin,xn,yn,the_array,outer_dim_dict)
            x_opt = spit_out_opt_x(self,y0c,ync,x0c,xnc,x0,y0,xi0,yi0,xin,yin,xn,yn,the_array,outer_dim_dict)
            return x_opt, y_opt



    @staticmethod
    def __update_hornver_dim(self,t_d2,the_array,outline_dim,outer_dim_dict,xy_string):
        x0, y0 = outline_dim['x0'], outline_dim['y0']
        xn, yn = outline_dim['xn'], outline_dim['yn']
        xi0, yi0 = outline_dim['xi0'], outline_dim['yi0']
        xin, yin = outline_dim['xin'], outline_dim['yin']
        x0c, y0c = t_d2['x0'], t_d2['y0']
        xnc, ync = t_d2['xn'], t_d2['yn']
        if x0c<x0:
            x0,xi0 = x0c,x0c
        if xnc > xn:
            xn,xin = xnc,xnc
        if y0c<y0:
            y0,yi0 = y0c,y0c
        if ync > yn:
            yn,yin = ync,ync
            # start with horizontal line
        def spit_out_opt_y(self,x0c,xnc,y0c,ync,x0,y0,xi0,yi0,xin,yin,xn,yn,the_array,outer_dim_dict):
            if y0c - 100 < y0:
                y1 = self.__checking_outer_existence(self,outer_dim_dict,'hor', y0-100,-1, x0c,xnc, x0,xn)
                
            else:
                bool_y1 = True
                ps = y0c-100 
                while ps > yi0:
                    pe = ps + 100
                    if np.sum(the_array[x0c-x0:xnc-x0,ps-y0:pe-y0]) < 100:
                        
                        y1 = ps
                        the_array[x0c-x0:xnc-x0,ps-y0] = np.ones(xnc-x0c)
                        bool_y1 = False
                        break
                    else:
                        ps -=1


                if bool_y1:
                    y1 = self.__checking_outer_existence(self,outer_dim_dict,'hor', y0-100,-1, x0c,xnc, x0,xn)
                    
            
            if ync + 100 < yn:
                y2 = self.__checking_outer_existence(self,outer_dim_dict,'hor', yn+100,1, x0c,xnc, x0,xn)
                
            else:
                bool_y2 = True
                pe = ync +100
                while pe < yin:
                    ps = pe - 100
                    if np.sum(the_array[x0c-x0:xnc-x0,ps-y0:pe-y0]) < 100:
                        #we found it
                        y2 = pe
                        the_array[x0c-x0:xnc-x0,pe-y0] = np.ones(xnc-x0c)
                        bool_y2 = False
                        break
                    else:
                        
                        pe -=1

                if bool_y2:
                    y2 = self.__checking_outer_existence(self,outer_dim_dict,'hor', yn+100,1, x0c,xnc, x0,xn)
                    
            ycc = (y0c+ync)/2
            
            if abs(y1-ycc) < abs(y2-ycc):
                if outer_dim_dict['hor'].has_key(y2) and len(outer_dim_dict['hor'][y2])>=xnc and (xnc-x0)>=xnc and (x0c-x0)<=x0c:
                    outer_dim_dict['hor'][y2][x0c-x0:xnc-x0] = np.zeros(xnc-x0c)
                return y1
            else:
                
                if outer_dim_dict['hor'].has_key(y1) and len(outer_dim_dict['hor'][y1])>=xnc:
                    
                    outer_dim_dict['hor'][y1][x0c-x0:xnc-x0] = np.zeros(xnc-x0c)
                
                return y2

        #lets go to vertical lines now
        def spit_out_opt_x(self,x0c,xnc,y0c,ync,x0,y0,xi0,yi0,xin,yin,xn,yn,the_array,outer_dim_dict): #y0c,ync,x0c,xnc,x0,y0,xn,the_array
            if y0c - 100 < x0:
                y1 = self.__checking_outer_existence(self,outer_dim_dict,'ver', x0-100,-1, x0c,xnc, y0,yn)
                
            else:
                bool_y1 = True
                ps = y0c-100 
                while ps > xi0:
                    pe = ps + 100
                    if np.sum(the_array[ps-x0:pe-x0,x0c-y0:xnc-y0]) < 100:
                        #we found it

                        the_array[ps-x0,x0c-y0:xnc-y0] = np.ones(xnc-x0c)
                        y1 = ps
                        bool_y1 = False
                        break
                    else:
                        ps -= 1
                if bool_y1:
                    y1 = self.__checking_outer_existence(self,outer_dim_dict,'ver', x0-100,-1, x0c,xnc, y0,yn)
                    #
            
            if ync + 100 < xn:
                y2 = self.__checking_outer_existence(self,outer_dim_dict,'ver', xn+100,+1, x0c,xnc, y0,yn)
                #
            else:
                bool_y2 = True
                pe = ync +100
                while pe < xin: #the other condition was yin
                    ps = pe - 100
                    if np.sum(the_array[ps-x0:pe-x0,x0c-y0:xnc-y0]) < 100:
                        #we found it
                        y2 = pe
                       
                        the_array[pe-x0,x0c-y0:xnc-y0] = np.ones(xnc-x0c)
                        bool_y2 = False
                        break
                    else:
                        pe -= 1
                if bool_y2:
                    y2 = self.__checking_outer_existence(self,outer_dim_dict,'ver', xn+100,+1, x0c,xnc, y0,yn)
                    #
            ycc = (y0c+ync)/2
            
            if abs(y1-ycc) < abs(y2-ycc):
                #
                if outer_dim_dict['ver'].has_key(y2) and len(outer_dim_dict['ver'][y2])>=xnc:
               
                    outer_dim_dict['ver'][y2][x0c-y0:xnc-y0] = np.zeros(xnc-x0c)
                return y1
                
            else:
                #
                if outer_dim_dict['ver'].has_key(y1) and len(outer_dim_dict['ver'][y1])>=xnc:
                    #
                    outer_dim_dict['ver'][y1][x0c-y0:xnc-y0] = np.zeros(xnc-x0c)
                #
                return y2
        

        if xy_string == 'x_opt':
            x_opt = spit_out_opt_x(self,y0c,ync,x0c,xnc,x0,y0,xi0,yi0,xin,yin,xn,yn,the_array,outer_dim_dict)
            return x_opt
        elif xy_string == 'y_opt':
            y_opt = spit_out_opt_y(self,x0c,xnc,y0c,ync,x0,y0,xi0,yi0,xin,yin,xn,yn,the_array,outer_dim_dict)
            return y_opt
        else:

            y_opt = spit_out_opt_y(self,x0c,xnc,y0c,ync,x0,y0,xi0,yi0,xin,yin,xn,yn,the_array,outer_dim_dict)
            x_opt = spit_out_opt_x(self,y0c,ync,x0c,xnc,x0,y0,xi0,yi0,xin,yin,xn,yn,the_array,outer_dim_dict)
            return x_opt, y_opt
        


      

    @staticmethod
    def __creating_drawing_shade_room_top_view(self,dict_for_view):
        dict1 = dict_for_view
        all_1_data = self.all_1_data
        


        def develop_outline_dict(all_1_data):
            all_update_data = {'horizontal':{},'vertical':{}}
            for keys in all_1_data:
                for lines in all_1_data[keys]:
                    
                    for items in all_1_data[keys][lines]:
                        
                        if len(items) >= 3:
                            
                            for key1 in items[2:]:
                                if key1[0] == 'Eb' or key1[0] == 'Et' or key1[0] == 'Er' or key1[0] == 'El':
                                    
                                    if all_update_data[keys].has_key(key1[0]):
                                        if all_update_data[keys][key1[0]].has_key(lines):
                                            all_update_data[keys][key1[0]][lines].append(items[0:2])
                                        else:
                                            all_update_data[keys][key1[0]][lines] = [items[0:2]]
                                    else:
                                        all_update_data[keys][key1[0]] = {lines : [items[0:2]]}
            return all_update_data

        def updating_array(the_array,x0,xn,y0,yn,x00,y00,xnn,ynn):
            if x0-x00 >= 0 and y0-y00 >= 0 and xn-x00 <= xnn-x00 and yn-y00 <= ynn-y00:
                the_array[x0-x00:xn-x00,y0-y00:yn-y00] = np.ones((xn-x0,yn-y0))
            return the_array 

        all_update_data = develop_outline_dict(all_1_data)


        
        x00 , y00 = dict1['outline']['dims']['x0'],dict1['outline']['dims']['y0'] #awesome
        xnn , ynn = dict1['outline']['dims']['xn'], dict1['outline']['dims']['yn']
        s = (xnn-x00,ynn-y00) # xn-x0,yn-y0
        the_array = np.zeros(s) #awesome

        #here we update only the outline
        for keys in all_update_data: #hori or ver
            for lines in  all_update_data[keys]: # et or eb// er or el
                #fac = -1 if lines == 'Et' or lines =='Er' else 1
                for numbers in all_update_data[keys][lines]: #one coordinate hori or verti
                    for items in all_update_data[keys][lines][numbers]:
                        
                        if keys == 'horizontal':
                            x0,xn = items[0],items[1]
                            y0 = numbers if lines =='Eb' else numbers - 250
                            yn = numbers+250 if lines =='Eb' else numbers

                        else:
                            
                            y0,yn = items[0],items[1]
                            x0 = numbers if lines =='El' else numbers - 250
                            xn = numbers+250 if lines =='El' else numbers
                        the_array = updating_array(the_array,x0,xn,y0,yn,x00,y00,xnn,ynn)
        

        # this is for the component stuff
        
        for keys1 in dict1: #name of the compoonent or outline
            if keys1 == 'outline':
                continue
            #t_d2 = dict1[keys1]['dims']
            #here this can be improved
            for keys in dict1[keys1]: #hori or ver or dims
                if keys == 'dims':
                    continue
                #for lines in  all_update_data[keys]: # et or eb// er or el
                    #fac = -1 if lines == 'Et' or lines =='Er' else 1
                for numbers in dict1[keys1][keys]: #one coordinate hori or verti
                    
                    for items in dict1[keys1][keys][numbers]:
                        
                        if keys == 'horizontal':
                            x0,xn = items[0],items[1]
                            y0,yn = numbers -100, numbers +100

                        else:
                            
                            y0,yn = items[0],items[1]
                            x0, xn = numbers-100, numbers + 100 
                        the_array = updating_array(the_array,x0,xn,y0,yn,x00,y00,xnn,ynn)

            #the_array = updating_array(the_array,t_d2['x0'],t_d2['xn'],t_d2['y0'],t_d2['yn'],x00 , y00,xnn,ynn)
        
        return the_array





        

    @staticmethod
    def __creating_drawing_shade(dict_for_view):
        dict1 = dict_for_view
        x0,y0,xn,yn= np.inf, np.inf, -np.inf, -np.inf
        '''
        Items and outline traversed and the min and max x,y coordinates are stored in x0,xn,y0,yn
        '''
        for items in dict1:
            a1,b1,a2,b2 = dict1[items]['dims']['x0'],dict1[items]['dims']['y0'],dict1[items]['dims']['xn'],dict1[items]['dims']['yn']
            if a1<x0:
                x0 = a1
            if b1<y0:
                y0 = b1
            if a2>xn:
                xn = a2
            if b2>yn:
                yn = b2
        x00, y00 = x0, y0
        s = (xn-x00, yn - y00)
        # x00 , y00 = dict1['outline']['dims']['x0'],dict1['outline']['dims']['y0']
        # s = (dict1['outline']['dims']['xn']-x00,dict1['outline']['dims']['yn']-y00) # xn-x0,yn-y0
        # numpy array is created with dimensions x0, xn, y0, yn
        the_array = np.zeros(s)
        def updating_array(the_array,x0,xn,y0,yn,x00, y00 ):
            
            x00 = min(x0,x00)
            y00 = min(y0,y00)
            the_array[x0-x00:xn-x00,y0-y00:yn-y00] = np.ones((xn-x0,yn-y0))
            return the_array
        t_d1 = dict1['outline']['dims']
        the_array = updating_array(the_array,t_d1['x0'],t_d1['xi0'],t_d1['y0'],t_d1['yn'],x00 , y00)
        the_array = updating_array(the_array,t_d1['xin'],t_d1['xn'],t_d1['y0'],t_d1['yn'],x00 , y00)
        the_array = updating_array(the_array,t_d1['x0'],t_d1['xn'],t_d1['y0'],t_d1['yi0'],x00 , y00)
        the_array = updating_array(the_array,t_d1['x0'],t_d1['xn'],t_d1['yin'],t_d1['yn'],x00 , y00)
        for keys in dict1:
            if keys == 'outline':
                continue
            t_d2 = dict1[keys]['dims']
            the_array = updating_array(the_array,t_d2['x0'],t_d2['xn'],t_d2['y0'],t_d2['yn'],x00 , y00)
        #
        return the_array
    



    @staticmethod
    def __create_dict(self,drawing, outline_bool = False):
        '''the horizontal and the vertical lines are seperated here'''
        draw_hor_list, draw_ver_list = self.__separate_hor_ver(drawing)
        draw_hor_dict = {item[0]: [] for item in draw_hor_list}
        draw_ver_dict = {item[0]: [] for item in draw_ver_list}
        '''The hor & ver dict are created into a structure like X-{a,b}
        where x denotes the point in X-axis or Y-axis '''
        for item in draw_hor_list:
            draw_hor_dict[item[0]].append(item[1])
        for item in draw_ver_list:
            draw_ver_dict[item[0]].append(item[1])
        def takeFirst(elem): #define function for list sorting
            return elem[0]
        for item in draw_hor_dict:
            draw_hor_dict[item].sort(key=takeFirst) #sorting the lists by first element
        for item in draw_ver_dict:
            draw_ver_dict[item].sort(key=takeFirst)
        for item in draw_hor_dict:
            draw_hor_dict[item]=self.__truncate_list(draw_hor_dict[item])
        for item in draw_ver_dict:
            draw_ver_dict[item]=self.__truncate_list(draw_ver_dict[item])
        #x0, y0, xn, yn = 
        #Here the horizontal and vertical list comes blank because none
        #of the lines are parallel to x or y axis, so we took the original 
        #list and found the minimum and maximum coordinates and returned the value
        #otherwise we send the list to the __find_thickness function
        if len(draw_hor_list) == 0 or len(draw_ver_list) == 0:
            minx, maxx, miny, maxy = np.inf, -np.inf, np.inf, -np.inf
            for i in drawing:
                minx = min(minx, i[0][0], i[0][1])
                maxx = max(maxx, i[0][0], i[0][1])
                miny = min(miny, i[1][0], i[1][1])
                maxy = max(maxy, i[1][0], i[1][1])
                
            dims = {'x0': minx, 'y0': miny, 'xn': maxx, 'yn': maxy}
        else:
            dims = self.__find_thickness(self,draw_hor_dict, draw_ver_dict, outline_bool)
        return {'horizontal':draw_hor_dict, 'vertical': draw_ver_dict, 'dims': dims}



    @staticmethod
    def __find_thickness(self,draw_hor_dict, draw_ver_dict, outline_bool = False):
        '''ls1 is the horizontal list thus its keys have y-coordinates
        ls2 is the vertical list thus its keys have x-coordinates'''
        ls1=self.__reveal_keys(draw_hor_dict) #all the keys in ascending order
        ls2=self.__reveal_keys(draw_ver_dict)
        '''x0 xn is the min & max in ls2 which is vertical list
        y0 yn is the min & max in ls1 which is the horizontal list'''
        x0, y0, xn, yn = ls2[0], ls1[0],ls2[-1], ls1 [-1]
        
        # if outline_bool == True:
        #     if(len(ls1)>2):
        #         if(abs(ls1[0])-ls1[1]<=60):
        #             y0=ls1[1]
                
        #         if(abs(ls1[-1])-ls1[len(ls1)-2]<=60):
        #             yn=ls1[len(ls1)-2]
        #     if(len(ls2)>2):    
        #         if(abs(ls2[0])-ls2[1]<=60):
        #             x0=ls2[1]
        #         if(abs(ls2[-1])-ls2[len(ls2)-2]<=60):
        #             xn=ls2[len(ls2)-2]
                    
        
        #finding xi0 , yi0, xin, yin
        if outline_bool:
            def find_inner_ends(x0,xn,ls1):
                '''
                Min & max outline keys are taken here and the thickness is calculated .... .i.e
                the coordinate of the inner wall based on the outer wall to ignore the wall
                thickness... But this piece of code requires restructuring, if there are more than four
                wall for some cases it returns xi0 & yi0 which are not on the extreme sides
                '''
                xc = (x0+xn)/2
                list1 = np.asarray(ls1)
                list_keys_start, list_keys_end = list(list1[list1 < xc]), list(list1[list1 > xc])
                xi0 = list_keys_start[-1]
                xin = list_keys_end[0]
                i=-1
                while xi0 - x0 > 0.25*(xn-x0) and xi0 != x0:
                    i-=1
                    xi0 = list_keys_start[i]
                    
                j=0
                while xn - xin >0.25*(xn-x0) and xn!=xin:
                    j+=1
                    xin = list_keys_end[j]
                    
                
                return xi0, xin
            xi0, xin = find_inner_ends(x0,xn,ls2)
            yi0, yin = find_inner_ends(y0,yn,ls1)
            return {'x0': x0, 'y0': y0, 'xn': xn, 'yn': yn,'xi0': xi0, 'yi0': yi0, 'xin': xin, 'yin': yin}#x0, y0, xn, yn, xi0 , yi0, xin, yin
            
        else:
            return {'x0': x0, 'y0': y0, 'xn': xn, 'yn': yn}#x0, y0, xn, yn
        """code for determining xi0 yi0 xin and yin """
        #return x0, y0, xn, yn # pass thickness if needed    

    


    @staticmethod   #function that returns the keys of the passed dictionary
    def __reveal_keys(dict1):
        ls= []
        for key in dict1:
            ls.append(key)
        ls=sorted(ls)
        
        return ls


    @staticmethod
    def __separate_hor_ver(drawing):
        draw_hor_list, draw_ver_list= [], []
        for coordinate in drawing:
            x1 = coordinate[0][0]
            y1 = coordinate[0][1]
            x2 = coordinate[1][0]
            y2 = coordinate[1][1]
            if x1 == x2:
                draw_ver_list.append([x1,[min(y1,y2),max(y1,y2)]])
            if y1 == y2:
                draw_hor_list.append([y1,[min(x1,x2),max(x1,x2)]])
        return draw_hor_list, draw_ver_list # ver_list has the format [x1, [y1,y2]], [x2,[y3,y4]]

    
    

    
    @staticmethod
    def __truncate_list(list1):
        if len(list1)<2:
            return list1
        else:
            new_list1 = []
            for i in range(len(list1)-1):
                co1= list1[i]
                co2= list1[i+1]
                if co1[1] >= co2[0]:
                    list1[i+1]=[co1[0],max(co1[1],co2[1])]
                else:
                    new_list1.append(list1[i])
            new_list1.append(list1[-1])
        return new_list1


    """@property
    def data1(self):
        return self.fpo_object
    
    @property
    def plot_the_complete_drawing(self): # drawing from vertical and horizontal dictionary
        fpo1 = self.fpo_object
        all_detail_dict = fpo1.all_data
        for lines in all_detail_dict:
            for key in all_detail_dict[lines]:
                for values in all_detail_dict[lines][key]:
                    plt.plot(values[0:2],[key,key],'k') if lines == 'horizontal' else plt.plot([key,key],values[0:2],'k')
        dimensions = fpo1.data
        coordinates = dimensions['horizontal'] + dimensions['vertical']
        for items in coordinates:
            
            plt.plot([items[0][0],items[1][0]],[items[0][1],items[1][1]],'--') #need x1 x2 and y1 y2 but we had x1 y1 x2 y2
        plt.show()"""

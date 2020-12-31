import json
#import matplotlib.pyplot as plt
import copy 
import numpy as np          
#import floor_plan_outline1 as floor_plan_outline1


class floor_plan_outline1(object):

    def __init__(self,drawing_list,thickness):
        self.draw_1_hor_dict, self.draw_1_ver_dict,  self.x0, self.y0, self.xn, self.yn = self.__create_dict(self,drawing_list)
        self.org_hor, self.org_ver, self.thickness  = copy.deepcopy(self.draw_1_hor_dict), copy.deepcopy(self.draw_1_ver_dict), thickness

        self.__update_dicts() #all teh data gets identified based on interier wall, inside of exterior wall

        self.all_detail = {'horizontal' : self.draw_1_hor_dict, 'vertical' : self.draw_1_ver_dict}
        self.data_to_return = self.__remove_duplicate(self)

    @property
    def original_data(self):
        return {'hor' : self.org_hor, 'ver': self.org_ver}


    @property 
    def all_data(self):
        return self.all_detail
    
    @property
    def data(self): # dimension data
        
        return self.data_to_return
    
    @staticmethod
    def __remove_duplicate(self): # this data is in the 
        vert = []
        hori = []
        list_hor = []
        list_ver = []
        all_detail_dict = self.all_detail
        for lines in all_detail_dict:
            for keys in all_detail_dict[lines]:
                for i in range(len(all_detail_dict[lines][keys])):
                    values = all_detail_dict[lines][keys][i]
                    if len(values)== 3:
                        if len(values[2]) ==3:                        
                            if lines == 'horizontal':
                                str_name = 'h'+str(values[2][1][0])+'&'+str(values[2][1][1])
                                list_hor.append(str_name)
                                if len(list_hor) == len(list(set(list_hor))):
                                    hori.append([[values[2][1][0],values[2][2][0]],[values[2][1][1],values[2][2][1]]])
                                    

                                else:
                                    list_hor = list(set(list_hor))
                                    strr2 = all_detail_dict[lines][keys][i][2][0]
                                    self.all_detail[lines][keys][i][2] =[strr2]## if it shouldnt be drawn then change the value to just string without x1 y1x2y2
                            else:
                                str_name = 'v'+str(values[2][2][0])+'&'+str(values[2][2][1])
                                list_ver.append(str_name)
                                if len(list_ver) == len(list(set(list_ver))):
                                    vert.append([[values[2][1][0],values[2][2][0]],[values[2][1][1],values[2][2][1]]])
                                    
                                else:
                                    list_ver = list(set(list_ver))
                                    strr2 = all_detail_dict[lines][keys][i][2][0]
                                    self.all_detail[lines][keys][i][2] =[strr2]##
        lengths = {'x0' :self.x0, 'y0' : self.y0 , 'xn' : self.xn, 'yn' :self.yn, 'length' : self.xn-self.x0, 'width' : self.yn- self.y0}
        return {'dimension' : hori+vert, 'lengths' : lengths}
                            


    """@property
    def plot_the_complete_drawing(self): # drawing from vertical and horizontal dictionary
        all_detail_dict = self.all_data
        for lines in all_detail_dict:
            for key in all_detail_dict[lines]:
                for values in all_detail_dict[lines][key]:
                    plt.plot(values[0:2],[key,key],'k') if lines == 'horizontal' else plt.plot([key,key],values[0:2],'k')
        dimensions = self.data
        coordinates = dimensions['horizontal'] + dimensions['vertical']
        for items in coordinates:
            plt.plot([items[0][0],items[1][0]],[items[0][1],items[1][1]],'--') #need x1 x2 and y1 y2 but we had x1 y1 x2 y2
        plt.show()"""

    

    def __update_dicts(self):
        thickness = self.thickness
        self.__plot_outer_dim_hor(self,-thickness,'Eb')#for bottom
        self.__plot_outer_dim_hor(self,thickness,'Et') #for top
        self.__plot_outer_dim_ver(self,thickness,'Er') #for right
        self.__plot_outer_dim_ver(self,-thickness,'El') #for left
        self.__plot_inner_dim_hor(self,'Ih') # for updating internals
        self.__plot_inner_dim_ver(self,'Iv') # for updating internals 



    
    @staticmethod
    def __plot_outer_dim_hor(self,thickness,strr):
        draw_1_hor_dict,x0,xn= self.draw_1_hor_dict, self.x0, self.xn
        updating_array = np.zeros(xn-x0+1)
        list_keys = self.__reveal_keys(draw_1_hor_dict)
        if strr=='Et':
            list_keys=sorted(list_keys,reverse=True)
        i_list = 0
        while np.sum(updating_array) < xn-x0:
            key = list_keys[i_list]
            for i in range(len(draw_1_hor_dict[list_keys[i_list]])):#values in draw_1_hor_dict[list_keys[i_list]]:
                values = draw_1_hor_dict[key][i]
                if np.sum(updating_array[(values[0]-x0):(values[1]-x0)])==0: #plotted for whole length
                    #
                    self.draw_1_hor_dict[key][i].append([strr,values[0:2],[key+thickness,key+thickness]])
                    self.__update_int_hor(self,i_list,list_keys,values[0],values[1],x0,xn,key,thickness,strr)
                    updating_array[(values[0]-x0):(values[1]-x0)] = np.ones(values[1]-values[0])
                elif np.sum(updating_array[(values[0]-x0):(values[1]-x0)]) == (values[1]-values[0]): #nothing plotted
                    randomNumber=1
                else: #plotted for a fraction of length
                    _x1 = values[0]-x0
                    while updating_array[_x1]==1:
                        _x1=_x1+1
                    _x2 = values[1]-x0
                    while updating_array[_x2]==1:
                        _x2=_x2-1
                    #
                    self.draw_1_hor_dict[key][i].append([strr,[_x1+x0,_x2+x0],[key+thickness,key+thickness]])
                    self.__update_int_hor(self,i_list,list_keys,(_x1+x0),(_x2+x0),x0,xn,key,thickness,strr)
                    if _x1==_x2:
                        updating_array[_x1]=1
                    else:
                        updating_array[_x1:_x2] = np.ones(_x2-_x1)
            i_list = i_list + 1




    @staticmethod
    def __plot_outer_dim_ver(self,thickness,strr): #here x0 and xn refers to y0 yn
        draw_1_ver_dict,x0,xn= self.draw_1_ver_dict, self.y0, self.yn
        updating_array = np.zeros(xn-x0+1)
        list_keys = self.__reveal_keys(draw_1_ver_dict)
        if strr=='Er':
            list_keys=sorted(list_keys,reverse=True)
        i_list = 0
        while np.sum(updating_array) < xn-x0:
            key = list_keys[i_list]
            for i in range(len(draw_1_ver_dict[list_keys[i_list]])):#values in draw_1_ver_dict[list_keys[i_list]]:
                values = draw_1_ver_dict[key][i]
                if np.sum(updating_array[(values[0]-x0):(values[1]-x0)])==0:
                    #
                    self.draw_1_ver_dict[key][i].append([strr,[key+thickness,key+thickness],values[0:2]])
                    self.__update_int_ver(self,i_list,list_keys,values[0],values[1],x0,xn,key,thickness,strr) #here x1, x2, x0, xn, yi are y1,y2,y0,yn,xi
                    updating_array[(values[0]-x0):(values[1]-x0)] = np.ones(values[1]-values[0])
                elif np.sum(updating_array[(values[0]-x0):(values[1]-x0)]) == (values[1]-values[0]):
                    randomNumber=1
                else:
                    _x1 = values[0]-x0
                    while updating_array[_x1]==1:
                        _x1=_x1+1
                    _x2 = values[1]-x0
                    while updating_array[_x2]==1:
                        _x2=_x2-1
                    #
                    self.draw_1_ver_dict[key][i].append([strr,[key+thickness,key+thickness],[_x1+x0,_x2+x0]])
                    self.__update_int_ver(self,i_list,list_keys,_x1+x0,_x2+x0,x0,xn,key,thickness,strr) #here x1, x2, x0, xn, yi are y1,y2,y0,yn,xi
                    if _x1==_x2:
                        updating_array[_x1]=1
                    else:
                        updating_array[_x1:_x2] = np.ones(_x2-_x1)
            i_list = i_list + 1


    @staticmethod
    def __plot_inner_dim_hor(self,strr):
        draw_1_hor_dict,x0,xn,thickness= self.draw_1_hor_dict, self.x0, self.xn, self.thickness
        list_keys = self.__reveal_keys(draw_1_hor_dict)
        for i_list in range(len(list_keys)):
            key = list_keys[i_list]
            for i_value in range(len(draw_1_hor_dict[key])):
                values = draw_1_hor_dict[key][i_value]
                if len(values) ==2:
                    if values[1]-values[0] < 2*thickness:
                        self.draw_1_hor_dict[key][i_value].append([strr])
                    else:
                        if self.__if_nothing_at_bottom(self,i_list,list_keys,values[0],values[1],key):
                            self.draw_1_hor_dict[key][i_value].append([strr,[values[0],values[1]],[key-thickness,key-thickness]]) #
                        else:
                            self.draw_1_hor_dict[key][i_value].append([strr,[values[0],values[1]],[key+thickness,key+thickness]]) #checks must be applied here it it is going thickness
                        #now we will check for its proximity upside
                        self.__update_int_hor(self,i_list,list_keys,values[0],values[1],x0,xn,key,-thickness,strr)
    
    @staticmethod
    def __plot_inner_dim_ver(self,strr):
        draw_1_hor_dict,x0,xn,thickness= self.draw_1_ver_dict, self.y0, self.yn, self.thickness
        list_keys = self.__reveal_keys(draw_1_hor_dict)
        for i_list in range(len(list_keys)):
            key = list_keys[i_list]
            for i_value in range(len(draw_1_hor_dict[key])):
                values = draw_1_hor_dict[key][i_value]
                if len(values) ==2:
                    if values[1]-values[0] < 2*thickness:
                        self.draw_1_ver_dict[key][i_value].append([strr])
                    else:
                        if self.__if_nothing_at_left(self,i_list,list_keys,values[0],values[1],key):
                            self.draw_1_ver_dict[key][i_value].append([strr,[key-thickness,key-thickness],[values[0],values[1]]]) #
                        else:
                            self.draw_1_ver_dict[key][i_value].append([strr,[key+thickness,key+thickness],[values[0],values[1]]]) #checks must be applied here it it is going thickness
                        #now we will check for its proximity upside
                        self.__update_int_ver(self,i_list,list_keys,values[0],values[1],x0,xn,key,-thickness,strr) # used to check if there is anything on right side
                        #then that will be updated right now

    
    @staticmethod
    def __if_nothing_at_left(self,i_l,list_key,x1,x2,yi): #this is y1 y2 and xi
        draw_1_hor_dict = self.draw_1_ver_dict
        t = self.thickness
        alt = np.asarray(list_key[0:i_l])
        boolean = True
        list_keys = list(alt[alt >= yi-2*t])
        for keys in list_keys:
            for values in draw_1_hor_dict[keys]:
                xf1 =values[0]
                xf2 = values[1]
                if x2<=xf1 or x1>=xf2:
                    boolean=boolean*True
                else:
                    boolean = boolean*False #then something exists at left
        return boolean                   

    @staticmethod
    def __if_nothing_at_bottom(self,i_l,list_key,x1,x2,yi):
        draw_1_hor_dict = self.draw_1_hor_dict
        t = self.thickness
        alt = np.asarray(list_key[0:i_l])
        boolean = True
        list_keys = list(alt[alt >= yi-2*t])
        for keys in list_keys:
            for values in draw_1_hor_dict[keys]:
                xf1 =values[0]
                xf2 = values[1]
                if x2<=xf1 or x1>=xf2:
                    boolean=boolean*True
                else:
                    boolean = boolean*False #then something exists at bottom
        return boolean
    





    @staticmethod
    def __update_int_hor(self,i_l,list_key,x1,x2,x0,xn,yi,thickness,strr):
        draw_1_hor_dict = self.draw_1_hor_dict
        t = self.thickness
        filling_array = np.zeros(xn-x0)
        alt = np.asarray(list_key[i_l:])
        if strr == 'Eb':
            list_keys = list(alt[alt <= yi-2*thickness])
            strr1 = 'Eib'
        elif strr == 'Et':
            list_keys = list(alt[alt >= yi-2*thickness])
            strr1 = 'Eit'
        elif strr == 'Ih':
            list_keys = list(alt[alt <= yi-2*thickness])
            strr1 = 'Ih'
        i_list = 0
        for keys in list_keys:
            for i in range(len(draw_1_hor_dict[keys])):
                values = draw_1_hor_dict[keys][i]
                if len(values) == 2:
                    #while np.sum(filling_array) <= x2-x1:
                    if x1-t <= values[0] and x2+t >= values[1]: #this check takes it away
                        if np.sum(filling_array[(values[0]-x0):(values[1]-x0)]) == 0:
                            if values[1]-values[0]+2*t < x2-x1:
                                self.draw_1_hor_dict[keys][i].append([strr1,values[0:2],[keys-thickness,keys-thickness]])
                            #elif values[1]-values[0] > x2-x1 +3*t:
                            #    radomevent =1
                            else:
                                self.draw_1_hor_dict[keys][i].append([strr1])
                            filling_array[(values[0]-x0):(values[1]-x0)] = np.ones(values[1]-values[0])
    

    @staticmethod
    def __update_int_ver(self,i_l,list_key,x1,x2,x0,xn,yi,thickness,strr): #here x1, x2, x0, xn, yi are y1,y2,y0,yn,xi
        draw_1_ver_dict = self.draw_1_ver_dict
        t = self.thickness
        filling_array = np.zeros(xn-x0)
        alt = np.asarray(list_key[i_l:])
        if strr == 'El':
            list_keys = list(alt[alt <= yi-2*thickness])
            strr1 = 'Eil'
        elif strr == 'Er':
            list_keys = list(alt[alt >= yi-2*thickness])
            strr1 = 'Eir'
        elif strr == 'Iv':
            list_keys = list(alt[alt <= yi-2*thickness])
            strr1 = 'Iv'
        i_list = 0
        for keys in list_keys:
            for i in range(len(draw_1_ver_dict[keys])):
                values = draw_1_ver_dict[keys][i]
                if len(values) == 2:
                    #while np.sum(filling_array) <= x2-x1:
                    if x1-2*t <= values[0] and x2+2*t >= values[1]:
                        if np.sum(filling_array[(values[0]-x0):(values[1]-x0)]) == 0:
                            #self.draw_1_ver_dict[keys][i].append([strr1,[keys-thickness,keys-thickness],values[0:2]])
                            if values[1]-values[0]+2*t < x2-x1:
                                self.draw_1_ver_dict[keys][i].append([strr1,[keys-thickness,keys-thickness],values[0:2]])
                            else:
                                self.draw_1_ver_dict[keys][i].append([strr1])
                            filling_array[(values[0]-x0):(values[1]-x0)] = np.ones(values[1]-values[0])
        

    

    @staticmethod
    def __find_thickness(self,draw_hor_dict, draw_ver_dict):
        ls1=self.__reveal_keys(draw_hor_dict) #all the keys in ascending order
        ls2=self.__reveal_keys(draw_ver_dict)
        r11=ls1[0:2] #first two y coordinates of the drawing
        r12=ls1[-2:] # last two y coordinates of the drawing
        r21=ls2[0:2] #first two x coordinates of the drawing
        r22=ls2[-2:] #last two x coordinates of the drawing
        thickness= max(abs(r11[0]-r11[1]),abs(r12[0]-r12[1]),abs(r21[0]-r21[1]),abs(r22[0]-r22[1]))
        x0 = ls2[0]
        y0 = ls1[0]
        xn = ls2[-1]
        yn = ls1 [-1]
        return x0, y0, xn, yn # pass thickness if needed



    


    @staticmethod
    def __create_dict(self,drawing):
        draw_hor_list, draw_ver_list = self.__separate_hor_ver(drawing)
        draw_hor_dict = {item[0]: [] for item in draw_hor_list}
        draw_ver_dict = {item[0]: [] for item in draw_ver_list}
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
        x0, y0, xn, yn = self.__find_thickness(self,draw_hor_dict, draw_ver_dict)
        return draw_hor_dict, draw_ver_dict, x0, y0, xn, yn

    


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


    @staticmethod   #function that returns the keys of the passed dictionary
    def __reveal_keys(dict1):
        ls= []
        for key in dict1:
            ls.append(key)
        ls=sorted(ls)
        #print(ls)
        return ls

    



class floor_plan_additional(object):

    def __init__(self,j_object):
        self.j_object = j_object
        self.new_j_object = self.return_new_j_object(self,j_object)

    @property
    def new_object(self):
        return self.new_j_object

    @staticmethod
    def return_new_j_object(self,j_object):

        drawing_1_list = j_object['floor_plan']['outline']
        fp0 = floor_plan_outline1(drawing_1_list,250)
        #fp0.plot_all_outer_dim
        j_object['floor_plan']['dimension'] = fp0.data

        room_name =['KITCHEN','GBR']#['GBR']#
        view_name =['room_top_view','view_1','view_2']#['view_1']# 
        view_angle =['top_view','front_view','internal_view'] #['internal_view']# as

        for key1 in room_name:
            if j_object['rooms'].has_key(key1):
                for key2 in view_name:
                    if j_object['rooms'][key1].has_key(key2):
                        if key2 == 'room_top_view':
                            drawing_list1 = self.output_list_room_top_views(key1, key2, j_object)
                            fp1 = floor_plan_outline1(drawing_list1,200)
                            # print(j_object)
                            data_from_1_room_top_view = fp1.all_data
                            fp4 = floor_plan_component1(key1, key2, data_from_1_room_top_view, j_object)
                            j_object['rooms'][key1][key2]['dimension'] = fp4.data
                        else:
                            for key3 in view_angle:
                                if j_object['rooms'][key1][key2].has_key(key3):
                                    fp3 = floor_plan_component1(key1, key2, key3, j_object)
                                    j_object['rooms'][key1][key2][key3]['dimension'] = fp3.data     

        return j_object


    @staticmethod
    def output_list_room_top_views(room_name, view_name, j_object):
        drawing_4_list = j_object['rooms'][room_name][view_name]['outline']
        for items in j_object['rooms'][room_name][view_name]['floor_components']['library']:
            drawing_4_list= drawing_4_list+ j_object['rooms'][room_name][view_name]['floor_components']['library'][items]['outline']
        for i in range(len(drawing_4_list)-1,0,-1):
            if len(drawing_4_list[i][0]) == 0:
                del drawing_4_list[i]
            elif len(drawing_4_list[i][1]) == 0:
                del drawing_4_list[i]
        return drawing_4_list




class floor_plan_component1(object):

    def __init__(self,room_name, view_name, view_angle,j_object):
        self.j_object = j_object

                    
        self.room_name, self.view_name = room_name,view_name
        if self.view_name != 'room_top_view':
            self.view_angle = view_angle
            # print(self.room_name, self.view_name,self.view_angle)
        else:
            # print(self.room_name, self.view_name)
            self.all_1_data = view_angle
        
        self.dimension_dict = self.return_new_j_object(self)
        
        
    @property
    def data(self): #data to return
        return self.dimension_dict
        
    
    @property
    def draw_c_outline(self):
        self.__plot_drawing(self.drawing_list)


        

    @staticmethod
    def return_new_j_object(self):
        if self.view_name == 'room_top_view':
            drawing_list = self.output_list_room_top_views(self)  
        else:
            drawing_list = self.output_list_views(self)
        return drawing_list


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
        #plt.figure()
        dict_for_view={}
        room_name, view_name, j_object = self.room_name,self.view_name, self.j_object
        
        drawing_1_list = j_object['rooms'][room_name][view_name]['outline']
        drawing_1_list  = self.__clean_drawing_list(drawing_1_list)
        dict_for_view['outline'] = self.__create_dict(self,drawing_1_list,True)

        for items in j_object['rooms'][room_name][view_name]['floor_components']['library']:
            drawing_2_list= j_object['rooms'][room_name][view_name]['floor_components']['library'][items]['outline']
            drawing_2_list  = self.__clean_drawing_list(drawing_2_list)
            dict_for_view[items] = self.__create_dict(self,drawing_2_list)
            drawing_1_list += drawing_2_list
        #
        dimension_list = self.__creating_dimensions_room_top_view(self,dict_for_view,drawing_1_list)
        return dimension_list      

    @staticmethod
    def output_list_views(self):
        
        dict_for_view={}
        #fig = plt.figure()       
        room_name, view_name, view_angle, j_object = self.room_name,self.view_name,self.view_angle, self.j_object
        #print(room_name+view_name+ view_angle)
        #plt.title(room_name+view_name+ view_angle)
        #colorpalette, i = ['b','y','g','c','m','k','r','b--','g--','r--','c--','m--','y--','k--'], 0
        if j_object['rooms'][room_name][view_name][view_angle].has_key('outline'):
            drawing_1_list = []
            drawing_1_list = j_object['rooms'][room_name][view_name][view_angle]['outline'] 

            dict_for_view['outline'] = self.__create_dict(self,drawing_1_list,True)
            #self.__plot_drawing(drawing_1_list,'k', 3 )
            for items in j_object['rooms'][room_name][view_name][view_angle]['floor_components']['library']:
                drawing_2_list = []
                for internal_items in ['internal','carcass','skirting','loft_skirting','cover_panels']: #'fillers'
                    drawing_2_list+= j_object['rooms'][room_name][view_name][view_angle]['floor_components']['library'][items]['external_points'][internal_items]
                for item in j_object['rooms'][room_name][view_name][view_angle]['floor_components']['library'][items]['external_points']['shutter']:
                    drawing_2_list+= j_object['rooms'][room_name][view_name][view_angle]['floor_components']['library'][items]['external_points']['shutter'][item]['outline']
                    #since no handle dimension needed#drawing_4_list= drawing_4_list+ j_object['rooms'][room_name][view_name][view_angle]['floor_components']['library'][items]['external_points']['shutter'][item]['handle']['outline']
                
                
                dict_for_view[items] = self.__create_dict(self,drawing_2_list)
                #print(items+colorpalette[i])
                #i += 1
                drawing_1_list += drawing_2_list   
            
            
            if view_angle == 'internal_view':
                dimension_list = self.__creating_dimensions_internal(self,dict_for_view,drawing_1_list)
            
            else:
                dimension_list = self.__creating_dimensions_top_front(self,dict_for_view,drawing_1_list)
        else:
            dimension_list = {}
        #plt.show()
        return dimension_list

    @staticmethod
    def __component_ID_detail(dict1):
        outline_dim = dict1['outline']['dims']
        x0, y0 = outline_dim['x0'], outline_dim['y0']
        com_dtemp = {}
        rank = []
        for keys in dict1:
            if keys == 'outline':
                continue
            t_d2 = dict1[keys]['dims']
            #print(dict1[keys])
            x0c, y0c, xnc, ync = t_d2['x0'], t_d2['y0'], t_d2['xn'], t_d2['yn']
            xc, yc = (x0c+xnc)/2, (y0c+ync)/2
            r1 = np.sqrt((xc-x0)^2+(yc-y0)^2)+np.power((yc-y0),2)
            com_dtemp[r1] = keys
            rank.append(r1)
        #ascend the rank then call the com_dtemp to define the names
        rank = sorted(rank)
        com_ID={}
        for i in range(len(rank)):
            c_ID = 'C-'+str(i+1)
            com_ID[com_dtemp[rank[i]]] = c_ID
        return com_ID




    @staticmethod
    def __creating_dimensions_internal(self,dict1,drawing_list):
        #the_array = self.__creating_drawing_shade(dict1)
        dim_dict, dimension_list, outline_dim = {'hor':{}, 'ver': {}}, [], dict1['outline']['dims']
       
        dim_dict, dimension_list = self.draw_inner_dimension_component(self,dim_dict,dimension_list,dict1)
        
        x0, y0, xn, yn = outline_dim['x0'], outline_dim['y0'], outline_dim['xn'], outline_dim['yn']    #xi0, yi0, xin, yin = outline_dim['xi0'], outline_dim['yi0'], outline_dim['xin'], outline_dim['yin']   
        lengths = {'x0' :x0, 'y0' : y0 , 'xn' : xn, 'yn' :yn, 'length' : xn-x0, 'width' : yn- y0}
        com_ID= self.__component_ID_detail(dict1)
        # print(com_ID)

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

        for keys in dict1: #this we are doing for overall dimension of the component
            if keys == 'outline':
                continue
            t_d2 = dict1[keys]['dims']
            #print(dict1[keys])
            x0c, y0c = t_d2['x0'], t_d2['y0']
            xnc, ync = t_d2['xn'], t_d2['yn']
            hor_string = 'h' + str(x0c) + '&' + str(xnc)
            ver_string = 'v' + str(y0c) + '&' + str(ync)
            if dim_dict['hor'].has_key(hor_string) and dim_dict['ver'].has_key(ver_string):
                then_chill = 1
            elif not dim_dict['hor'].has_key(hor_string) and dim_dict['ver'].has_key(ver_string):
                if str1 == 'room_top_view':
                    y_opt = self.__update_hornver_dim_room_top_view(self,t_d2,the_array,outline_dim,outer_dim_dict,'y_opt')
                else:
                    y_opt = self.__update_hornver_dim(self,t_d2,the_array,outline_dim,outer_dim_dict,'y_opt')
                
                dim_dict['hor'][hor_string] = [y_opt, [x0c,xnc]]
                dimension_list.append([[x0c,y_opt],[xnc,y_opt]])
            
            elif dim_dict['hor'].has_key(hor_string) and not dim_dict['ver'].has_key(ver_string):
                if str1 == 'room_top_view':
                    x_opt = self.__update_hornver_dim_room_top_view(self,t_d2,the_array,outline_dim,outer_dim_dict,'x_opt')
                else:
                    x_opt = self.__update_hornver_dim(self,t_d2,the_array,outline_dim,outer_dim_dict,'x_opt')
                dim_dict['ver'][ver_string] = [x_opt, [y0c,ync]]
                dimension_list.append([[x_opt,y0c],[x_opt,ync]])

            else:
                if str1 == 'room_top_view':
                    x_opt, y_opt = self.__update_hornver_dim_room_top_view(self,t_d2,the_array,outline_dim,outer_dim_dict,'xy_opt')
                else:
                    x_opt, y_opt = self.__update_hornver_dim(self,t_d2,the_array,outline_dim,outer_dim_dict,'xy_opt')
                # the problem is y_opt does not take into acccount if x1-x2 has already been shown
                
                dim_dict['hor'][hor_string] = [y_opt, [x0c,xnc]]
                dimension_list.append([[x0c,y_opt],[xnc,y_opt]])
            
                dim_dict['ver'][ver_string] = [x_opt, [y0c,ync]]
                dimension_list.append([[x_opt,y0c],[x_opt,ync]])

        return dimension_list




    @staticmethod
    def __creating_dimensions_room_top_view(self,dict1,drawing_list):
        
        the_array = self.__creating_drawing_shade_room_top_view(self,dict1)
        
        outline_dim = dict1['outline']['dims']
        dim_dict = {'hor':{}, 'ver': {}}
        outer_dim_dict = {'hor':{}, 'ver': {}}
        dimension_list = []

        #xc , yc = (dict1['outline']['dims']['xn'] + dict1['outline']['dims']['x0'])/2, (dict1['outline']['dims']['yn'] + dict1['outline']['dims']['y0'])/2
        
        #drwaing overall component dimensions
        dimension_list = self.__draw_overall_dimension_component(self,dict1,'room_top_view',dim_dict,the_array,outline_dim,outer_dim_dict,dimension_list)
        
                
        #drawing inner dimension of hte component
        dim_dict, dimension_list = self.draw_inner_dimension_component(self,dim_dict,dimension_list,dict1)
              
                

        
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

       
        
        lengths = {'x0' :x0, 'y0' : y0 , 'xn' : xn, 'yn' :yn, 'length' : xn-x0, 'width' : yn- y0}
        com_ID= self.__component_ID_detail(dict1)
        # print(com_ID)
        return {'dimension': dimension_list, 'lengths': lengths, 'IDs':com_ID}


    @staticmethod
    def __creating_dimensions_top_front(self,dict1,drawing_list):
        
        the_array = self.__creating_drawing_shade(dict1) 
        #fig = plt.figure() 
        outline_dim = dict1['outline']['dims']
        #lets do this
        dim_dict = {'hor':{}, 'ver': {}}
        outer_dim_dict = {'hor':{}, 'ver': {}}
        dimension_list = []

        #xc , yc = (dict1['outline']['dims']['xn'] + dict1['outline']['dims']['x0'])/2, (dict1['outline']['dims']['yn'] + dict1['outline']['dims']['y0'])/2
        
        #drwaing overall component dimensions
        dimension_list = self.__draw_overall_dimension_component(self,dict1,'top_front',dim_dict,the_array,outline_dim,outer_dim_dict,dimension_list) 

        #drawing ineer dimension of hte componenets
        dim_dict, dimension_list = self.draw_inner_dimension_component(self,dim_dict,dimension_list,dict1)
              

        
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

       
        lengths = {'x0' :x0, 'y0' : y0 , 'xn' : xn, 'yn' :yn, 'length' : xn-x0, 'width' : yn- y0}
        com_ID= self.__component_ID_detail(dict1)
        # print(com_ID)
        return {'dimension': dimension_list, 'lengths': lengths, 'IDs':com_ID}
        #return {'dimension': dimension_list, 'lengths': lengths}      
        #make the string and check of it already exist

    @staticmethod 
    def __checking_outer_existence(self,outer_dim_dict,key1, yi,up_or_down, x1,x2, x0,xn): #x1 to x2 are already x1-x2
        #print(yi,key1,self.__reveal_keys(outer_dim_dict[key1]),str(x1)+'-'+str(x2))
        if not outer_dim_dict[key1].has_key(yi):
            #print('i was in here 1')
            outer_dim_dict[key1][yi] = np.zeros(xn-x0)
            outer_dim_dict[key1][yi][x1-x0:x2-x0]=1
            return yi
        else:
            np_array_yi = outer_dim_dict[key1][yi]
            if sum(np_array_yi[x1-x0:x2-x0]) < 10:
                #print('i was in here 2')
                outer_dim_dict[key1][yi][x1-x0:x2-x0]=1
                return yi
            else:
                yi = yi +up_or_down*100
                #print('i was in here 3')
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
                        #if ps-yi0 > 25:
                        #    ps -= 25
                        #elif ps - yi0 <= 25 and ps-yi0 >5:
                        #    ps -= 5
                        #else:
                        ps -=1


                if bool_y1:
                    y1 = self.__checking_outer_existence(self,outer_dim_dict,'hor', y0-200,-1, x0c,xnc, x0,xn)
                    
                    #y1 = y0 - 100
            
            if ync + 200 < yn:
                y2 = self.__checking_outer_existence(self,outer_dim_dict,'hor', yn+200,1, x0c,xnc, x0,xn)
                #print(y2)
                #y2 = yn + 100
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
                        #pe -= 1
                        #if pe-yin < 25:
                        #    pe -= 25
                        #elif pe - yi0 <= 25 and pe-yi0 >5:
                        #    pe -= 5
                        #else:
                        pe -=1

                if bool_y2:
                    y2 = self.__checking_outer_existence(self,outer_dim_dict,'hor', yn+200,1, x0c,xnc, x0,xn)
                    #print(y2)
                    #y2 = yn + 100
            ycc = (y0c+ync)/2
            #print('y1',y1)
            #print('y2',y2)
            if abs(y1-ycc) < abs(y2-ycc):
                #print('returned y1')
                if outer_dim_dict['hor'].has_key(y2):
                    #print ('y2 vanished')
                    outer_dim_dict['hor'][y2][x0c-x0:xnc-x0] = np.zeros(xnc-x0c)
                return y1
            else:
                #print('returned y2')
                if outer_dim_dict['hor'].has_key(y1):
                    #print ('y1 vanished')
                    outer_dim_dict['hor'][y1][x0c-x0:xnc-x0] = np.zeros(xnc-x0c)
                #outer_dim_dict['hor'][y1][x0c-x0:xnc-x0] = np.zeros(xnc-x0c)
                return y2

        #lets go to vertical lines now
        def spit_out_opt_x(self,x0c,xnc,y0c,ync,x0,y0,xi0,yi0,xin,yin,xn,yn,the_array,outer_dim_dict): #y0c,ync,x0c,xnc,x0,y0,xn,the_array
            if y0c - 200 < x0:
                y1 = self.__checking_outer_existence(self,outer_dim_dict,'ver', x0-200,-1, x0c,xnc, y0,yn)
                #y1 = x0 - 100
            else:
                bool_y1 = True
                ps = y0c-100 
                while ps > x0 +200:
                    pe = ps + 100
                    if sum(sum(the_array[ps-x0:pe-x0,x0c-y0:xnc-y0])) < 100:
                        #we found it
                        the_array[ps-x0,x0c-y0:xnc-y0] = np.ones(xnc-x0c)
                        y1 = ps
                        bool_y1 = False
                        break
                    else:
                        ps -= 1
                if bool_y1:
                    y1 = self.__checking_outer_existence(self,outer_dim_dict,'ver', x0-200,-1, x0c,xnc, y0,yn)
                    #y1 = x0 - 100
            
            if ync + 200 < xn:
                y2 = self.__checking_outer_existence(self,outer_dim_dict,'ver', xn+200,+1, x0c,xnc, y0,yn)
                #y2 = xn + 100
            else:
                bool_y2 = True
                pe = ync +100
                while pe < yn-200:
                    ps = pe - 100
                    if sum(sum(the_array[ps-x0:pe-x0,x0c-y0:xnc-y0])) < 100:
                        #we found it
                        y2 = pe
                        the_array[pe-x0,x0c-y0:xnc-y0] = np.ones(xnc-x0c)
                        bool_y2 = False
                        break
                    else:
                        pe -= 1
                if bool_y2:
                    y2 = self.__checking_outer_existence(self,outer_dim_dict,'ver', xn+200,+1, x0c,xnc, y0,yn)
                    #y2 = xn + 100
            ycc = (y0c+ync)/2
            #print('x1',y1)
            #print('x2',y2)
            if abs(y1-ycc) < abs(y2-ycc):
                #outer_dim_dict['ver'][y2][x0c-x0:xnc-x0] = np.zeros(xnc-x0c)
                #print('returned x1')
                if outer_dim_dict['ver'].has_key(y2):
                    #print ('x2 vanished')
                    outer_dim_dict['ver'][y2][x0c-y0:xnc-y0] = np.zeros(xnc-x0c)
                return y1
                
            else:
                #print('returned x2')
                if outer_dim_dict['ver'].has_key(y1):
                    #print ('x1 vanished')
                    outer_dim_dict['ver'][y1][x0c-y0:xnc-y0] = np.zeros(xnc-x0c)
                #outer_dim_dict['ver'][y1][x0c-x0:xnc-x0] = np.zeros(xnc-x0c)
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
        

        #xcc, ycc = (x0c+xnc)/2, (y0c+ync)/2

        """ def spit_out_opt_y(self,x0c,xnc,y0c,ync,x0,y0,xi0,yi0,xin,yin,xn,yn,the_array,outer_dim_dict):
            if y0c - 200 < y0:
                y1 = self.__checking_outer_existence(self,outer_dim_dict,'hor', y0-200,-1, x0c,xnc, x0,xn)
                """

        #lets start with horizontal line
        def spit_out_opt_y(self,x0c,xnc,y0c,ync,x0,y0,xi0,yi0,xin,yin,xn,yn,the_array,outer_dim_dict):
            if y0c - 100 < y0:
                y1 = self.__checking_outer_existence(self,outer_dim_dict,'hor', y0-100,-1, x0c,xnc, x0,xn)
                
                #y1 = y0 - 100
            else:
                bool_y1 = True
                ps = y0c-100 
                while ps > yi0:
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
                    y1 = self.__checking_outer_existence(self,outer_dim_dict,'hor', y0-100,-1, x0c,xnc, x0,xn)
                    
                    #y1 = y0 - 100
            
            if ync + 100 < yn:
                y2 = self.__checking_outer_existence(self,outer_dim_dict,'hor', yn+100,1, x0c,xnc, x0,xn)
                #print(y2)
                #y2 = yn + 100
            else:
                bool_y2 = True
                pe = ync +100
                while pe < yin:
                    ps = pe - 100
                    if sum(sum(the_array[x0c-x0:xnc-x0,ps-y0:pe-y0])) < 100:
                        #we found it
                        y2 = pe
                        the_array[x0c-x0:xnc-x0,pe-y0] = np.ones(xnc-x0c)
                        bool_y2 = False
                        break
                    else:
                        #pe -= 1
                        #if pe-yin < 25:
                        #    pe -= 25
                        #elif pe - yi0 <= 25 and pe-yi0 >5:
                        #    pe -= 5
                        #else:
                        pe -=1

                if bool_y2:
                    y2 = self.__checking_outer_existence(self,outer_dim_dict,'hor', yn+100,1, x0c,xnc, x0,xn)
                    #print(y2)
                    #y2 = yn + 100
            ycc = (y0c+ync)/2
            #print('y1',y1)
            #print('y2',y2)
            if abs(y1-ycc) < abs(y2-ycc):
                #print('returned y1')
                if outer_dim_dict['hor'].has_key(y2):
                    #print ('y2 vanished')
                    outer_dim_dict['hor'][y2][x0c-x0:xnc-x0] = np.zeros(xnc-x0c)
                return y1
            else:
                #print('returned y2')
                if outer_dim_dict['hor'].has_key(y1):
                    #print ('y1 vanished')
                    outer_dim_dict['hor'][y1][x0c-x0:xnc-x0] = np.zeros(xnc-x0c)
                #outer_dim_dict['hor'][y1][x0c-x0:xnc-x0] = np.zeros(xnc-x0c)
                return y2

        #lets go to vertical lines now
        def spit_out_opt_x(self,x0c,xnc,y0c,ync,x0,y0,xi0,yi0,xin,yin,xn,yn,the_array,outer_dim_dict): #y0c,ync,x0c,xnc,x0,y0,xn,the_array
            if y0c - 100 < x0:
                y1 = self.__checking_outer_existence(self,outer_dim_dict,'ver', x0-100,-1, x0c,xnc, y0,yn)
                #y1 = x0 - 100
            else:
                bool_y1 = True
                ps = y0c-100 
                while ps > xi0:
                    pe = ps + 100
                    if sum(sum(the_array[ps-x0:pe-x0,x0c-y0:xnc-y0])) < 100:
                        #we found it
                        the_array[ps-x0,x0c-y0:xnc-y0] = np.ones(xnc-x0c)
                        y1 = ps
                        bool_y1 = False
                        break
                    else:
                        ps -= 1
                if bool_y1:
                    y1 = self.__checking_outer_existence(self,outer_dim_dict,'ver', x0-100,-1, x0c,xnc, y0,yn)
                    #y1 = x0 - 100
            
            if ync + 100 < xn:
                y2 = self.__checking_outer_existence(self,outer_dim_dict,'ver', xn+100,+1, x0c,xnc, y0,yn)
                #y2 = xn + 100
            else:
                bool_y2 = True
                pe = ync +100
                while pe < yin:
                    ps = pe - 100
                    if sum(sum(the_array[ps-x0:pe-x0,x0c-y0:xnc-y0])) < 100:
                        #we found it
                        y2 = pe
                        the_array[pe-x0,x0c-y0:xnc-y0] = np.ones(xnc-x0c)
                        bool_y2 = False
                        break
                    else:
                        pe -= 1
                if bool_y2:
                    y2 = self.__checking_outer_existence(self,outer_dim_dict,'ver', xn+100,+1, x0c,xnc, y0,yn)
                    #y2 = xn + 100
            ycc = (y0c+ync)/2
            #print('x1',y1)
            #print('x2',y2)
            if abs(y1-ycc) < abs(y2-ycc):
                #outer_dim_dict['ver'][y2][x0c-x0:xnc-x0] = np.zeros(xnc-x0c)
                #print('returned x1')
                if outer_dim_dict['ver'].has_key(y2):
                    #print ('x2 vanished')
                    outer_dim_dict['ver'][y2][x0c-y0:xnc-y0] = np.zeros(xnc-x0c)
                return y1
                
            else:
                #print('returned x2')
                if outer_dim_dict['ver'].has_key(y1):
                    #print ('x1 vanished')
                    outer_dim_dict['ver'][y1][x0c-y0:xnc-y0] = np.zeros(xnc-x0c)
                #outer_dim_dict['ver'][y1][x0c-x0:xnc-x0] = np.zeros(xnc-x0c)
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
        #dict_outline = dict1['outline']


        def develop_outline_dict(all_1_data):
            all_update_data = {'horizontal':{},'vertical':{}}
            for keys in all_1_data:
                for lines in all_1_data[keys]:
                    
                    for items in all_1_data[keys][lines]:
                        #print(len(items))
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
                        #print(items)
                        if keys == 'horizontal':
                            x0,xn = items[0],items[1]
                            y0 = numbers if lines =='Eb' else numbers - 250
                            yn = numbers+250 if lines =='Eb' else numbers

                        else:
                            #print('im here')
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
                    #print('number',numbers)
                    for items in dict1[keys1][keys][numbers]:
                        #print(items)
                        if keys == 'horizontal':
                            x0,xn = items[0],items[1]
                            y0,yn = numbers -100, numbers +100

                        else:
                            #print('im here')
                            y0,yn = items[0],items[1]
                            x0, xn = numbers-100, numbers + 100 
                        the_array = updating_array(the_array,x0,xn,y0,yn,x00,y00,xnn,ynn)

            #the_array = updating_array(the_array,t_d2['x0'],t_d2['xn'],t_d2['y0'],t_d2['yn'],x00 , y00,xnn,ynn)
        
        return the_array





        

    @staticmethod
    def __creating_drawing_shade(dict_for_view):
        dict1 = dict_for_view
        x00 , y00 = dict1['outline']['dims']['x0'],dict1['outline']['dims']['y0']
        s = (dict1['outline']['dims']['xn']-x00,dict1['outline']['dims']['yn']-y00) # xn-x0,yn-y0
        the_array = np.zeros(s)
        def updating_array(the_array,x0,xn,y0,yn,x00, y00 ):
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
        #plt.imshow(the_array)
        #plt.show()
        return the_array
    



    @staticmethod
    def __create_dict(self,drawing, outline_bool = False):
        draw_hor_list, draw_ver_list = self.__separate_hor_ver(drawing)
        draw_hor_dict = {item[0]: [] for item in draw_hor_list}
        draw_ver_dict = {item[0]: [] for item in draw_ver_list}
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
        dims = self.__find_thickness(self,draw_hor_dict, draw_ver_dict, outline_bool)
        return {'horizontal':draw_hor_dict, 'vertical': draw_ver_dict, 'dims': dims}



    @staticmethod
    def __find_thickness(self,draw_hor_dict, draw_ver_dict, outline_bool = False):
        ls1=self.__reveal_keys(draw_hor_dict) #all the keys in ascending order
        ls2=self.__reveal_keys(draw_ver_dict)
        #print('hor',ls1, 'ver',ls2)
        
            #r11=ls1[0:2] #first two y coordinates of the drawing
            #r12=ls1[-2:] # last two y coordinates of the drawing
            #r21=ls2[0:2] #first two x coordinates of the drawing
            #r22=ls2[-2:] #last two x coordinates of the drawing
            #thickness= max(abs(r11[0]-r11[1]),abs(r12[0]-r12[1]),abs(r21[0]-r21[1]),abs(r22[0]-r22[1]))
        x0, y0, xn, yn = ls2[0], ls1[0],ls2[-1], ls1 [-1]
        #print('x0', x0, 'y0', y0, 'xn', xn, 'yn', yn)
        #finding xi0 , yi0, xin, yin
        if outline_bool:
            def find_inner_ends(x0,xn,ls1):
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
            #print('xi0', xi0, 'yi0', yi0, 'xin', xin, 'yin', yin)
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
        #print(ls)
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
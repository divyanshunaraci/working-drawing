#Importing necessary dimensions
import json, os, glob, shutil , requests
import copy 
import numpy as np   
import threading


#This class is used to develop the data for ground floors and room_top_view
#Room_top_view is again modified in class named floor_plan_component1
class floor_plan_outline1(object):


    def __init__(self,drawing_list,thickness):
        #this class is initialized with drawing_list that comes from JSON file and a thickness value.
        #this class id called from floor_plan_additional- the input thickness value can be changed in floor_plan_additional class
        self.draw_1_hor_dict, self.draw_1_ver_dict,  self.x0, self.y0, self.xn, self.yn = self.__create_dict(self,drawing_list) #this function identifies the outlines , the end corners for the drawing. It creates the horizontal and vertical dictionary each dictionary his keys as the one common coordinate for a line. For example the vertical line has common X coordinate and the horizontal line has common Y coordinate. Therefore in the horizontal dictionary the keys would be the vertical coordinates. Eight each of the key value, list of all the lines exist at that horizontal or vertical coordinate the list contents they start not in the end node and in each of the list there could be several of those segments of line . The first 2 items of the list are just the start an endnote data  data. If the third item exists in the dictionary that means it has been identified as one of the wall. The walls could be exterior wall left bottom top and right the interior wall left bottom right and stop N external internal wall again left right top bottom. The third item is a list where the first item is the string that is identifying the type of the wall internal external or external internal and the second 2 items shows the dimension coordinates for start node and the end node the items are XYNXY however this will be confirmed soon. 
        self.org_hor, self.org_ver, self.thickness  = copy.deepcopy(self.draw_1_hor_dict), copy.deepcopy(self.draw_1_ver_dict), thickness
        #print(self.org_hor, self.org_ver)
        self.__update_dicts() #all the data gets identified based on interier wall, inside of exterior wall

        self.all_detail = {'horizontal' : self.draw_1_hor_dict, 'vertical' : self.draw_1_ver_dict} #this data get updated in remove duplicate function. That means finally this variable does not contend the duplicate horizontal or vertical dimension labels. 
        self.data_to_return = self.__remove_duplicate(self) #this method remove all the duplicate dimensions that are occurring twice or thrice because of the same size of components all sections along horizontal or vertical directions 


    @property #this was the original data created for horizontal and vertical dimensions. This data basically represent the outline coming from Jason file Anne the added dimension if it it requires to show the dimension. Otherwise the data is left blank where the dimension has to be shown. 
    def original_data(self):
        #This method provides horizontal and vertical dimensions but can contain duplicates
        return {'hor' : self.org_hor, 'ver': self.org_ver}


    @property 
    def all_data(self):
        #This method provides horizontal and vertical dimensions but can contain duplicates
        return self.all_detail
    
    @property
    def data(self): 
        #This data is returned to HTML
        return self.data_to_return
    
    @staticmethod #there is a scope for condensing this function where the if else condition is applied four horizontal and vertical lines. Instead of creating two list horizontal enlist vertical create one list common that contains the code information the same process is applied in both the effects condition except the string name is different. Hence for the string name the effects condition can be applied. Finally instead of returning horizontal plus vertical, simply common can be returned by this function. 
    def __remove_duplicate(self): #heal we are removing the duplicate dimension created earlier by the other functions. The dimensions I removed by placing unique good for each of the dimension. The code is defined by ostring which the first letter is edge or we based on if it is horizontal line or vertical line then the numerical value for the start Nord is placed and then Ensign is placed to show that start node is over. After the end sign the coordinate for end note is return. For the horizontal line the the horizontal start note an horizontal and node is used and for vertical line vertical start node in vertical endnote is used. This function makes sure that there is no duplicate dimension exist in the drawing 
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
                                    self.all_detail[lines][keys][i][2] =[strr2]## if it shouldnt be drawn then change the value to just string without x1 y1x2y2 here we are also updating the original dataset and remove the duplicate dimension from the points. It helps to keep a clean data for the future uses. However this data has not been used again in this code currently. 
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
    #The following method was used for development purposes
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
        #This updates all the dimension values 
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
            if i_list > len(list_keys)-1:
                break
            key = list_keys[i_list]
            for i in range(len(draw_1_hor_dict[list_keys[i_list]])):#
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
            if i_list > len(list_keys)-1:
                break
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
                if len(values) ==2: #that means nothing was assigned to it earlier 
                    if values[1]-values[0] < 2*thickness: #we do not plot any dimension for the lines with less than two T thickness 
                        self.draw_1_hor_dict[key][i_value].append([strr])
                    else:
                        if self.__if_nothing_at_bottom(self,i_list,list_keys,values[0],values[1],key): #we check to make sure that up to two T thickness nothing exist at the bottom of this interior line. If there is nothing then this check passes this means we can draw the line I mean the dimension below this interior line 
                            self.draw_1_hor_dict[key][i_value].append([strr,[values[0],values[1]],[key-thickness,key-thickness]]) #
                        else:
                            self.draw_1_hor_dict[key][i_value].append([strr,[values[0],values[1]],[key+thickness,key+thickness]]) #checks must be applied here it it is going thickness #however we do not apply any check to make sure that nothing exists on the top of this line and I'm not sure why this check was not produced. It didn't create any problems so far but just to be fully competent this check must be checked too that nothing exist on the top because if something exists on the top then we should not be placing this dimension 
                        #now we will check for its proximity upside
                        self.__update_int_hor(self,i_list,list_keys,values[0],values[1],x0,xn,key,-thickness,strr) #when we're coming from bottom , then we find something some outline on the top of this bottom line if something like that exist then we also draw a dimension for that if it is smaller than the current line. I think this should be changed in the respect that it should not only be working for the smaller line it can also work for the larger line it should be fine I guess because we are not talking about the interiors there could be anything in the interior it could even be the bigger one we just need to make sure that when that line is being checked that time we make sure that we have already assigned the numbers for it 
    
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
                if len(values) == 2: #if it is already tagged tagged as some other line the new need to do this operation 
                    #while np.sum(filling_array) <= x2-x1:
                    if x1-t <= values[0] and x2+t >= values[1]: #this check is making sure that the gnu line for which we are finding the dimension recides inside the exterior dimension it is next to. If it is larger than the exterior dimension then we solve it some other way. 
                        if np.sum(filling_array[(values[0]-x0):(values[1]-x0)]) == 0:
                            if values[1]-values[0]+2*t < x2-x1: #first we added TNT do check weather it decides inside the exterior dimension. Now we're checking again if it's size plus 2D is actually less than the original exterior dimension or not. If it is not less than that then there is no need to plot it because it is very obvious . if the client once to show this dimension because he is more interested in showing the interior dimension then this is the chance, this is the place where a change has to be applied. 
                                self.draw_1_hor_dict[keys][i].append([strr1,values[0:2],[keys-thickness,keys-thickness]])
                            #elif values[1]-values[0] > x2-x1 +3*t:
                            #    radomevent =1
                            else: #if we don't have to draw even then we note down the I don't name whether it is interior bottom interior top or whatever 
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
    def __create_dict(self,drawing): #create dictionary only returns the dictionary created for horizontal and vertical lines. It removes the duplication of the lines all it takes care of the overlapping of the lines. It also provides the lines in the order of its distance from origin. It does not provide any detail about the exterior or interior type of line. 
        draw_hor_list, draw_ver_list = self.__separate_hor_ver(drawing)
        draw_hor_dict = {item[0]: [] for item in draw_hor_list}#oh key value is created for all the horizontal and vertical lines and the key is created at the common node. It is initialized with a list . Afterwards the list will be filled with the coordinates 
        draw_ver_dict = {item[0]: [] for item in draw_ver_list}
        for item in draw_hor_list:
            draw_hor_dict[item[0]].append(item[1])
        for item in draw_ver_list:
            draw_ver_dict[item[0]].append(item[1])
        def takeFirst(elem): #define function for list sorting
            return elem[0]

        for item in draw_hor_dict:#here we are sorting all the lines in the sequence that they appear for example for all the horizontal lines, those will be appearing the first who are closest to origin or X axis 
            draw_hor_dict[item].sort(key=takeFirst) #sorting the lists by first element
        for item in draw_ver_dict:
            draw_ver_dict[item].sort(key=takeFirst)
        for item in draw_hor_dict:
            draw_hor_dict[item]=self.__truncate_list(draw_hor_dict[item]) #this function is detecting overlapping of the lines. For example, one line starts at 1 Ann ends at 5, other line starts at three ends at 6. This means there is no gap between these two lines these are just overlapping one another that means we do not have to show their dimension as separate. What we have to show is their complete dimension that means from 1 to 7 instead of 125 and 427. 
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
    def __separate_hor_ver(drawing): #heal the horizontal and vertical lines are separated from the drawing list if X one is equal to X2 then it is a vertical line, if Y one is equal to Y 2 then it is a horizontal line. We made sure that when the coordinate for a line are appended in a list then the first item represents the start node and the second item represents the end node. As far as this code is concerned or this method is concerned there is no problem in taking care of the inclined lines in the code. The list that is being returned contents onelist with two items the first item is the common note in horizontal or vertical line and the second item is again a list. This list represent the variable node in the line the first item of the list is the start nodes coordinate and the second item of the list is the end node of the coordinate 
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
        
        return ls

#This is the main class where data comes from HTML and sent back to HTML using hte object named .new_object
class floor_plan_additional(object):

    def __init__(self,j_object,room_names,room_view_name):
        self.j_object = j_object
        self.new_j_object = self.return_new_j_object(self,j_object,room_names,room_view_name)
        #self.new_j_object, self.url_name = self.return_new_j_object_with_images(self)


    @property
    def new_object(self):
        return self.new_j_object
    

    @staticmethod
    def return_new_j_object(self,j_object,room_names,room_view_name):

        drawing_1_list = j_object['floor_plan']['outline']
        fp0 = floor_plan_outline1(drawing_1_list,j_object['floor_plan']['thickness']) #the thickness needs to be changed
        #fp0.plot_all_outer_dim
        j_object['floor_plan']['dimension'] = fp0.data
        j_object['room_names'] = room_names
        del j_object['floor_plan']['thickness']

        #room_name =['KITCHEN','GBR']#['GBR']#
        
        view_angle =['top_view','front_view','internal_view'] #

        for key1 in room_names:
            if j_object['rooms'].has_key(key1):
                view_name = room_view_name[key1] #
                for key2 in view_name:
                    if j_object['rooms'][key1].has_key(key2):
                        #print(key1,key2)
                        if key2 == 'room_top_view':
                            drawing_list1 = self.output_list_room_top_views(key1, key2, j_object)
                            fp1 = floor_plan_outline1(drawing_list1,j_object['rooms'][key1][key2]['thickness']) # need changes to this value
                            
                            data_from_1_room_top_view = fp1.all_data
                            fp4 = floor_plan_component1(key1, key2, data_from_1_room_top_view, j_object)
                            j_object['rooms'][key1][key2]['dimension'] = fp4.data
                            j_object['rooms'][key1][key2]['component'] = fp4.components
                            j_object['rooms'][key1][key2]['texts'] = fp4.texts
                            del j_object['rooms'][key1][key2]['thickness']
                        else:
                            for key3 in view_angle:
                                #print(key3)
                                if j_object['rooms'][key1][key2].has_key(key3):
                                    fp3 = floor_plan_component1(key1, key2, key3, j_object)
                                    j_object['rooms'][key1][key2][key3]['dimension'] = fp3.data 
                                    j_object['rooms'][key1][key2][key3]['component'] = fp3.components

        return j_object


    @staticmethod
    def output_list_room_top_views(room_name, view_name, j_object):
        if 'outline' in j_object['rooms'][room_name][view_name]:
            drawing_4_list = j_object['rooms'][room_name][view_name]['outline']
            if 'floor_components' in j_object['rooms'][room_name][view_name]:
                if 'library' in j_object['rooms'][room_name][view_name]['floor_components']:
                    for items in j_object['rooms'][room_name][view_name]['floor_components']['library']:
                        if 'outline' in j_object['rooms'][room_name][view_name]['floor_components']['library'][items]:
                            drawing_4_list= drawing_4_list+ j_object['rooms'][room_name][view_name]['floor_components']['library'][items]['outline']
            for i in range(len(drawing_4_list)-1,0,-1):
                if len(drawing_4_list[i][0]) == 0:
                    del drawing_4_list[i]
                elif len(drawing_4_list[i][1]) == 0:
                    del drawing_4_list[i]
            return drawing_4_list
        else:
            return []




#This class is used for all views in view_1 and view_2 such as front view, internal view and top view and also works for room top view
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
            drawing_1_list = j_object['rooms'][room_name][view_name]['outline']
            if len(drawing_1_list) != 0:
                drawing_1_list  = self.__clean_drawing_list(drawing_1_list)
                #converting the list to dictionary of  for outline
                dict_for_view['outline'] = self.__create_dict(self,drawing_1_list,True)
                if 'floor_components' in list(j_object['rooms'][room_name][view_name]):
                    if 'library' in list(j_object['rooms'][room_name][view_name]['floor_components']):

                        for items in j_object['rooms'][room_name][view_name]['floor_components']['library']:
                            drawing_2_list= j_object['rooms'][room_name][view_name]['floor_components']['library'][items]['outline']
                            drawing_2_list  = self.__clean_drawing_list(drawing_2_list)
                            #converting the list to dictionary for components
                            dict_for_view[items] = self.__create_dict(self,drawing_2_list)
                            drawing_1_list += drawing_2_list
                            component_list += drawing_2_list
                            ID_dict[items] =  dict_for_view[items]['dims']
                        
                        #Getting the dimension list from dictionary and the list of demarkation of rooms
                dimension_list = self.__creating_dimensions_room_top_view(self,dict_for_view,drawing_1_list)
                
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
                            if 'external_points' in j_object['rooms'][room_name][view_name][view_angle]['floor_components']['library'][items]:
                                drawing_2_list = []
                                for internal_items in ['internal','carcass','skirting','loft_skirting','cover_panels','fillers']: #'fillers'
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
                                    drawing_1_list += drawing_2_list 
                                    component_list += drawing_2_list
                                    dict_for_view[items] = self.__create_dict(self,drawing_2_list)


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
            if keys == 'outline':
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
        unique_dim_x = []
        unique_dim_y = []
        for keys in dict1: 
            if keys == 'outline':
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
                    print()
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
        dimension_list = self.__draw_overall_dimension_component(self,dict1,'room_top_view',dim_dict,the_array,outline_dim,outer_dim_dict,dimension_list)
        
                
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
                hor_start_pt, ver_start_pt = yn + hor_up_down * 200, xn + ver_up_down * 200
                quadrant = 1

            elif quadrant_x <= 0 and quadrant_y <= 0: #quadrant 3 - bottom left
                x1, x2, y1, y2 = x0, x0c, y0, y0c
                #hor_start_pt, ver_start_pt = y0 - 200, x0 - 200
                hor_up_down, ver_up_down = -1, -1
                hor_start_pt, ver_start_pt = y0 + hor_up_down * 200, x0 + ver_up_down * 200
                quadrant = 3
            
            elif quadrant_x <= 0 and quadrant_y >= 0: #quadrant 2 - top left
                x1, x2, y1, y2 = x0, x0c, ync, yn
                #hor_start_pt, ver_start_pt = yn + 200, x0 - 200
                hor_up_down, ver_up_down = 1, -1
                hor_start_pt, ver_start_pt = yn + hor_up_down * 200, x0 + ver_up_down * 200
                quadrant = 2

            elif quadrant_x >= 0 and quadrant_y <= 0: #quadrant 4 - bottom right
                x1, x2, y1, y2 = xnc, xn, y0, ync
                #hor_start_pt, ver_start_pt = y0 - 200, xn + 200
                hor_up_down, ver_up_down = -1, 1
                hor_start_pt, ver_start_pt = y0 + hor_up_down * 200, xn + ver_up_down * 200
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
                    if all_coords[it1+1] - all_coords[it1] < 30 :
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
                hor_start_pt, ver_start_pt = yn + hor_up_down * 200, xn + ver_up_down * 200
                quadrant = 1

            elif quadrant_x <= 0 and quadrant_y <= 0: #quadrant 3 - bottom left
                x1, x2, y1, y2 = x0, x0c, y0, y0c
                #hor_start_pt, ver_start_pt = y0 - 200, x0 - 200
                hor_up_down, ver_up_down = -1, -1
                hor_start_pt, ver_start_pt = y0 + hor_up_down * 200, x0 + ver_up_down * 200
                quadrant = 3
            
            elif quadrant_x <= 0 and quadrant_y >= 0: #quadrant 2 - top left
                x1, x2, y1, y2 = x0, x0c, ync, yn
                #hor_start_pt, ver_start_pt = yn + 200, x0 - 200
                hor_up_down, ver_up_down = 1, -1
                hor_start_pt, ver_start_pt = yn + hor_up_down * 200, x0 + ver_up_down * 200
                quadrant = 2

            elif quadrant_x >= 0 and quadrant_y <= 0: #quadrant 4 - bottom right
                x1, x2, y1, y2 = xnc, xn, y0, ync
                #hor_start_pt, ver_start_pt = y0 - 200, xn + 200
                hor_up_down, ver_up_down = -1, 1
                hor_start_pt, ver_start_pt = y0 + hor_up_down * 200, xn + ver_up_down * 200
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
                    if all_coords[it1+1] - all_coords[it1] < 30 :
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
                
                if outer_dim_dict['hor'].has_key(y2):
                    
                    outer_dim_dict['hor'][y2][x0c-x0:xnc-x0] = np.zeros(xnc-x0c)
                return y1
            else:
                
                if outer_dim_dict['hor'].has_key(y1):
                    
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
                if outer_dim_dict['ver'].has_key(y2):
                    #
                    outer_dim_dict['ver'][y2][x0c-y0:xnc-y0] = np.zeros(xnc-x0c)
                return y1
                
            else:
                #
                if outer_dim_dict['ver'].has_key(y1):
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
        x00 , y00 = dict1['outline']['dims']['x0'],dict1['outline']['dims']['y0']
        s = (dict1['outline']['dims']['xn']-x00,dict1['outline']['dims']['yn']-y00) # xn-x0,yn-y0
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


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

        #In deep copy, we create a new object and then recursively populating it with copies of the child object, such that original object doesn't get changed
        self.org_hor, self.org_ver, self.thickness  = copy.deepcopy(self.draw_1_hor_dict), copy.deepcopy(self.draw_1_ver_dict), thickness
        
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
        #x0, xn is the minimum and maximum x value of the combination of all the horizontal lines 
        draw_1_hor_dict,x0,xn= self.draw_1_hor_dict, self.x0, self.xn
        #Numpy array of 0's for the entire horizontal length.
        updating_array = np.zeros(xn-x0+1)
        #It contains all the coordinates of the horizontal lines, i.e, the y-coordinates.
        list_keys = self.__reveal_keys(draw_1_hor_dict)
        #It plots the topmost dimension of the horizontal lines. 
        if strr=='Et':
            list_keys=sorted(list_keys,reverse=True)
        i_list = 0
        #This loop runs until all the values in the array is 1.
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
        #This function is used find the the maxmimum and minimum x and y coordinates
        ls1=self.__reveal_keys(draw_hor_dict) #all the keys in ascending order
        ls2=self.__reveal_keys(draw_ver_dict)
        r11=ls1[0:2] #first two y coordinates of the drawing
        r12=ls1[-2:] # last two y coordinates of the drawing
        r21=ls2[0:2] #first two x coordinates of the drawing
        r22=ls2[-2:] #last two x coordinates of the drawing
        thickness= max((r11[0]-r11[1]),(r12[0]-r12[1]),(r21[0]-r21[1]),(r22[0]-r22[1]))
        x0 = ls2[0]
        y0 = ls1[0]
        xn = ls2[-1]
        yn = ls1[-1]
        return x0, y0, xn, yn # pass thickness if needed



    


    @staticmethod
    def __create_dict(self,drawing): #create dictionary only returns the dictionary created for horizontal and vertical lines. It removes the duplication of the lines all it takes care of the overlapping of the lines. It also provides the lines in the order of its distance from origin. It does not provide any detail about the exterior or interior type of line. 
        #Outline coordinates are seperated into horizontal and vertical lines only
        draw_hor_list, draw_ver_list = self.__separate_hor_ver(drawing)

        #Sometimes we receive room_outlines which are not parallel to x or y axis, for these rooms calculating the minimum and maximum x-y coordinates is difficult,
        #so i am seperately doing this for those rooms only which are kept in a slanting way
        if not draw_hor_list and not draw_ver_list:
            minx, maxx, miny, maxy = np.inf, -np.inf, np.inf, -np.inf
            for i in drawing:
                minx = min(minx, i[0][0], i[0][1])
                maxx = max(maxx, i[0][0], i[0][1])
                miny = min(miny, i[1][0], i[1][1])
                maxy = max(maxy, i[1][0], i[1][1])
                
            return [], [], minx, miny, maxx, maxy
            
        #Here only the keys for the horizontal and vertical lines are stored, and in the two consecutive for loops we are appending the values also
        #Suppose for a horizontal line with coordinates [[2,4],[4,4]] the y-coordinates are same, so we store it like [4:[2,4]]
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
        minx, maxx, miny, maxy = np.inf, -np.inf, np.inf, -np.inf

        #Here we are finding the minimum and maximum x and y coordinates for all the edges present in the drawing list.
        for x in draw_hor_dict:
            minx = min(minx, draw_hor_dict[x][0][0],draw_hor_dict[x][0][1])
            maxx = max(maxx, draw_hor_dict[x][0][0],draw_hor_dict[x][0][1])
        for x in draw_ver_dict:
            miny = min(miny, draw_ver_dict[x][0][0],draw_ver_dict[x][0][1])
            maxy = max(maxy, draw_ver_dict[x][0][0],draw_ver_dict[x][0][1])
        
        # for x in draw_hor_dict:
        #     print(draw_hor_dict[x], 'XX')
        #     minx = min(minx, draw_hor_dict[x][0][0],draw_hor_dict[x][0][1])
        #     maxx = max(maxx, draw_hor_dict[x][0][0],draw_hor_dict[x][0][1])
        # for x in draw_ver_dict:
        #     miny = min(miny, draw_hor_dict[x][0][0],draw_hor_dict[x][0][1])
        #     maxy = max(maxy, draw_hor_dict[x][0][0],draw_hor_dict[x][0][1])
        x0, y0, xn, yn = minx, miny, maxx, maxy
        xt0, yt0, xtn, ytn = self.__find_thickness(self,draw_hor_dict, draw_ver_dict)
        #We compare if the values returned by __find_thickness with the existing values and 
        #consider the minimum and maximum x and y coordinates
        x0 = x0 if x0<=xt0 else xt0
        xn = xn if xn>=xtn else xtn
        y0 = y0 if y0<=yt0 else yt0
        yn = yn if yn>=ytn else ytn
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


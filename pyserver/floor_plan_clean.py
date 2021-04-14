import math
import numpy as np

class floor_plan_validation(object):
    def __init__(self,j_object):
        self.j_object = j_object
        self.new_object = self.update_all(self)

    @property
    def clean_data(self):
        return self.new_object

    
    @staticmethod
    def update_all(self):
        new_object = {}
        j_object = self.j_object
        new_object['project_details'] = j_object['project_details']
        new_object['org_details'] = j_object['org_details'] 
        """
        
        each drawing view required - 
        # Title
        # tag plan
        # key is just a number
        1. outline []
        2. dimensions []
        3. lengths {}
        3. text- its values and its location: doors,  windows, room names, c1, c2, handle assessories
            key - text name and values are coordinates        
        4. shutter items []- their outline
        5. window and door outline []- their outline, text can be added in text
        6. arrows []-{} start location and end location outline
        7. legend [] - [[image url, text],[...]]
        8. image - {} image url and its bound


        Each table view required
        # Title
        # tag table
        1. keys with c1, c2, c3 with their properties stored in dict {name :, width : ... etc
        
        
        Each image view required
        # Title
        # tag image
        1. main image
        2. items in legend [[image url, text],[]]
        3. dimension
        4. text
        5. arrow

        Each additional view requires
        # title
        # tag additional- table/normal
        1. dimensions
        2. text
        3. arrow
        4. legend [[image url, text],[]]

        """



        new_object['sequence'] = [] #need to save tag vs sequence
        ind1 = len(new_object['sequence']) + 1
        new_object['sequence'].append(ind1)
        new_object[ind1] = {}
        new_object[ind1]['title'] = 'Ground Floor Plan'
        new_object[ind1]['tag'] = 'floor_plan'
        new_object[ind1]['outline'] = j_object['floor_plan']['outline']
        new_object[ind1]['components'] = []
        new_object[ind1]['dimensions'] = j_object['floor_plan']['dimension']['dimension']
        new_object[ind1]['lengths'] = j_object['floor_plan']['dimension']['lengths']
        new_object[ind1]['text'] = j_object['floor_plan']['room_name_positions'] #keys are text name and respective values is their coordinate
        new_object[ind1]['shutter'] = []
        new_object[ind1]['opening'] = []
        new_object[ind1]['arrow'] = {}
        new_object[ind1]['legend'] = []
        new_object[ind1]['image'] = {}

        self.__room_index_info(self, new_object, j_object)


        return new_object

    @staticmethod
    def __room_index_info(self, new_object, j_object):
        
        for room_name in j_object['rooms']:
            if room_name in j_object['room_names']: #otheriwse it is material thumbnails

                room_TV_object = j_object['rooms'][room_name]['room_top_view']
                ind1 = len(new_object['sequence']) + 1
                new_object['sequence'].append(ind1)
                new_object[ind1] = {}
                new_object[ind1]['title'] = room_name + ' - ' + 'Room Top View'
                new_object[ind1]['tag'] = 'room_top_view'
                new_object[ind1]['outline'] = j_object['rooms'][room_name]['room_top_view']['outline']
                new_object[ind1]['components'] = j_object['rooms'][room_name]['room_top_view']['component']
                new_object[ind1]['dimensions'] = j_object['rooms'][room_name]['room_top_view']['dimension']['dimension']
                new_object[ind1]['lengths'] = j_object['rooms'][room_name]['room_top_view']['dimension']['lengths']
                c_ID = j_object['rooms'][room_name]['room_top_view']['dimension']['IDs']
                comp_text_data = j_object['rooms'][room_name]['room_top_view']['texts'] #contains ID:x0 y0 xn yn
                text_data = {}
                for each_comp in list(comp_text_data):
                    x1 = (comp_text_data[each_comp]['x0']+ comp_text_data[each_comp]['xn'])/2
                    y1 = (comp_text_data[each_comp]['y0']+ comp_text_data[each_comp]['yn'])/2
                    text_data[c_ID[each_comp]] = [x1,y1]
                #c_ID is key - component name, value - ID to be placed in figure
                new_object[ind1]['shutter'] = []
                new_object[ind1]['opening'] = [] #add when info is provided
                new_object[ind1]['arrow'] = {}
                new_object[ind1]['legend'] = []
                new_object[ind1]['image'] = {}
                new_object[ind1]['text'] = text_data #need c1 c2 c3 and door and opening walls #j_object['rooms'][room_name]['room_top_view']['room_name_positions'] #keys are text name and respective values is their coordinate


                #add each view_i
                    #add each top view, internal view, top view
                
                #add materical thumbnails

                


                








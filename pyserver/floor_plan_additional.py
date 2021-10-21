#This is the main class where data comes from HTML and sent back to HTML using hte object named .new_object
from floor_plan_component import floor_plan_component1
from floor_plan_outline import floor_plan_outline1
class floor_plan_additional(object):

    #return_new_j_object send the JSON file, room names, and the room view names
    def __init__(self,j_object,room_names,room_view_name):
        self.j_object = j_object
        self.new_j_object = self.return_new_j_object(self,j_object,room_names,room_view_name)
        #self.new_j_object, self.url_name = self.return_new_j_object_with_images(self)


    @property
    def new_object(self):
        return self.new_j_object
    

    @staticmethod
    def return_new_j_object(self,j_object,room_names,room_view_name):

        #drawing_1_list contains the x,y coordinates of the ground floor plan from the JSON
        drawing_1_list = j_object['floor_plan']['outline']
        #floor_plan_outline1 class is called with the coordinates and the thickness value
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

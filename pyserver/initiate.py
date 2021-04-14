
"""
cd ..
cd myproject
. venv/bin/activate
cd Abhishek
cd '/Volumes/GoogleDrive/My Drive/LAB PC and LAPTOP/Professional Initiatives/Upwork/Freelancer- Agency/Current Projects/Abhinshek/GitHub/floor-plan-unmerged'
python2 server.py
"""

python2

import floor_plan_validation as fpv
import floor_plan_outline as fpo1
import json



j_open = open('dev/json/JSON_233.json',) # opening json file
data = json.load(j_open) #returns json object as dictionary

new_val = fpv.floor_plan_validation(data)


#new_val.warning
#new_val.error

new_json = fpo1.floor_plan_additional(new_val.json_object,new_val.room_names,new_val.room_view_name)


with open('dev/newData.json', 'w') as outfile:
    json.dump(new_val.json_object, outfile)

with open('dev/newFinalData.json', 'w') as outfile1:
    json.dump(new_json.new_object, outfile1)




error = new_val.error_log

print(warning)

print(error)

data['project_details']
data['org_details']
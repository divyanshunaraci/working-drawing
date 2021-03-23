import matplotlib
from flask import render_template, url_for, Flask, request, redirect, session, abort, flash, Response, make_response, jsonify
import json, collections
import threading
import requests
import time

import floor_plan_outline as fpo1
import floor_plan_validation as fpv
 
from flask_cors import CORS, cross_origin
import time
app=Flask(__name__, static_folder="static")
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['JSON_SORT_KEYS'] = False


@app.route("/", methods=["GET","POST"])
def home():
    return render_template("index.html")

@app.route("/json", methods=["POST"])
@cross_origin()
def json_example():

    if request.is_json:
        print("json request is made")
        req = request.get_json()
        
        j_object = json.loads(req, object_pairs_hook=collections.OrderedDict)
        
        #sending the data to python and getting back new json with details of dimension and all

        #sending data for validation
        new_validated_object = fpv.floor_plan_validation(j_object)

        if len(new_validated_object.error) == 0:

            new_v_json = fpo1.floor_plan_additional(new_validated_object.json_object,new_validated_object.room_names,new_validated_object.room_view_name)
            j_object1 = new_v_json.new_object
            j_object1["warning_log"] = new_validated_object.warning
            
        else:
            
            j_object1 = {"error_log":new_validated_object.error,
            "warning_log":new_validated_object.warning}
     
        new_json = json.dumps(j_object1, sort_keys = False)

        return new_json

    else:

        return make_response(jsonify({"message": "Request body must be JSON"}), 400)

def request_download_image(imagename):
        r = requests.get(imagename[0], allow_redirects= True)
        open(imagename[1],'wb').write(r.content)
    

def request_download(url_name):
    #print(url_name)

    for item in url_name:
        x = threading.Thread(request_download_image(item))
        x.start()
        #x.join()
        '''
        r = request1.get(item[0], allow_redirects= True)
        open(item[1],'wb').write(r.content)  ''' 
        
        
    

    #import wget
    #wget.download('http://www.example.com/songs/mp3.mp3')
    #wget.download('https://workingdrawingfiles.s3.ap-south-1.amazonaws.com/Kitchen+-+ViewA.jpg')



if __name__=="__main__":
    app.secret_key = "This"
    app.run(host="0.0.0.0",threaded=True, debug=True, port=4000)
 
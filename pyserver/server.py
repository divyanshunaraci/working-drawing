import matplotlib
from flask import render_template, url_for, Flask, request, redirect, session, abort, flash, Response, make_response, jsonify
import json
import collections

import floor_plan_outline3 as fpo1

from flask_cors import CORS, cross_origin
import time
app = Flask(__name__, template_folder='./static')
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['JSON_SORT_KEYS'] = False


@app.route("/")
def init():
    return render_template('index.html')


@app.route("/json", methods=["POST"])
@cross_origin()
def json_example():

    if request.is_json:
        print("json request is made")
        req = request.get_json()

        j_object = json.loads(req, object_pairs_hook=collections.OrderedDict)

        # sending the data to python and getting back new json with details of dimension and all
        j_object1 = fpo1.floor_plan_additional(j_object).new_object

        new_json = json.dumps(j_object1, sort_keys=False)

        return new_json

    else:

        return make_response(jsonify({"message": "Request body must be JSON"}), 400)


if __name__ == "__main__":
    app.secret_key = "This"
    app.run(host="127.0.0.1", threaded=True, debug=True, port=4000)

// state variable to contain parsed JSON data
var state = {};
var currentRoom = '';

// variables for overlaying comment canvas( '.overlay-canvas-container' )
var overlayCanvasContainers = document.querySelectorAll(".overlay-canvas-container");
var w = document.querySelector(`#wd-0 canvas`).width;
var h = document.querySelector(`#wd-0 canvas`).height;
var overlayCanvases = [];
overlayCanvasContainers.forEach((canvas, id) => {
    let canv = new fabric.Canvas(`c#${id}`, {
        backgroundColor: "rgba(0, 0, 0, 0)",
        width: w,
        height: h,
    });
    overlayCanvases.push(canv);
});

var canvasJSONs = [];

var currentPageNumber = 1;
const viewTypes = ["room_top_view", "top_view", "front_view", "internal_view"];

var openNewJSON = false;
// import file from file dialog
$("#file").on("change", function (e) {
    // add loading bar & blur the background
    $("#loader").toggle();
    $('.loader-msg').html("Validating JSON")
    $('.loader-msg').toggle();
    $(".main").css({ opacity: 0 });

    setTimeout(() => {
        $('.loader-msg').html("Processing JSON");
    }, 3000);
    readJSON(this);

    $("#file").val(null)
});

const readJSON = function (input) {
    try {
        filename = input.files[0].name;

        if (input.files && input.files[0] && filename.includes(".json")) {
            const reader = new FileReader();

            reader.onload = function (e) {
                // open .json file
                const data = e.target.result;

                // set the flag(open new file) true
                openNewJSON = true;

                let parsedData;

                // python server
                const url = "http://localhost:4000/json";
                const othePram = {
                    headers: {
                        "content-type": "application/json; charset=UTF-8",
                    },

                    body: JSON.stringify(data),
                    method: "POST",
                    keepalive: false
                };

                fetch(url, othePram)
                    .then((response) => response.json())
                    .then((data) => {
                        parsedData = data;

                        // Logging warning messages if present in all cases 
                        if (parsedData.warning_log) {


                            console.warn("Warning Messages: ");
                            for (let warning of parsedData.warning_log) {
                                console.warn(warning);

                            }
                        }

                        // Logging error messages if present and returning 
                        if (parsedData.error_log) {
                            console.error("Error Messages: ")
                            for (let error of parsedData.error_log) {
                                console.error(error)
                            }
                            alert('Data contains error! Correct the data and import again')
                            $("#loader").toggle();
                            $('.loader-msg').html("")
                            $('.loader-msg').toggle()
                            $(".main").css({ opacity: 1 });

                            return
                        }

                        $(".main").empty();

                        /* PARSE JSON data */
                        parseJSON(parsedData); //this part is changed if error is sent

                        /*     RENDER PART     */
                        renderAll();

                        // remove loading bar & restore the background
                        $("#loader").toggle();
                        $('.loader-msg').html("")
                        $('.loader-msg').toggle();
                        $(".main").css({ opacity: 1 });
                    });
                /*
                .catch((error) => {
                    // remove loading bar & restore the background
                    $("#loader").toggle();
                    $(".main").css({ opacity: 1 });
                    console.log(error);
                    alert("There's problem with data. Please try again.");
                });*/
                //
            };
            reader.readAsText(input.files[0]);
        } else {
            // remove loading bar & restore the background
            $("#loader").toggle();
            $(".main").css({ opacity: 1 });
            // alert user
            alert("Please import json file, not other file.");
        }
    } catch (e) {
        // remove loading bar & restore the background
        $("#loader").toggle();
        $(".main").css({ opacity: 1 });
        console.log(e);
    }
};

const parseJSON = (parsedData) => {
    if (!parsedData) return;
    try {
        // reinitialize state variable
        state = {};

        // get project_ & org_details
        state.projectInfo = getProjectInfo(parsedData);
        state.spaceNamesData = getSpaceNamesInfo(parsedData);
        // state.handleData = getHandleData(parsedData);
        // get floor plan & names of rooms
        const info = getFloorPlan(parsedData);
        state.roomViews = [info[0]]; // push floorPlanView
        state.roomNames = info[1];

        // get material thumbnails & rooms part(JSON)
        let res = getRoomDetails(parsedData, state.roomNames);
        state.matThumbnails = res.matThumbnails;
        state.rooms = res.rooms;

        // parse 'state.rooms' to get room views
        // addExtraPageForTable();
        let subViews = getRoomObjects(state.rooms);
        state.roomViews = [...state.roomViews, ...subViews[0]];
        // get py dimens
        state.dimens = [];
        state.dimens.push(info[2]); // ground floror plan (0)
        state.dimens = [...state.dimens, ...subViews[1]];

        // get py viewBoxInfo
        state.viewBoxInfo = [];
        // viewbox info is required to be changed for expanding the table view
        //It contains info[3] ->  & subViews[2] -> getRoomObjects , viewBoxInfo in model.js
        state.viewBoxInfo.push(info[3]);
        state.viewBoxInfo = [...state.viewBoxInfo, ...subViews[2]];
    } catch (err) {
        console.log(err);
    }
};

const renderAll = () => {
    // if no data on state variable
    if (Object.keys(state).length === 0) return;

    // empty existing WDs || reinitialize
    document.querySelector(".main").innerHTML = ``;

    // render project and org info ( footer table )
    // console.log(state.roomViews, 'First')
    // console.log(state.viewBoxInfo, 'state.viewboxInfo')
    renderProjectInfo(state.projectInfo, state.roomViews.length);
    // calibrate canvas
    calibrateCanvases(state.viewBoxInfo);


    // reinitialize the variables

    // also for overlayCanvases
    overlayCanvasContainers = document.querySelectorAll(".overlay-canvas-container");
    w = document.querySelector(`#wd-0 canvas`).width;
    h = document.querySelector(`#wd-0 canvas`).height;
    overlayCanvases = [];
    overlayCanvasContainers.forEach((canvas, id) => {
        let canv = new fabric.Canvas(`c#${id}`, {
            backgroundColor: "rgba(0, 0, 0, 0)",
            width: w,
            height: h,
        });

        if (canvasJSONs.length !== 0) {
            // restore canvas objects state
            console.log(canvasJSONs[id])
            if (Object.keys(canvasJSONs[id]) !== 0) {
                let json = canvasJSONs[id];
                //
                function CallBack() {
                    canv.renderAll();
                    canv.calcOffset();
                }
                canv.loadFromJSON(json, CallBack, function (o, object) {
                    canv.setActiveObject(object);
                });
            }
        }

        overlayCanvases.push(canv);
    });

    // render views
    state.roomViews.forEach((view, id) => {
        // floorPlanView
        // if(id === undefined){
        //     id=x;
        // }
        if (view.type === "FloorPlanView") {
            renderFloorPlan(view, id);

        }
        // other views like RoomSubView, RenderView ...
        else {
            // console.log(view, id, 'SDGSDFSDFSDF')
            currentRoom = view.id.split('+')[0]
            currentView = view.id.split('+')[1]
            renderView(state.projectInfo, view, id);
            if (viewTypes.includes(view.getName())) {
            }
            // Render material and handle details for all pages (not just render_wall_view)
            for (key in state.rooms) {
                if (key === currentRoom) {
                    tmp = state.rooms[key]
                    for (key2 in tmp) {
                        if (key2 === currentView) {
                            tmp1 = tmp[key2]["material_thumbnails"]
                            if (Object.keys(tmp1).length > 0) {
                                renderMaterialThumbnails(tmp1, id);
                            }
                        }
                    }
                }
            }

            let handleNames = [];
            let dupRemoveMaterialData = [];
            for (key in state.rooms) {
                if (key === currentRoom) {
                    tmp = state.rooms[key];
                    for (key2 in tmp) {
                        if (key2 === currentView) {
                            tmp1 = tmp[key2]["front_view"]
                            let lib = tmp1["floor_components"]["library"];
                            Object.keys(lib).forEach(comp => {
                                let shutter = lib[comp]["external_points"]["shutter"]
                                if (shutter !== undefined){
                                    Object.keys(shutter).forEach(shtr => {
                                        let handleName = shutter[shtr]["handle"]["name"]
                                        if (handleName !== undefined){
                                            handleNames.push(handleName)
                                            dupRemoveMaterialData = handleNames.filter((v,i) => handleNames.findIndex(item => item == v) === i );
                                        }
                                    })
                                }
                            })
                            renderHandleData(dupRemoveMaterialData, id)
                        }
                    }
                }
            }

        }

    });
    if (openNewJSON) {
        // draw py dimens
        state.dimens.forEach((dimensions, id) => {
            const viewName = state.roomViews[id].getName();
            if (viewName != "table_view") {

                ; renderPyDimensions(dimensions, id);
            }
        });
    }
};

// Import the Save JSON
$("#importSaveJSON").click(function () {
    $("#loader").toggle();
    $('.loader-msg').html("Validating JSON")
    $('.loader-msg').toggle();
    $(".main").css({ opacity: 0 });
    fetch(window.APIAddress.importSaveJSON, {
        method: 'GET',
        headers: {
            'Content-type': 'application/json',
            'authorization': localStorage.getItem("token")
        }
    }).then(function (response) {
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {
        openNewJSON = true;
        parsedData = data;
        console.log(parsedData, "data");
        $(".main").empty();
        parseJSON(parsedData);
        renderAll();
        $("#loader").toggle();
        $('.loader-msg').html("")
        $('.loader-msg').toggle();
        $(".main").css({ opacity: 1 });
    }).catch(function (error) {
        console.warn('Something went wrong.', error);
    });
});

window.addEventListener("resize", renderAll());

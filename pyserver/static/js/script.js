// state variable to contain parsed JSON data
var state = {};
var currentRoom = '';

// variables for overlaying comment canvas( '.overlay-canvas-container' )
var overlayCanvasContainers = [];
var w = 0;
var h = 0;
var overlayCanvases = [];
// Note: Overlay canvases are now initialized inside renderAll() after views are rendered
// This ensures all text and dimensions are added in the correct order

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
    }, CONFIG.TIMING.LOADING_MESSAGE_DELAY);
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
        const floorPlanView = [info[0]]; // push floorPlanView
        state.roomNames = info[1];

        // get material thumbnails & rooms part(JSON)
        let res = getRoomDetails(parsedData, state.roomNames);
        state.matThumbnails = res.matThumbnails;
        state.rooms = res.rooms;

        // parse 'state.rooms' to get room views
        // addExtraPageForTable();
        let subViews = getRoomObjects(state.rooms);
        const allViews = [...floorPlanView, ...subViews[0]];
        
        // get py dimens
        const allDimens = [];
        allDimens.push(info[2]); // ground floor plan (0)
        allDimens.push(...subViews[1]);

        // get py viewBoxInfo
        const allViewBoxInfo = [];
        // viewbox info is required to be changed for expanding the table view
        //It contains info[3] ->  & subViews[2] -> getRoomObjects , viewBoxInfo in model.js
        allViewBoxInfo.push(info[3]);
        allViewBoxInfo.push(...subViews[2]);

        // Create unified view structure - this eliminates tight coupling between arrays
        state.views = createUnifiedViews(allViews, allViewBoxInfo, allDimens);
        
        // Keep backward compatibility for now
        state.roomViews = allViews;
        state.dimens = allDimens;
        state.viewBoxInfo = allViewBoxInfo;
    } catch (err) {
        console.log(err);
    }
};

const renderAll = () => {
    // Use centralized ViewRenderer to eliminate code duplication
    // This replaces ~150 lines of duplicated code with a single call
    const renderer = new ViewRenderer(state, openNewJSON);
    renderer.renderAll();
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

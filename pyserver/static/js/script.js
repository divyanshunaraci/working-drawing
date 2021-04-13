// state variable to contain parsed JSON data
var state = {};

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

        // get floor plan & names of rooms
        const info = getFloorPlan(parsedData);
        state.roomViews = [info[0]]; // push floorPlanView
        state.roomNames = info[1];

        // get material thumbnails & rooms part(JSON)
        let res = getRoomDetails(parsedData, state.roomNames);
        state.matThumbnails = res.matThumbnails;
        state.rooms = res.rooms;

        // parse 'state.rooms' to get room views
        let subViews = getRoomObjects(state.rooms);
        state.roomViews = [...state.roomViews, ...subViews[0]];

        // get py dimens
        state.dimens = [];
        state.dimens.push(info[2]); // ground floror plan (0)
        state.dimens = [...state.dimens, ...subViews[1]];

        // get py viewBoxInfo
        state.viewBoxInfo = [];
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
        if (view.type === "FloorPlanView") {
            renderFloorPlan(view, id);
        }
        // other views like RoomSubView, RenderView ...
        else {
            renderView(state.projectInfo, view, id);
            if (viewTypes.includes(view.getName())) {
            }
            if (view.type === "ImageView") {
                // render material thumbnails
                renderMaterialThumbnails(state.matThumbnails, id);
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

// print statement
/*$("#print").on("click", function (e) {
    print();
});

function print() {
    $("#loader").toggle();
    $(".main").css({ opacity: 0.5 });

    let totalPagesNumber = state.roomViews ? state.roomViews.length : 1;
    const ele = document.querySelector(`#wd-0`);
    ele.scrollIntoView({ block: "start" });

    let date = new Date();
    let datestr = date.toISOString();
    datestr = datestr.replace(/[^0-9]/g, "");
    const filename = `Drawings_${datestr}.pdf`;

    let doc = new jsPDF("l", "px", [ele.clientWidth, ele.clientHeight]);
    if (totalPagesNumber === 1) {
        const ele = document.getElementById(`wd-0`);
        //console.log(ele.clientWidth, ele.clientHeight);
        const opt = {
            filename: filename,
            image: { type: "jpeg", quality: 1 },
            html2canvas: { scale: 3 },
            jsPDF: { unit: "px", format: [ele.clientWidth, ele.clientHeight], orientation: "l" },
        };
        html2pdf().set(opt).from(ele).save();

        $("#loader").toggle();
        $(".main").css({ opacity: 1 });
    } else {
        // Todo: create multiple pages
        const opt = {
            image: { type: "jpeg", quality: 5 },
            html2canvas: {
                scale: 5,
                dpi: 200,
                letterRendering: true,
                width: ele.clientWidth,
                height: ele.clientHeight,
                useCORS: true
            },
        };

        var _results = [];
        var proms = [];
        for (var i = 0; i < totalPagesNumber; ++i) {
            const ele = document.querySelector(`#wd-${i}`);
            proms.push(
                html2pdf().set(opt).from(ele).outputImg("dataurlstring").then((result) => { _results.push({ index: i, result: result }); })
            );
        }

        Promise.all(proms).then(() => {
            _results.forEach((item, id) => {
                if (id != 0) doc.addPage();
                doc.addImage(
                    item.result,
                    "jpeg",
                    0,
                    0,
                    doc.internal.pageSize.width,
                    doc.internal.pageSize.height
                );
            })

            doc.save(filename);
            alert("Downloading PDF completed!!!");
            $("#loader").toggle();
            $(".main").css({ opacity: 1 });
            // $(".main").empty();

        });
        // $(".main").empty();

    }
}

//$(window).resize(resizeCanvas);
var beforeWidth = $(window).width();
var rtime;
var timeout = false;
var delta = 200;
function resizeCanvas() {
    rtime = new Date();
    if (timeout === false) {
        timeout = true;
        setTimeout(resizeend, delta);
    }

    let len = 0;
    if (!state.roomViews) {
        len = 1;
    } else {
        len = state.roomViews.length;
    }
    for (let i = 0; i < len; i++) {
        const outerCanvasContainer = $(".canvas-container")[i];

        const canvas = overlayCanvases[i];

        const containerWidth = outerCanvasContainer.clientWidth;
        const containerHeight = outerCanvasContainer.clientHeight;

        if ($(window).width() !== beforeWidth) {
            const scale = containerWidth / canvas.getWidth();
            const zoom = canvas.getZoom() * scale;
            canvas.setDimensions({ width: containerWidth, height: containerHeight });
            canvas.setViewportTransform([zoom, 0, 0, 1, 0, 0]);
        } else {
            // empty
        }
    }
}

function resizeend() {
    if (new Date() - rtime < delta) {
        setTimeout(resizeend, delta);
    } else {
        timeout = false;

        let len = 0;
        if (!state.roomViews) {
            len = 1;
        } else {
            len = state.roomViews.length;
        }
        for (let i = 0; i < len; i++) {
            const outerCanvasContainer = $(".canvas-container")[i];

            const canvas = overlayCanvases[i];

            const containerWidth = outerCanvasContainer.clientWidth;
            const containerHeight = outerCanvasContainer.clientHeight;

            if ($(window).width() !== beforeWidth) {
                // empty
            } else {
                const scale = containerHeight / canvas.getHeight();
                const zoom = canvas.getZoom() * scale;
                canvas.setDimensions({ width: containerWidth, height: containerHeight });
                canvas.setViewportTransform([1, 0, 0, zoom, 0, 0]);
            }
        }
    }
}*/


window.addEventListener("resize", renderAll());

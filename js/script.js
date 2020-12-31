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
  $(".main").css({ opacity: 0.5 });

  readJSON(this);
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
        const url = "http://127.0.0.1:4000/json";
        const othePram = {
          headers: {
            "content-type": "application/json; charset=UTF-8",
          },

          body: JSON.stringify(data),
          method: "POST",
        };

        fetch(url, othePram)
          .then((response) => response.json())
          .then((data) => {
            parsedData = data;
            // console.log(parsedData);

            /* PARSE JSON data */
            parseJSON(parsedData);

            /*     RENDER PART     */
            renderAll();

            // remove loading bar & restore the background
            $("#loader").toggle();
            $(".main").css({ opacity: 1 });
          })
          .catch((error) => {
            // remove loading bar & restore the background
            $("#loader").toggle();
            $(".main").css({ opacity: 1 });
            console.log(error);
            alert("There's problem with data. Please try again.");
          });
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
    if (id === 0) {
      renderFloorPlan(view);
    }
    // other views like RoomSubView, RenderView ...
    else {
      renderView(view, id);
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
        renderPyDimensions(dimensions, id);
      }
    });
  }
};

// print statement
$("#print").on("click", function (e) {
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

  let doc = new jsPDF("l", "px", "a3");
  if (totalPagesNumber === 1) {
    const ele = document.getElementById(`wd-0`);
    console.log(ele.clientWidth, ele.clientHeight);
    const opt = {
      margin: 30,
      filename: filename,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 3 },
      jsPDF: { unit: "mm", format: "a3", orientation: "l" },
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
        dpi: 400,
        letterRendering: true,
        width: 1444, // 1145
        height: 858, // 815
      },
    };
    let id = (testid = 0);
    let myTimer = setInterval(function () {
      if (id === totalPagesNumber) {
        myStopFunc();
      }
      if (id < totalPagesNumber) {
        if (id !== testid || id == 0) {
          testid = id;
          if (id > 0) {
            doc.addPage();
          }
          const ele = document.querySelector(`#wd-${id}`);

          html2pdf()
            .set(opt)
            .from(ele)
            .outputImg("dataurlstring")
            .then((result) => {
              doc.addImage(
                result,
                "jpeg",
                0,
                0,
                doc.internal.pageSize.width,
                doc.internal.pageSize.height
              );
              id++;
            });
        }
      }
    }, 600);
    function myStopFunc() {
      clearInterval(myTimer);

      $("#loader").toggle();
      $(".main").css({ opacity: 1 });

      doc.save(filename);
      delete doc;
      alert("Downloading PDF completed!!!");
    }
  }
}

$(window).resize(resizeCanvas);

function resizeCanvas() {
  let len = 0;
  if (!state.roomViews) {
    len = 1;
  } else {
    len = state.roomViews.length;
  }
  for (let i = 0; i < len; i++) {
    const outerCanvasContainer = $(".canvas-container")[i];

    const canvas = overlayCanvases[i];

    const ratio = canvas.getWidth() / canvas.getHeight();
    const containerWidth = outerCanvasContainer.clientWidth;
    const containerHeight = outerCanvasContainer.clientHeight;

    const scale = containerWidth / canvas.getWidth();
    const zoom = canvas.getZoom() * scale;
    // canvas.setDimensions({ width: containerWidth, height: containerWidth / ratio });
    // canvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);
    canvas.setDimensions({ width: containerWidth, height: containerHeight });
    canvas.setViewportTransform([zoom, 0, 0, 1, 0, 0]);
  }
}

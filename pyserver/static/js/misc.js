var persistProperties = ['lockScalingX', 'lockScalingY', 'lockMovementX', 'lockMovementY', '_controlsVisibility']

// go to previous page
document.querySelector("#goPrev").addEventListener("click", function (e) {
  if (currentPageNumber == 1) return;

  // scroll to page
  scrollToPage(currentPageNumber - 1);

  // change current page number
  currentPageNumber = currentPageNumber - 1;
});

// go to next page
document.querySelector("#goForward").addEventListener("click", function (e) {
  if (!state.roomViews || currentPageNumber === state.roomViews.length) return;

  // scroll to page
  scrollToPage(currentPageNumber + 1);

  // change current page number
  currentPageNumber = currentPageNumber + 1;
});

// elementary : scroll to [pageNumber] page
const scrollToPage = (pageNumber) => {
  const ele = document.querySelector(`#wd-${pageNumber - 1}`);
  ele.scrollIntoView({ behaviour: 'instant', block: "start" });
};

// Page number input field removed

// Page number input field removed

// check if an element(working-drawing) is visible in the viewport
const isInViewport = (el) => {
  const elementTop = el.getBoundingClientRect().top;
  return (
    elementTop <= (window.innerHeight || document.documentElement.clientHeight)
  );
}

// // scroll detect function
// document.querySelector(".main").addEventListener(
//   "scroll",
//   function (e) {
//     // scroll should be done on page - level
//     // and it should update the value number of '#currentPageNumber' as scroll pages
//     const pages = document.querySelectorAll(".working-drawing");
//     pages.forEach((page, id) => {
//       if (isInViewport(page)) {
//         // set currentPageNumber
//         currentPageNumber = id + 1;

//         // set input field
//         document.querySelector("#currentPageNumber").value = currentPageNumber;
//       }
//     });
//   },
//   {
//     passive: true,
//   }
// );

document.querySelector(".main").addEventListener('scroll',function() {
  const pages = document.querySelectorAll(".working-drawing");
  for(let j = 0; j < pages.length; j++) {
    if (isInViewport(pages[j])) {
      // Fixed page numbering calculation - pages are 0-indexed but display is 1-indexed
      currentPageNumber = j + 1;
      // Page number display element removed
      break; // Only update once per scroll to prevent rapid changes
    }
  }
});

document.querySelector("#addPage").addEventListener("click", function (e) {
  if (currentPageNumber === 1 && !state.roomViews) {
    alert("You cannot add page here.");
    return;
  }
  // show loading bar
  $("#loader").toggle();
  // save all commentbox overlay info
  overlayCanvases.forEach((canv, id) => {
    canvasJSONs.push(canv.toJSON(persistProperties));
  });
  // update canvasJsons
  canvasJSONs.splice(currentPageNumber - 1, 0, {});

  // add new empty page to state.roomviews
  const newEmptyView = new AdditionalView("", "EXTRA_VIEW");
  state.roomViews.splice(currentPageNumber - 1, 0, newEmptyView);

  // for dimens & viewBoxInfo
  state.dimens.splice(currentPageNumber - 1, 0, []);
  state.viewBoxInfo.splice(currentPageNumber - 1, 0, {});

  // Don't reset openNewJSON - keep it true to preserve text rendering

  // rerender
  renderAll();

  // update currentPageNumber
  currentPageNumber += 1;

  // scroll to page
  scrollToPage(currentPageNumber);
  scrollToPage(currentPageNumber - 1);

  // hide loading bar
  $("#loader").toggle();
});
// remove page
document.querySelector("#removePage").addEventListener("click", function (e) {
  if (currentPageNumber == 1 && !state.roomViews) {
    alert("You first need to load JSON file!!!");
    return;
  }

  if (currentPageNumber === 1) {
    alert("You cannot delete page here.");
    return;
  }

  // show loading bar
  $("#loader").toggle();
  // delete the page from state.roomviews
  state.roomViews.splice(currentPageNumber - 1, 1);

  // also remove dimens & viewBoxInfo
  state.dimens.splice(currentPageNumber - 1, 1);
  state.viewBoxInfo.splice(currentPageNumber - 1, 1);

  // save all commentbox overlay info
  overlayCanvases.forEach((canv, id) => {
    canvasJSONs.push(canv.toJSON(persistProperties));
  });
  // update canvasJsons
  canvasJSONs.splice(currentPageNumber - 1, 1);

  // Don't reset openNewJSON - keep it true to preserve text rendering

  // rerender
  renderAll();

  // update currentPageNumber
  currentPageNumber -= 1;
  // scroll to page
  scrollToPage(currentPageNumber);
  // hide loading bar
  $("#loader").toggle();
});

$("#saveProgress").click(function () {
  var project_details = state.projectInfo;
  var floor_plan = state.roomViews[0];

  var flrOutline = [];
  floor_plan.outline.forEach(ele => {
    flrOutline.push([
      ele.pt1,
      ele.pt2,
    ])
    return
  })
  var room = state.rooms;
  var material_thumbnails = state.matThumbnails;
  let rooms = {
    ...room,
    "material_thumbnails": material_thumbnails
  };
  var roomNames = state.roomNames;
  var dimension = [];
  state.dimens[0].forEach(ele => {
    dimension.push([
      ele ? ele.pt1 : "",
      ele ? ele.pt2 : "",
    ])
    return
  })

  var flrlength = state.viewBoxInfo[0];
  var saveJSON = {
    "project_details": {
      "apartment_name": project_details.apartment_name,
      "client_id": project_details.client_id,
      "client_name": project_details.client_name,
      "contract_date": project_details.contract_date,
      "designer_name": project_details.designer_name,
      "flat_number": project_details.flat_number,
      "name_title": project_details.name_title,
      "project_name": project_details.project_name,
      "project_no": project_details.project_no,
      "target_date": project_details.target_date,
    },
    "org_details": {
      "org_name": project_details.org_name,
      "org_logo_url": project_details.org_logo_url,
      "org_address": project_details.org_address
    },
    "floor_plan": {
      "outline": flrOutline,
      "room_name_positions": floor_plan.roomPositions,
      "dimension": {
        "lengths": {
          "xn": flrlength.xn,
          "yn": flrlength.yn,
          "x0": flrlength.x0,
          "y0": flrlength.y0,
          "length": flrlength.length,
          "width": flrlength.width,
        },
        "dimension": dimension
      }
    },
    "rooms": rooms,
    "room_names": roomNames,
    "warning_log": ""
  }
  var json = JSON.stringify(saveJSON);

  var a = document.createElement("a");
  var file = new Blob([json], {
    type: 'application/json'
  });
  a.href = URL.createObjectURL(file);
  a.download = 'json.json';
  a.click();
});

// create & handle comment box
$("#commentBox").on("click", function (e) {
  if (currentPageNumber == 1 && !state.roomViews) {
    alert("You first need to load JSON file!!!");
    return;
  }
  const view = state.roomViews[currentPageNumber - 1];
  if (view.type == "TableView") {
    alert(`You are not allowed to insert image into ${view.type}`);
    return;
  }

  let canvas = overlayCanvases[currentPageNumber - 1];

  let textbox = new fabric.Textbox("Comment", {
    left: 50,
    top: 50,
    width: 150,
    fontSize: 20,
    borderColor: "red",
    editingBorderColor: "blue",
    padding: 2,
    showTextBoxBorder: true,
    textboxBorderColor: "green",
    backgroundColor: "transparent",
  });

  textbox.setControlsVisibility({
    mt: false,
    mb: false,
    br: false,
    bl: false,
    tl: false,
    tr: false,
  });
  textbox.lockScalingY = true;

  canvas.getObjects();
  canvas.add(textbox).setActiveObject(textbox);
  canvas.selection = false;
  canvas.renderAll();
  canvas.calcOffset();
});

// handle DEL key event
// deletes current-selected commentbox, arrow, textbox or image...
$(document).keydown(function (event) {
  let canvas = overlayCanvases[currentPageNumber - 1];
  // 'Delete' key pressed
  if (event.which == 46) {
    console.log(event.key)
    for (let i = 0; i < overlayCanvases.length; i++) {
      // if (canvas.getActiveObject()) {
      //   // remove fabric active object
      //   canvas.remove(canvas.getActiveObject());
      // }
      if (overlayCanvases[i].getActiveObject()) {
        // remove fabric active object
        console.log(i, 'i');
        overlayCanvases[i].remove(overlayCanvases[i].getActiveObject());

      }
    }
  }
});

// insert image on empty_view canvas
$("#addImg").on("change", function (e) {
  // exception error
  if (currentPageNumber == 1 && !state.roomViews) {
    alert("You first need to load JSON file!!!");
    $('#addImg').val(null);
    return;
  }


  // check if image insert image possible

  const view = state.roomViews[currentPageNumber - 1];
  if (view.type == "TableView") {
    alert(`You are not allowed to insert image into ${view.type}`);
    $('#addImg').val(null);
    return;
  }
  console.log(view);

  const canvas = overlayCanvases[currentPageNumber - 1];

  const reader = new FileReader();
  reader.onload = function (event) {
    const data = event.target.result;
    renderRenderView(data, currentPageNumber - 1)
    $('#addImg').val(null);
  }
  // reader.onload = function (event) {
  //   const data = event.target.result;
  //   // renderRenderView(currentPageNumber - 1, img)
  //   fabric.Image.fromURL(data, function (img) {
  //     const oImg = img.set({
  //       left: 50,
  //       top: 50,
  //       scaleX: 100 / img.width,
  //       scaleY: 100 / img.height,
  //     });
  //     canvas.add(oImg).renderAll();
  //     canvas.setActiveObject(oImg);
  //     canvas.selection = false;
  //     canvas.calcOffset();
  //   });
  //   $('#addImg').val(null);
  // };

  const fileType = e.target.files[0]["type"];
  const validImageTypes = ["image/gif", "image/jpeg", "image/png"];
  if (!validImageTypes.includes(fileType)) {
    // invalid file type code goes here.
    alert("No image file. Please input image file!");
    return;
  } else {
    reader.readAsDataURL(e.target.files[0]);
  }
});

function rotating(options) {
  var angle = options.target.angle;
  var locked = (Math.ceil(options.target.angle / 90)) * 90
  if (Math.abs(angle - locked) < 10 || Math.abs(locked - angle) < 10) {
    angle = locked;
  }

  options.target.set({
    angle: angle
  });
}

// add arrow shape on canvas
$("#addArrow").click((e) => {
  if (currentPageNumber == 1 && !state.roomViews) {
    alert("You first need to load JSON file!!!");
    return;
  }

  const view = state.roomViews[currentPageNumber - 1];
  if (view.type == "TableView") {
    alert(`You are not allowed to insert image into ${view.type}`);
    return;
  }

  let triangle = new fabric.Triangle({
    width: 10,
    height: 15,
    fill: "red",
    left: 385,
    top: 65,
    angle: 90,
  });

  let line = new fabric.Line([50, 100, 350, 100], {
    left: 75,
    top: 70,
    stroke: "red",
  });

  let objs = [line, triangle];

  let alltogetherObj = new fabric.Group(objs);
  alltogetherObj.setControlsVisibility({
    mt: false,
    mb: false,
    br: false,
    bl: false,
    tl: false,
    tr: false,
  });
  alltogetherObj.lockScalingY = true;

  let canvas = overlayCanvases[currentPageNumber - 1];
  canvas.getObjects();
  canvas.add(alltogetherObj).setActiveObject(alltogetherObj);
  canvas.selection = false;
  canvas.renderAll();
  canvas.calcOffset();
  canvas.on('object:scaling', onChange)
  canvas.on('object:rotating', rotating);

  function onChange(obj) {
    for (let item of obj.target.getObjects()) {
      if (item.get('type') == 'line' & item.angle != 45) {
        item.width = item.width * item.scaleX;
        item.scaleX = 1;
      } else if (item.type == 'triangle') {
        if (obj.target.scaleX > 1) {
          item.height = 15 - (3 * obj.target.scaleX);
        } else {
          item.height = 15 + 1 / obj.target.scaleX;
        }
      }
    }
  }
});

// add blue line dimensions
$("#blueDimen").click((e) => {
  if (currentPageNumber == 1 && !state.roomViews) {
    alert("You first need to load JSON file!!!");
    return;
  }

  // const view = state.roomViews[currentPageNumber - 1];
  // if (view.type == "TableView") {
  //   alert(`You are not allowed to insert image into ${view.type}`);
  //   return;
  // }

  let triangle = new fabric.Line([50, 100, 50, 110], {
    stroke: "blue",
    left: 0,
    top: 67,
    angle: 45,
    hasControls: false,
    lockUniScaling: true,
    strokeUniform: true,
  });

  let triangleleft = new fabric.Line([50, 100, 50, 110], {
    stroke: "blue",
    left: 300,
    angle: 45,
    top: 67,
    hasControls: false,
    lockUniScaling: true,
    strokeUniform: true,
  });

  let line = new fabric.Line([50, 100, 350, 100], {
    left: -3,
    top: 70,
    stroke: "blue",
    strokeUniform: true,
  });


  let textbox = new fabric.Textbox("XXX", {
    lockScalingY: true,
    lockScalingX: true,
    left: 120,
    top: 50,
    width: 60,
    fontSize: 15,
    borderColor: "red",
    editingBorderColor: "blue",
    padding: 2,
    showTextBoxBorder: true,
    textboxBorderColor: "green",
    backgroundColor: "transparent",
    centeredScaling: true,
    textAlign: "center",
    lockUniScaling: true,
    strokeUniform: true,
    editTextbox: true,
  });

  textbox.setControlsVisibility({
    mt: false,
    mb: false,
    br: false,
    bl: false,
    tl: false,
    tr: false,
  });
  let objs = [line, textbox, triangleleft, triangle];

  let alltogetherObj = new fabric.Group(objs);
  alltogetherObj.setControlsVisibility({
    mt: false,
    mb: false,
    br: false,
    bl: false,
    tl: false,
    tr: false,
  });
  alltogetherObj.lockScalingY = true;

  let canvas = overlayCanvases[currentPageNumber - 1];
  canvas.getObjects();
  canvas.add(alltogetherObj).setActiveObject(alltogetherObj);
  canvas.selection = false;
  canvas.renderAll();
  canvas.calcOffset();

  canvas.on('object:scaling', onChange)
  canvas.on('object:rotating', rotating);

  function onChange(obj) {
    for (const item of obj.target.getObjects()) {

      if (item.get('type') == 'line' & item.angle != 45) {
        item.width = item.width * item.scaleX;
        item.scaleX = 1;
      } else if (item.get('type') == 'line' && item.angle == 45) {
        if (obj.target.scaleX > 1) {
          item.width = 3 - (obj.target.scaleX / 4);
        } else {
          item.width = 3 - 2 / obj.target.scaleX;
        }
      } else if (item.get('type') != "line") {
        if (obj.target.scaleX < 1) {
          item.scaleX = 1 + (1 - obj.target.scaleX)
        }
        else {
          item.scaleX = 1 / (obj.target.scaleX)
        }
      }
    }
  }


  canvas.on("mouse:down", function (options) {
    var groupItems;
    if (options.target) {
      var thisTarget = options.target;
      var mousePos = canvas.getPointer(options.e);
      var editTextbox = false;
      var editObject;

      if (thisTarget.isType("group")) {
        var groupPos = {
          x: thisTarget.left,
          y: thisTarget.top,
        };

        thisTarget.forEachObject(function (object, i) {
          if (object.type == "textbox") {
            var matrix = thisTarget.calcTransformMatrix();
            var newPoint = fabric.util.transformPoint(
              { y: object.top, x: object.left },
              matrix
            );
            var objectPos = {
              xStart: newPoint.x - (object.width * object.scaleX) / 1.5, //When OriginX and OriginY are centered, otherwise xStart: newpoint.x - object.width * object.scaleX etc...
              xEnd: newPoint.x + (object.width * object.scaleX) / 1.5,
              yStart: newPoint.y - (object.height * object.scaleY) / 1.5,
              yEnd: newPoint.y + (object.height * object.scaleY) / 1.5,
            };
            if (
              mousePos.x >= objectPos.xStart &&
              mousePos.x <= objectPos.xEnd &&
              mousePos.y >= objectPos.yStart &&
              mousePos.y <= objectPos.yEnd
            ) {
              function ungroup(group) {
                groupItems = group._objects;
                group._restoreObjectsState();
                canvas.remove(group);
                for (var i = 0; i < groupItems.length; i++) {
                  if (groupItems[i] != "textbox") {
                    groupItems[i].selectable = false;
                  }
                  canvas.add(groupItems[i]);
                }
                canvas.renderAll();
              }

              ungroup(thisTarget);
              canvas.setActiveObject(object);

              object.enterEditing();
              object.selectAll();

              editObject = object;
              var exitEditing = true;

              editObject.on("editing:exited", function (options) {
                if (exitEditing) {
                  var items = [];
                  groupItems.forEach(function (obj) {
                    items.push(obj);
                    canvas.remove(obj);
                  });

                  var grp;
                  grp = new fabric.Group(items, {});
                  grp.setControlsVisibility({
                    mt: false,
                    mb: false,
                    br: false,
                    bl: false,
                    tl: false,
                    tr: false,
                  });
                  canvas.add(grp);
                  exitEditing = false;
                }
              });
            }
          }
        });
      }
    }
  });
});

// add row to 'legend' table - use event delegation for dynamically created buttons
$(document).on("click", ".legend-add-row", (e) => {
  console.log("Legend add row clicked", e.target);
  const tableType = $(e.target).data("table");
  console.log("Table type:", tableType);
  
  if (tableType === "materials") {
    console.log("Adding row to materials table");
    // Add row to materials table
    addLegendRowToTable(e, "side-table");
  } else if (tableType === "handles") {
    console.log("Adding row to handles table");
    // Add row to handles table
    addLegendRowToTable(e, "side-Handletable");
  } else {
    console.log("Using fallback behavior");
    // Fallback to original behavior
    $(e.target).next().click();
  }
});

$(".legend-add-image").on("change", (e) => {
  addLegendRow(e);
  $(".legend-add-image").val(null);
})

// Add row to specific table (Materials or Handles)
function addLegendRowToTable(e, tableClass) {
  console.log("addLegendRowToTable called with tableClass:", tableClass);
  
  if (!state.roomViews) {
    alert("You first need to load JSON file!!!");
    return;
  }

  // Find the closest working-drawing container to determine which page we're on
  const button = e.target;
  const workingDrawingContainer = $(button).closest('.working-drawing');
  const pageId = workingDrawingContainer.attr('id');
  
  console.log("Button's working-drawing container:", workingDrawingContainer);
  console.log("Page ID:", pageId);
  
  if (!pageId) {
    console.log("Could not find page ID");
    return;
  }

  // Extract the page number from the id (e.g., "wd-0", "wd-1", etc.)
  const pageSelector = `#${pageId}`;
  const table = document.querySelector(`${pageSelector} .${tableClass}`);

  console.log("Found table:", table);
  console.log("Table selector used:", `${pageSelector} .${tableClass}`);

  if (!table) {
    console.log(`Table with class ${tableClass} not found`);
    return;
  }

  // Create table headers if they don't exist
  const headers = $(`${pageSelector} .${tableClass} thead`);
  console.log("Headers found:", headers.length);
  
  // Check if table is completely empty (no thead AND no tbody with rows)
  const existingRows = table.querySelectorAll('tbody tr');
  console.log("Existing rows:", existingRows.length);
  
  if (headers.length == 0 && existingRows.length == 0) {
    console.log("Creating headers for tableClass:", tableClass);
    if (tableClass === "side-table") {
      table.innerHTML = '<thead><tr><th></th><th>Finishes</th></tr></thead><tbody></tbody>';
    } else if (tableClass === "side-Handletable") {
      table.innerHTML = '<thead><tr><th>Component</th><th>Handle/KNOB</th></tr></thead><tbody></tbody>';
    }
    console.log("Headers created, table innerHTML:", table.innerHTML);
  } else if (headers.length == 0 && existingRows.length > 0) {
    // Table has rows but no headers - create headers without destroying rows
    console.log("Creating headers without destroying existing rows");
    const thead = document.createElement('thead');
    const headerRow = thead.insertRow();
    
    if (tableClass === "side-table") {
      const th1 = document.createElement('th');
      const th2 = document.createElement('th');
      th2.textContent = 'Finishes';
      headerRow.appendChild(th1);
      headerRow.appendChild(th2);
    } else if (tableClass === "side-Handletable") {
      const th1 = document.createElement('th');
      th1.textContent = 'Component';
      const th2 = document.createElement('th');
      th2.textContent = 'Handle/KNOB';
      headerRow.appendChild(th1);
      headerRow.appendChild(th2);
    }
    
    // Insert thead before the first child (likely tbody)
    table.insertBefore(thead, table.firstChild);
    console.log("Headers created without destroying rows");
  }

  // Get or create tbody
  let tbody = table.querySelector('tbody');
  if (!tbody) {
    console.log("Creating tbody");
    tbody = document.createElement('tbody');
    table.appendChild(tbody);
  }
  console.log("tbody found/created:", tbody);

  console.log("About to insert row into tbody");
  let row = tbody.insertRow();
  console.log("Row inserted:", row);

  if (tableClass === "side-table") {
    console.log("Creating cells for materials table");
    // Materials table: image cell + text cell
    let cell1 = row.insertCell();
    cell1.contentEditable = true;
    cell1.innerHTML = '<div style="width: 20px; height: 30px; border: 1px solid #ccc; background: #f9f9f9;"></div>';

    let cell2 = row.insertCell();
    cell2.contentEditable = true;
    let text = document.createTextNode("Material Name");
    cell2.appendChild(text);
    console.log("Materials table cells created");
  } else if (tableClass === "side-Handletable") {
    console.log("Creating cells for handles table");
    // Handles table: 2 cells (Component + Handle)
    let cell1 = row.insertCell();
    cell1.contentEditable = true;
    let text1 = document.createTextNode("Component Name");
    cell1.appendChild(text1);

    let cell2 = row.insertCell();
    cell2.contentEditable = true;
    let text2 = document.createTextNode("Handle Name");
    cell2.appendChild(text2);
    console.log("Handles table cells created");
  }
  console.log("Function completed successfully");
}

function addLegendRow(e) {

  if (currentPageNumber == 1 && !state.roomViews) {
    alert("You first need to load JSON file!!!");
    return;
  }
  // check if current view is 'ImageView'
  const view = state.roomViews[currentPageNumber - 1];
  // if (view.type !== "ImageView") return;

  const reader = new FileReader();
  reader.onload = function (event) {
    // create canvas for inserting image
    const canv = document.createElement("CANVAS");
    canv.style.width = "20px";
    canv.style.height = "30px";

    canv.id = String(Math.floor(Math.random() * 100));

    // Add column / row to the table
    var table = document.querySelector(
      `#wd-${currentPageNumber - 1} .side-table`
    );

    const headers = $(`#wd-${currentPageNumber - 1} .side-table thead`);

    if (headers.length == 0) {
      table.innerHTML = '<thead><tr><th></th><th>Finishes</th></tr></thead><tbody></tbody>';
    }

    let row = table.insertRow();

    let cell1 = row.insertCell();
    cell1.contentEditable = true;
    cell1.appendChild(canv);

    let cell2 = row.insertCell();
    cell2.contentEditable = true;
    let text = document.createTextNode("XXX");
    cell2.appendChild(text);
    ////////////////////////////////

    const canvas = new fabric.Canvas(canv.id, {
      backgroundColor: "rgba(0, 0, 0, 0)",
      width: 20,
      height: 30,
    });

    const data = event.target.result;
    fabric.Image.fromURL(data, function (img) {
      const oImg = img.set({
        left: 0,
        top: 0,
        scaleX: 20 / img.width,
        scaleY: 30 / img.height,
      });
      oImg.setControlsVisibility({
        mt: false,
        mb: false,
        br: false,
        bl: false,
        tl: false,
        tr: false,
      });
      oImg.set({ selectable: false });
      canvas.add(oImg).renderAll();
      // canvas.setActiveObject(oImg);
      canvas.selection = false;
      canvas.calcOffset();
    });
  };

  const fileType = e.target.files[0]["type"];
  const validImageTypes = ["image/gif", "image/jpeg", "image/png"];
  if (!validImageTypes.includes(fileType)) {
    // invalid file type code goes here.
    alert("No image file. Please input image file!");
    return;
  } else {
    reader.readAsDataURL(e.target.files[0]);
  }
  const btn = document.createElement("button");
  var table = document.querySelector(
    `#wd-${currentPageNumber - 1} .side-table`
  );
  btn.innerHTML = "-";
  btn.classList.add("delete-finish");
  table.appendChild(btn);
  btn.onclick = () => {
    if (table.rows.length >= 1) {
      btn.onclick = () => {
        table.deleteRow(table.rows.length - 1);
      };
    } else {
      btn.onclick = () => {
        table.deleteRow(table.rows.length);
      };
    }
  };
}

// add column to table ( table view )
$("#addTableRow").click((e) => {
  if (currentPageNumber == 1 && !state.roomViews) {
    alert("You first need to load JSON file!!!");
    return;
  }

  // check if current view is 'TableView'
  const view = state.roomViews[currentPageNumber - 1];

  if (view.type == "AdditionalView") {
    view.type = "TableView";

    template = `
    <table border="1" class="main-table" style="width: 100%;">
      <thead>
        <tr>
          <th >S.No</th>
        </tr>
      </thead>
      <tbody> 
        <tr><td >1</td></tr>
      </tbody>
    </table>
    `
    $(`#wd-${currentPageNumber - 1} .canvas-container`).html(template);

    $(`#wd-${currentPageNumber - 1} .canvas-container table`).find('td').attr('contenteditable', true);
    $(`#wd-${currentPageNumber - 1} .canvas-container table`).find('th').attr('contenteditable', true);

    return;
  }

  if (view.type !== "TableView") {
    alert("You can add rows on table page or empty page");
  };

  const container = document.querySelector(
    `#wd-${currentPageNumber - 1} .canvas-container`);

  const table = document.querySelector(
    `#wd-${currentPageNumber - 1} .main-table`
  );

  const tr = document.querySelector(
    `#wd-${currentPageNumber - 1} .main-table tbody tr`
  )
  if (tr && container.offsetHeight < table.offsetHeight + tr.offsetHeight) {
    alert('Cannot add more rows, no space left');
    return
  }


  let row = table.insertRow();
  const cols = $(`#wd-${currentPageNumber - 1} .main-table tr th`).length;
  const rows = $(`#wd-${currentPageNumber - 1} .main-table tr`).length;

  for (let i = 0; i < cols; i++) {
    let cell = row.insertCell();
    let text =
      i == 0
        ? document.createTextNode(`${rows - 1}`)
        : document.createTextNode("");
    cell.appendChild(text);
  }

  $(table).find('td').attr('contenteditable', true);
  $(table).find('th').attr('contenteditable', true);

});

$("#addTableColumn").click((e) => {
  if (currentPageNumber == 1 && !state.roomViews) {
    alert("You first need to load JSON file!!!");
    return;
  }

  // check if current view is 'TableView'
  const view = state.roomViews[currentPageNumber - 1];
  if (view.type !== "TableView") {
    alert("You can add rows on table page or empty page");
  };

  var container = document.querySelector(
    `#wd-${currentPageNumber - 1} .canvas-container`);

  var table = document.querySelector(
    `#wd-${currentPageNumber - 1} .main-table`
  );

  var tr = document.querySelector(
    `#wd-${currentPageNumber - 1} .main-table tbody tr`
  )
  if (tr && container.offsetHeight < table.offsetHeight + tr.offsetHeight) {
    alert('Cannot add more columns, no space left');
    return
  }

  var table = $(`#wd-${currentPageNumber - 1} .main-table`)

  table.find('thead tr').each(function () {
    $(this).append('<th >XXX</th>');
  })

  table.find('tbody tr').each(function () {
    var trow = $(this);
    trow[0].insertCell();
  });

  $(table).find('td').attr('contenteditable', true);
  $(table).find('th').attr('contenteditable', true);
});

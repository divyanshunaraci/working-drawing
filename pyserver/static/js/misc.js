var persistProperties = ['lockScalingX', 'lockScalingY', 'lockMovementX', 'lockMovementY', '_controlsVisibility']

// go to previous page
document.querySelector("#goPrev").addEventListener("click", function (e) {
  if (currentPageNumber == 1) return;

  // scroll to page
  scrollToPage(currentPageNumber - 1);

  // change current page number and input field value
  currentPageNumber = currentPageNumber - 1;
  document.querySelector("#currentPageNumber").value = currentPageNumber;
});

// go to next page
document.querySelector("#goForward").addEventListener("click", function (e) {
  if (!state.roomViews || currentPageNumber === state.roomViews.length) return;

  // scroll to page
  scrollToPage(currentPageNumber + 1);

  // change current page number and input field value
  currentPageNumber = currentPageNumber + 1;
  document.querySelector("#currentPageNumber").value = currentPageNumber;
});

// elementary : scroll to [pageNumber] page
const scrollToPage = (pageNumber) => {
  const ele = document.querySelector(`#wd-${pageNumber - 1}`);
  ele.scrollIntoView({ behaviour: 'instant', block: "start" });
};

// current-page-number input field onchange event
$("#currentPageNumber").on("change", function (e) {
  const pageNumber = Number(e.target.value);

  if (!pageNumber) return;

  if (!state.roomViews) {
    return;
  }

  if (
    pageNumber < 1 ||
    pageNumber > state.roomViews.length ||
    !Number.isInteger(pageNumber)
  ) {
    alert("Wrong page number! Please insert a valid page number.");
  } else {
    currentPageNumber = pageNumber;
    scrollToPage(currentPageNumber);
  }
});

// when the current-page-number input field loses focus
document.querySelector("#currentPageNumber").onblur = function (e) {
  document.querySelector("#currentPageNumber").value = currentPageNumber;
};

// check if an element(working-drawing) is visible in the viewport
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
    (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// scroll detect function
document.querySelector(".main").addEventListener(
  "scroll",
  function (e) {
    // scroll should be done on page - level
    // and it should update the value number of '#currentPageNumber' as scroll pages
    const pages = document.querySelectorAll(".working-drawing");
    pages.forEach((page, id) => {
      if (isInViewport(page)) {
        // set currentPageNumber
        currentPageNumber = id + 1;

        // set input field
        document.querySelector("#currentPageNumber").value = currentPageNumber;
      }
    });
  },
  {
    passive: true,
  }
);



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

  // set the flag(open new json) to false
  openNewJSON = false;

  // rerender
  renderAll();

  // update currentPageNumber
  currentPageNumber += 1;
  document.querySelector("#currentPageNumber").value = currentPageNumber;

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

  // set the flag(open new json) to false
  openNewJSON = false;

  // rerender
  renderAll();

  // update currentPageNumber
  currentPageNumber -= 1;
  document.querySelector("#currentPageNumber").value = currentPageNumber;
  // scroll to page
  scrollToPage(currentPageNumber);
  // hide loading bar
  $("#loader").toggle();
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
    fabric.Image.fromURL(data, function (img) {
      const oImg = img.set({
        left: 50,
        top: 50,
        scaleX: 100 / img.width,
        scaleY: 100 / img.height,
      });
      canvas.add(oImg).renderAll();
      canvas.setActiveObject(oImg);
      canvas.selection = false;
      canvas.calcOffset();
    });
    $('#addImg').val(null);
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
    fontSize: 20,
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

// add row to 'legend' table
$(".legend-add-row").on("click", (e) => {
  $(e.target).next().click()
});

$(".legend-add-image").on("change", (e) => {
  addLegendRow(e);
  $(".legend-add-image").val(null);
})

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

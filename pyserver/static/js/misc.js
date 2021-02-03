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
  ele.scrollIntoView({ block: "start" });
};

// current-page-number input field onchange event
$("#currentPageNumber").on("change", function (e) {
  const pageNumber = Number(e.target.value);

  if (!pageNumber) return;

  if (!state.roomViews) {
    return;
  }

  if (pageNumber < 1 || pageNumber > state.roomViews.length || !Number.isInteger(pageNumber)) {
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
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// scroll detect function
document.querySelector(".main").addEventListener(
  "scroll",
  function (e) {
    // scroll should be done on page-level
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

// add new page
document.querySelector("#addPage").addEventListener("click", function (e) {
  // if (currentPageNumber === 1) {
  //   alert("You cannot add page here.");
  //   return;
  // }
  // show loading bar
  $("#loader").toggle();
  // save all commentbox overlay info
  overlayCanvases.forEach((canv, id) => {
    canvasJSONs.push(canv.toJSON());
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
    canvasJSONs.push(canv.toJSON());
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
    if (canvas.getActiveObject()) {
      // remove fabric active object
      canvas.remove(canvas.getActiveObject());
    }
  }
});

// insert image on empty_view canvas
$("#addImg").on("change", function (e) {
  // exception error
  if (currentPageNumber == 1 && !state.roomViews) {
    alert("You first need to load JSON file!!!");
    return;
  }

  // check if image insert image possible
  const view = state.roomViews[currentPageNumber - 1];
  //if (view.type !== "AdditionalView") {
  //  alert("You are only allowed to insert image into empty view");
  //return;
  //}

  const canvas = overlayCanvases[currentPageNumber - 1];

  const reader = new FileReader();
  reader.onload = function (event) {
    const data = event.target.result;
    fabric.Image.fromURL(data, function (img) {
      const oImg = img.set({ left: 50, top: 50, scaleX: 100 / img.width, scaleY: 100 / img.height });

      canvas.add(oImg).renderAll();
      canvas.setActiveObject(oImg);
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
});

// add arrow shape on canvas
$("#addArrow").click((e) => {
  if (currentPageNumber == 1 && !state.roomViews) {
    alert("You first need to load JSON file!!!");
    return;
  }

  let canvas = overlayCanvases[currentPageNumber - 1];

  let triangle = new fabric.Triangle({
    width: 10,
    height: 15,
    fill: "red",
    left: 235,
    top: 65,
    angle: 90,
  });

  let line = new fabric.Line([50, 100, 200, 100], {
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

  canvas.getObjects();
  canvas.add(alltogetherObj).setActiveObject(alltogetherObj);
  canvas.selection = false;
  canvas.renderAll();
  canvas.calcOffset();
});

// fix_dpi to remove blurring
const dpi = window.devicePixelRatio;
const fix_dpi = (canvas) => {
  //create a style object that returns width and height
  let style = {
    height() {
      return +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
    },
    width() {
      return +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);
    },
  };
  //set the correct attributes for a crystal clear image!
  canvas.setAttribute("width", style.width() * dpi);
  canvas.setAttribute("height", style.height() * dpi);
};

// generate views and render project_ & org_url in every views
const renderProjectInfo = (projectInfo, viewsCnt) => {
  if (projectInfo == null || viewsCnt < 0) return;
  try {
    // const details = state.projectInfo;
    for (let i = 0; i < viewsCnt; i++) {
      const template = `<div class="working-drawing container-fluid" id = 'wd-${i}'>
			<div class="row">
				<div class="col-9">
					<div class="row">
						<div class="col-12" style="text-align: center">
							<span id="title">Ground Floor Plan</span>
						</div>
					</div>
					<div class="row">
						<div class = "canvas-container">
						<canvas  ></canvas>
						<canvas class = 'overlay-canvas-container' id = "c#${i}"></canvas>
						</div>
					</div>
				</div>
				<div class="col-3">
              <div class = 'row' style=" height: 2.5em">
								<div class = 'col-12' style="text-align: center">
									<span style="font-size: large">Legend</span>
								</div>
							</div>
					<div class = 'table-responsive fixed-table-body'>
					<table class="table table-bordered side-table" >

					
					</table></div>
				</div>
			</div>
			<div class="row">
				<table class="table table-bordered">
					<tbody>
						<tr>
							<td rowspan="3" contenteditable = 'true'>
              <img src = "${projectInfo.org_logo_url}" crossorigin="" width="300" height="50" alt= "logo" />
              <span> ${projectInfo.org_name} : ${projectInfo.org_address}</span>
							</td>
							<td class='drawing-title' contenteditable = 'true'>Drawing TITLE: Floor Plan</td>
							<td contenteditable = 'true'>Designed by: ${projectInfo.designer_name}</td>
							<td contenteditable = 'true'>Scale: NTS</td>
						</tr>
						<tr>
							<td contenteditable = 'true'>Project Title: ${projectInfo.project_name}</td>
							<td contenteditable = 'true'>Drafted by: xxx</td>
							<td contenteditable = 'true'>Drawing Revision: R0</td>
						</tr>
						<tr>
							<td contenteditable = 'true'>Location: ${projectInfo.apartment_name}</td>
							<td contenteditable = 'true' >Checked by: XYZ</td>
							<td contenteditable = 'true'>Date: ${projectInfo.contract_date}</td>
						</tr>
					</tbody>
				</table>
			</div>
    </div><br/>  <div class="html2pdf__page-break"></div>`;

      document.querySelector(".main").insertAdjacentHTML("beforeend", template);
    }

    // add space
    document
      .querySelector(".main")
      .insertAdjacentHTML("beforeend", '<div class = "tempPage container-fluid"></div>');
    // initialize the current and total page number in menu bar
    document.querySelector("#totalPgNumber").textContent = viewsCnt;
    document.querySelector("#currentPageNumber").value = 1;
  } catch (err) {
    console.log(err);
  }
};

// fix dpi of canvases and calibrate the origin point
const calibrateCanvases = (viewBoxInfoes) => {
  for (let i = 0; i < viewBoxInfoes.length; i++) {
    // fix canvas-dpi
    const canvas = document.querySelector(`#wd-${i} canvas`);
    fix_dpi(canvas);

    const newOrigin = calcScaleOrigin(viewBoxInfoes[i], canvas.width, canvas.height);

    state.viewBoxInfo[i].scale = newOrigin.scale;
    state.viewBoxInfo[i].newOriginX = newOrigin.x;
    state.viewBoxInfo[i].newOriginY = newOrigin.y;

    // pre scaling and translating
    const cx = canvas.getContext("2d");
    cx.scale(newOrigin["scale"], newOrigin["scale"]);
    cx.translate(newOrigin["x"], newOrigin["y"]);
    cx.save();
  }
};

// elementary : calculate scale & origin point for every sub view
const calcScaleOrigin = (viewBoxInfo, canvasWidth, canvasHeight) => {
  if (Object.keys(viewBoxInfo).length === 0) {
    return { scale: 1, x: 0, y: 0 };
  } else {
    const scale = Math.min(
      (canvasWidth / viewBoxInfo["length"]) * (2 / 3),
      (canvasHeight / viewBoxInfo["width"]) * (2 / 3)
    );
    let tw = Math.ceil(canvasWidth / scale);
    let th = Math.ceil(canvasHeight / scale);

    return {
      scale: scale,
      x: Math.ceil((tw - viewBoxInfo["length"]) / 2),
      y: Math.ceil((th + viewBoxInfo["width"]) / 2) + viewBoxInfo["y0"],
    };
  }
};

// render ground floor plan
const renderFloorPlan = (floorPlanView, id) => {
  /* draw lines */
  const cx = document.querySelector(`#wd-${id} canvas`).getContext("2d");
  const path = floorPlanView.getOutline();
  cx.beginPath();
  cx.strokeStyle = "black";
  cx.lineWidth = "16";

  path.forEach((edge) => {
    const el = edge.getCoords();
    cx.moveTo(el[0][0], -1 * el[0][1]);
    cx.lineTo(el[1][0], -1 * el[1][1]);
  });
  cx.stroke();
  cx.closePath();

  /* draw room names */
  if (openNewJSON) {
    const room_pos = floorPlanView.getRoomNamePos();

    const canvas = overlayCanvases[0];
    const scale = state.viewBoxInfo[0]["scale"];
    const origin = [state.viewBoxInfo[0]["newOriginX"], state.viewBoxInfo[0]["newOriginY"]];
    Object.keys(room_pos).forEach((roomName) => {
      const pos = room_pos[roomName];
      const textbox = new fabric.Textbox(roomName, {
        left: ((pos[0] + origin[0] - 30) * scale) / dpi,
        top: ((-1 * pos[1] + origin[1]) * scale) / dpi,
        width: 60,
        fontSize: 15,
        textAlign: "center",
        // originX: "center",
        originY: "center",
        borderColor: "green",
        editingBorderColor: "orange",
        showTextBoxBorder: true,
        textboxBorderColor: "green",
        backgroundColor: "transparent",
        objectCaching: false,
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
      canvas.add(textbox);
      canvas.selection = false;
      canvas.renderAll();
      canvas.calcOffset();
    });
  }
};

// render individual view
const renderView = (projectInfo, view, id) => {
  const viewType = [
    "room_top_view",
    "top_view",
    "front_view",
    "internal_view",
    "Handles & Accessories",
  ];
  if (!view) return;
  const viewName = view.getName();
  // render titles
  renderTitle(view, id);

  // if view is 'RoomSubView'
  if (viewType.includes(viewName)) {
    // render view 'outline'
    const outline = view.getOutline();
    renderOutline(outline, id, "view");

    // render 'opening'('window', 'door') except for top_view
    if (viewName !== "top_view") {
      renderWindowDoor(view, id);
    }

    // render 'floor_components'
    renderComponents(view, id);

    // render 'external' items
    renderExternalItems(view, id);
  }
  // else if view is 'AdditionalView'
  else if (viewName === "EXTRA_VIEW") {
    // Todo: render the addition_view
    const content = view.getContent();
    if (content.hasOwnProperty("imgURL")) {
      renderRenderView(content.imgURL, id);
    }
  }
  // else if view is 'TableView'
  else if (view.type === "TableView") {
    // Todo: render the table view
    renderTableView(view, id);
  }
  // else if view 'RenderView'
  else {
    const imgURL = view.getImgURL();
    renderRenderView(imgURL, id);
  }

  // render view details ( on footer table )
  renderViewDetail(projectInfo, view, id);
};

// render 'render_wall_view'
const renderRenderView = (imgURL, id) => {
  const canvas = document.querySelector(`#wd-${id} canvas`);
  const cx = document.querySelector(`#wd-${id} canvas`).getContext("2d");
  // reset the canvas transform( setTransform is absolute transformation )
  cx.setTransform(1, 0, 0, 1, 0, 0);
  const image = new Image(canvas.width, canvas.height);
  image.setAttribute("crossorigin", "*")
  image.onload = drawImageActualSize; // Draw when image has loaded

  // Load an image of intrinsic size 300x227 in CSS pixels
  image.src = imgURL;

  function drawImageActualSize() {
    cx.drawImage(this, 0, 0, this.width, this.height);
  }
};

// render view title(viewName)
const renderTitle = (view, id) => {
  const ID = view.getID();
  const viewType = view.type;
  const viewName = view.getName();
  const temp = ID.split("+");
  const roomName = temp[0];
  $(`#wd-${id} #title`).text(viewName);
  switch (viewName) {
    case "room_top_view":
      $(`#wd-${id} #title`).text(`${roomName} PLAN`);
      break;
    case "render_wall_view":
      $(`#wd-${id} #title`).text(`${roomName} ${temp[1].toUpperCase()} - RENDER VIEW`);
      break;
    case "top_view":
      $(`#wd-${id} #title`).text(`${roomName} ${temp[1].toUpperCase()} - PLAN`);
      break;
    case "front_view":
      $(`#wd-${id} #title`).text(`${roomName} ${temp[1].toUpperCase()} - ELEVATION`);
      break;
    case "internal_view":
      $(`#wd-${id} #title`).text(`${roomName} ${temp[1].toUpperCase()} - INTERNALS`);
      break;
    case "Handles & Accessories":
      $(`#wd-${id} #title`).text(`${roomName} ${temp[1].toUpperCase()} - HANDLES & ACCESSORIES`);
      break;
    case "table_view":
      $(`#wd-${id} #title`).text(`${roomName} ${temp[1].toUpperCase()} - ${temp[2].toUpperCase()}`);
      break;
    case "EXTRA_VIEW":
      $(`#wd-${id} #title`).text(viewName);
      break;
    default:
      $(`#wd-${id} #title`).text(`${roomName} ${temp[2]} - ${temp[3].toUpperCase()}`);
      break;
  }
};

// render components( outline or internal + carcass + shutter ) inside view
const renderComponents = (view, id) => {
  const viewName = view.getName();
  const comps = view.getComps();
  if (viewName === "room_top_view") {
    let compsCoords = {};
    // comp1
    comps.forEach((comp1) => {
      const coords = comp1.getOutline();
      renderOutline(coords, id, "component");

      // render component dimensions(1)
      const ID = comp1.getID();
      compsCoords[ID] = coords;

      // render component id( comp-1, comp-2, ...)
      const compID = comp1.getID();
      const temp = {};
      temp[compID] = coords;
      renderTexts(temp, id);
    });

    // render component dimensions(2)
    // smart draw component( remove overlapping dimens )
    const reducedDimens = removeRedun(compsCoords);
    // renderDimensions(reducedDimens, id);  // mine
  } else {
    let compsCoords = {};
    // comp2
    comps.forEach((comp2) => {
      const compDetail = comp2.getDetails();
      const extPts = comp2.getExternPts();
      const shutters = extPts.getShutter();
      const fillers = extPts.getFillers();
      const skirting = extPts.getSkirting();
      const loftSkirting = extPts.getSkirting();
      const coverPanels = extPts.getCPanels();

      // render fillers of components
      renderOutline(fillers, id, "component");
      renderOutline(skirting, id, "component");
      renderOutline(coverPanels, id, "component");
      renderOutline(loftSkirting, id, "component");

      // render carcass(contour) of components
      const coords = [...extPts.getInternal(), ...extPts.getCarcass()];
      renderOutline(coords, id, "component");

      // render component dimensions(1)
      const ID = comp2.getID();
      compsCoords[ID] = coords;

      // if 'front_view'(external_view),  render shutters( draw handle, opening )
      if (
        viewName === "front_view" ||
        viewName == "internal_view" ||
        viewName == "Handles & Accessories"
      ) {
        shutters.forEach((shutter) => {
          renderShutter(shutter, id);
        });
      }

      /* if 'Handle & Accessories', 
       render 'floor_components/library/[comp]/comp_details/Accessories' & 
       'floor_components/library/[comp]/external_points/shutter/[shutter]/handle/name'
      */
      if (viewName === "Handles & Accessories") {
        const textObject = {};
        // get Accesssories position & create textObject
        const detail = compDetail.getDetails();
        const accs = detail["accessories"];
        const accsPosition = [...extPts.getInternal(), ...extPts.getCarcass()];

        accs.forEach((accessory) => {
          textObject[accessory] = accsPosition;
        });

        // get Handles position & push to textObject
        shutters.forEach((shutter) => {
          const handle = shutter.getHandle();
          const handleName = handle["name"];
          const position = handle["outline"];
          textObject[handleName] = position;
        });
        // console.log(textObject, id);
        renderTexts(textObject, id);
      }

      // render component id ( comp-1, comp-2, ...)
      if (viewName === "top_view" || viewName === "front_view") {
        const compID = comp2.getID();
        const temp = {};
        temp[compID] = extPts.getCarcass();
        renderTexts(temp, id);
      }
    });

    // render component dimensions (2)
    // smart draw component( remove overlapping dimens )
    if (viewName != "Handles & Accessories") {
      const reducedDimens = removeRedun(compsCoords);
      // renderDimensions(reducedDimens, id);  // mine
    }

    // render accessories & handles info from front view
    if (viewName === "Handles & Accessories") {
      const handlesInfo = getAccHandlesInfo(view);
      // renderTexts(handlesInfo, id);
    }
  }
};

// supplementary function: get handle info from corresponding front-view
const getAccHandlesInfo = (haView) => {
  const textObject = {};
  const id = haView.getID();
  let corresFrontViewID = id.split("+").slice(0, -1).join("+") + "+front_view";
  const roomView = state.roomViews.filter((view) => view.getID() === corresFrontViewID);
  if (roomView.length == 0) return textObject;
  const comps = roomView[0].getComps();
  comps.forEach((comp2) => {
    const compDetail = comp2.getDetails();
    const extPts = comp2.getExternPts();
    const shutters = extPts.getShutter();

    // get Accesssories position & create textObject
    const detail = compDetail.getDetails();
    const accs = detail["accessories"];
    const accsPosition = [...extPts.getInternal(), ...extPts.getCarcass()];

    accs.forEach((accessory) => {
      textObject[accessory] = accsPosition;
    });

    // get Handles position & push to textObject
    shutters.forEach((shutter) => {
      const handle = shutter.getHandle();
      const handleName = handle["name"];
      const position = handle["outline"];
      textObject[handleName] = position;
    });
  });
  return textObject;
};
// render view name on footer table
const renderViewDetail = (projectInfo, view, id) => {
  const viewID = view.getID();
  $(`#wd-${id} .drawing-title`).text(`Drawing TITLE: ${viewID.split("+")[0]}`)
};

// render 'external' items inside view
const renderExternalItems = (view, id) => {
  const extItems = view.getExternalItems();
  extItems.forEach((item) => {
    const outline = item.getOutline();
    renderOutline(outline, id, "externItem");
  });
};

// render 'shutter' items inside view
const renderShutter = (shutter, id) => {
  let midPt, temp, lines;
  // outline
  const outline = shutter.getOutline();
  renderOutline(outline, id, "component");
  // handle
  const handle = shutter.getHandle();
  const handleOutline = handle["outline"];
  renderOutline(handleOutline, id, "component");

  // opening
  if (outline.length === 0) return; // exception handling( no data )
  const openDirection = shutter.getOpening();
  switch (openDirection) {
    case "right":
      midPt = outline[2].getMidPt();
      temp = outline[0].getCoords();
      lines = [new Edge(temp[0], midPt), new Edge(midPt, temp[1])];
      renderOutline(lines, id, "component", [50, 50]);
      break;
    case "left":
      midPt = outline[0].getMidPt();
      temp = outline[2].getCoords();
      lines = [new Edge(temp[0], midPt), new Edge(midPt, temp[1])];
      renderOutline(lines, id, "component", [50, 50]);
      break;
    case "up":
      midPt = outline[3].getMidPt();
      temp = outline[1].getCoords();
      lines = [new Edge(temp[0], midPt), new Edge(midPt, temp[1])];
      renderOutline(lines, id, "component", [50, 50]);
      break;
    case "down":
      midPt = outline[1].getMidPt();
      temp = outline[3].getCoords();
      lines = [new Edge(temp[0], midPt), new Edge(midPt, temp[1])];
      renderOutline(lines, id, "component", [50, 50]);
      break;
    case "sliding":
      // Todo: outline(8 edges)
      break;
    case "pullout":
      lines = [
        new Edge(outline[0].getMidPt(), outline[1].getMidPt()),
        new Edge(outline[1].getMidPt(), outline[2].getMidPt()),
        new Edge(outline[2].getMidPt(), outline[3].getMidPt()),
        new Edge(outline[3].getMidPt(), outline[0].getMidPt()),
      ];
      renderOutline(lines, id, "component", [50, 50]);
      break;
    case "drawer":
      // Todo
      break;
    default:
      // Todo
      break;
  }
};

// elementray function: render outline
const renderOutline = (outline, id, type, dashPattern = []) => {
  const drawConfig = {
    view: { strokeStyle: "black", lineWidth: "8" },
    component: { strokeStyle: "red", lineWidth: "6" },
    externItem: { strokeStyle: "gray", lineWidth: "8" },
    opening: { strokeStyle: "lightblue", lineWidth: "8" },
  };

  const cx = document.querySelector(`#wd-${id} canvas`).getContext("2d");

  const path = outline;
  cx.beginPath();
  cx.setLineDash(dashPattern);
  cx.strokeStyle = drawConfig[type]["strokeStyle"];
  cx.lineWidth = drawConfig[type]["lineWidth"];
  path.forEach((edge) => {
    const el = edge.getCoords();
    cx.moveTo(el[0][0], -1 * el[0][1]);
    cx.lineTo(el[1][0], -1 * el[1][1]);
  });

  cx.stroke();
  cx.closePath();
};

// elementary function: get center of rectangle
const getOutlineCenter = (outline) => {
  if (!outline) return;
  // if the outline object has no line
  if (outline.length === 0) return [-100, -100];
  // if the outline consists of only 4 lines
  if (outline.length === 4) {
    let midEdge = new Edge(outline[0].getMidPt(), outline[2].getMidPt());
    return midEdge.getMidPt();
  }
  // outline consists of more than 4 lines
  else {
    let tempx = [],
      tempy = [];
    outline.forEach((edge) => {
      let temp = edge.getCoords();
      tempx.push(temp[0][0]);
      tempx.push(temp[1][0]);
      tempy.push(temp[0][1]);
      tempy.push(temp[1][1]);
    });
    let xmin = Math.min(...tempx);
    let ymin = Math.min(...tempy);
    let xmax = Math.max(...tempx);
    let ymax = Math.max(...tempy);
    let tempEdge = new Edge([(xmin + xmax) / 2, ymin], [(xmin + xmax) / 2, ymax]);
    return tempEdge.getMidPt();
  }
};

// elementray function: render Text on canvas
const renderTexts = (textObject, id) => {
  if (!textObject || Object.keys(textObject) === 0) return;

  if (!openNewJSON) return;
  const canvas = overlayCanvases[id];
  const scale = state.viewBoxInfo[id]["scale"];
  const origin = [state.viewBoxInfo[id]["newOriginX"], state.viewBoxInfo[id]["newOriginY"]];
  Object.keys(textObject).forEach((text) => {
    const outline = textObject[text];
    if (outline.length !== 0) {
      const center = getOutlineCenter(outline);
      const textbox = new fabric.Textbox(text, {
        left: ((center[0] + origin[0]) * scale) / dpi,
        top: ((-1 * center[1] + origin[1]) * scale) / dpi,
        width: 60,
        fontSize: 16,
        textAlign: "center",
        originX: "center",
        originY: "center",
        borderColor: "green",
        editingBorderColor: "orange",
        showTextBoxBorder: true,
        textboxBorderColor: "green",
        backgroundColor: "transparent",
        objectCaching: false,
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
      canvas.add(textbox);
      canvas.selection = false;
      canvas.renderAll();
      canvas.calcOffset();
    }
  });
};

// render roomSubView/opening(window, door) & text
const renderWindowDoor = (view, id) => {
  const opening = view.getOpenings();
  Object.keys(opening).forEach((item) => {
    renderOutline(opening[item], id, "opening");
  });
  renderTexts(opening, id);
};

// render dimensions for room subviews
const renderSubviewDimension = (view, id) => {
  const path = removeSameLengthEdges(view.getOutline());

  // convert outline edges into dimensions
  let dimensions = [];
  path.forEach((line) => {
    dimensions.push(new Dimension(line.pt1, line.pt2, line.getDimen()));
  });

  // split dimensions into horizontal and vertical ones
  let xDimens = dimensions.filter((el) => el.direction == "h");
  let yDimens = dimensions.filter((el) => el.direction == "v");

  // sort dimens with respect to y- and x-axis
  xDimens.sort((a, b) => {
    return a.pt1[1] - b.pt1[1];
  });
  yDimens.sort((a, b) => {
    return a.pt1[0] - b.pt1[0];
  });

  xDimens = dimensionTuning(xDimens, "h");
  yDimens = dimensionTuning(yDimens, "v");

  renderDimensions([...xDimens, ...yDimens], id);
};

// remove the edges of same length
const removeSameLengthEdges = (path) => {
  let lengthArr = [];
  let result = [];
  for (let edge of path) {
    const length = edge.getDimen();
    if (!lengthArr.includes(length)) {
      lengthArr.push(length);
      result.push(edge);
    }
  }

  return result;
};

// remove redundancy of components' dimensions
const removeRedun = (compsCoords) => {
  if (Object.keys(compsCoords) == 0) return [];
  let dimens = [];

  // convert every lines of component outline into dimensions
  Object.keys(compsCoords).forEach((id) => {
    compsCoords[id].forEach((edge) => {
      const points = edge.getCoords();
      const label = edge.getDimen();
      if (points[0].length != 0 && points[1].length != 0) {
        dimens.push(new Dimension(...points, label));
      }
    });
  });

  // Split dimensions into 2 groups 'horizontal' and 'vertical'
  let horizontals = dimens.filter((el) => el.direction == "h");
  let verticals = dimens.filter((el) => el.direction == "v");

  // sorting the horizontals according to x coordinates
  horizontals.sort((a, b) => {
    return a.pt1[0] - b.pt1[0];
  });

  // remove the dimensions of same length and pt1
  let temp = [];
  temp.push(horizontals[0]);
  for (let i = 0; i < horizontals.length; i++) {
    let tempDimen = temp[temp.length - 1];
    if (tempDimen.pt1[0] == horizontals[i].pt1[0]) {
      if (tempDimen.label != horizontals[i].label) {
        temp.push(horizontals[i]);
      }
    } else {
      temp.push(horizontals[i]);
    }
  }

  // sorting the verticals according to y coordinates
  verticals.sort((a, b) => {
    return a.pt1[1] - b.pt1[1];
  });

  // remove the dimensions of same length and pt1
  let tempv = [];
  tempv.push(verticals[0]);
  for (let i = 0; i < verticals.length; i++) {
    let tempDimen = tempv[tempv.length - 1];
    if (tempDimen.pt1[1] == verticals[i].pt1[1]) {
      if (tempDimen.label != verticals[i].label) {
        tempv.push(verticals[i]);
      }
    } else {
      tempv.push(verticals[i]);
    }
  }
  return [...temp, ...tempv];
};

// render dimensions
const renderDimensions = (dimensions, id) => {
  const canvas = document.querySelector(`#wd-${id} canvas`);
  const cx = canvas.getContext("2d");
  cx.font = id == 0 ? "260px Arial" : "140px Arial";
  cx.textAlign = "center";

  cx.beginPath();
  cx.strokeStyle = "blue";
  cx.lineWidth = "4";
  dimensions.forEach((dimension) => {
    const rect = dimension.boundRect;
    // horizontal dimension
    if (dimension.direction == "h") {
      t1 = [rect[0][0], rect[1][1]];
      t2 = rect[1];
    }
    // vertical dimension
    else {
      t1 = [rect[1][0], rect[0][1]];
      t2 = rect[1];
    }
    // cx.strokeStyle = '#' + Math.floor(Math.random() * 16777215).toString(16);
    cx.setLineDash([30, 30]);
    cx.moveTo(t1[0], -1 * t1[1]);
    cx.lineTo(t2[0], -1 * t2[1]);
    // cx.stroke();

    cx.moveTo(dimension.pt1[0], -1 * dimension.pt1[1]);
    cx.lineTo(t1[0], -1 * t1[1]);
    // cx.stroke();

    cx.moveTo(dimension.pt2[0], -1 * dimension.pt2[1]);
    cx.lineTo(t2[0], -1 * t2[1]);
    // cx.stroke();

    // write dimension text
    const position = [(t1[0] + t2[0]) / 2, (t1[1] + t2[1]) / 2];

    // x-axis parallel
    if (dimension.direction == "h") {
      if (!dimension.flippedBoundRect) {
        cx.fillText(dimension.label.toString(), position[0], -1 * position[1]);
      } else {
        cx.fillText(dimension.label.toString(), position[0] - 200, -1 * (position[1] - 200));
      }
    }
    // y-axis parallel
    else {
      // rotate the context and draw the string
      cx.save();
      cx.translate(position[0], -1 * position[1]);
      if (!dimension.flippedBoundRect) {
        cx.rotate(-Math.PI / 2);
      } else {
        cx.rotate(Math.PI / 2);
      }
      cx.fillText(dimension.label.toString(), 0, dimension.label.toString().length / 2);
      cx.restore();
    }
  });
  cx.stroke();
  cx.closePath();
};

// render py dimens
const renderPyDimensions = (dimensions, id) => {
  // fabricjs
  const canvas = overlayCanvases[id];
  const scale = state.viewBoxInfo[id]["scale"];
  const origin = [state.viewBoxInfo[id]["newOriginX"], state.viewBoxInfo[id]["newOriginY"]];

  dimensions.forEach((dimension) => {
    let lineGroup;
    let pt1 = jsonCoords2fabricCoords(dimension.pt1, scale, origin);
    let pt2 = jsonCoords2fabricCoords(dimension.pt2, scale, origin);

    let line1 = new fabric.Line(
      [pt1[0] - 15 * scale, pt1[1] + 15 * scale, pt1[0] + 15 * scale, pt1[1] - 15 * scale],
      {
        left: pt1[0] - 15 * scale,
        top: pt1[1] - 15 * scale,
        stroke: "blue",
        evented: false,
        objectCaching: false,
      }
    );
    let line2 = new fabric.Line(
      [pt2[0] - 15 * scale, pt2[1] + 15 * scale, pt2[0] + 15 * scale, pt2[1] - 15 * scale],
      {
        left: pt2[0] - 15 * scale,
        top: pt2[1] - 15 * scale,
        stroke: "blue",
        evented: false,
        objectCaching: false,
      }
    );

    // if the dimension is < 200, just draw line
    if (Number(dimension.label) <= 200) {
      let line3 = new fabric.Line([pt1[0], pt1[1], pt2[0], pt1[2]], {
        left: pt1[0],
        top: pt1[1],
        stroke: "blue",
        evented: false,
        objectCaching: false,
      });
      lineGroup = new fabric.Group([line1, line2, line3]);
    }
    // else if the dimension is > 200, then draw 2 lines
    else {
      const midPts = getDimensionDrawPts(dimension, `${parseInt(15 / scale)}px`);
      const mid1 = jsonCoords2fabricCoords(midPts[0], scale, origin);
      const mid2 = jsonCoords2fabricCoords(midPts[1], scale, origin);

      let line3, line4;
      if (dimension.direction == "h") {
        line3 = new fabric.Line([pt1[0], pt1[1], mid1[0], mid1[1]], {
          left: pt1[0],
          top: pt1[1],
          stroke: "blue",
          evented: false,
          objectCaching: false,
        });
        line4 = new fabric.Line([mid2[0], mid2[1], pt2[0], pt2[1]], {
          left: mid2[0],
          top: mid2[1],
          stroke: "blue",
          evented: false,
          objectCaching: false,
        });
      } else {
        line3 = new fabric.Line([mid1[0], mid1[1], pt1[0], pt1[1]], {
          left: mid1[0],
          top: mid1[1],
          stroke: "blue",
          evented: false,
          objectCaching: false,
        });
        line4 = new fabric.Line([pt2[0], pt2[1], mid2[0], mid2[1]], {
          left: pt2[0],
          top: pt2[1],
          stroke: "blue",
          evented: false,
          objectCaching: false,
        });
      }
      lineGroup = new fabric.Group([line1, line2, line3, line4]);
    }

    // let lineGroup = new fabric.Group([line1, line2]);
    lineGroup.setControlsVisibility({
      mt: false,
      mb: false,
      br: false,
      bl: false,
      tl: false,
      tr: false,
    });
    lineGroup.lockScalingY = true;

    canvas.getObjects();
    canvas.add(lineGroup);
    canvas.selection = false;
    canvas.renderAll();
    canvas.calcOffset();

    /* -----  render dimension text    ------   */
    const position = [
      (dimension.pt1[0] + dimension.pt2[0]) / 2,
      (dimension.pt1[1] + dimension.pt2[1]) / 2,
    ];

    const textAligni = Number(dimension.label) > 200 ? "center" : "bottom";
    const textbox = new fabric.Textbox(dimension.label.toString(), {
      left: ((position[0] + origin[0] - 20) * scale) / dpi,
      top: ((-1 * position[1] + origin[1]) * scale) / dpi,
      width: 60,
      fontSize: 15,
      textAlign: "center",
      originX: "center",
      originY: textAligni,
      borderColor: "green",
      editingBorderColor: "orange",
      showTextBoxBorder: true,
      textboxBorderColor: "green",
      backgroundColor: "transparent",
      objectCaching: false,
    });
    if (dimension.direction == "v") {
      textbox.rotate(-90);
    }

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
    canvas.add(textbox);
    canvas.selection = false;
    canvas.renderAll();
    canvas.calcOffset();
  });
};

// check rectangles intersect
const rectanglesIntersect = (rectA, rectB) => {
  const minAx = rectA[0][0];
  const maxAx = rectA[1][0];
  const minAy = rectA[0][1];
  const maxAy = rectA[1][1];
  const minBx = rectB[0][0];
  const maxBx = rectB[1][0];
  const minBy = rectB[0][1];
  const maxBy = rectB[1][1];
  // cases that two rectangles are definitely not intersecting
  const aLeftOfB = maxAx <= minBx;
  const aRightOfB = minAx >= maxBx;
  const aAboveB = minAy >= maxBy;
  const aBelowB = maxAy <= minBy;

  return !(aLeftOfB || aRightOfB || aAboveB || aBelowB);
};

// get mirrored boundrect( dimension ) from the dimension
const getMirroredBoundRect = (dimension) => {
  if (!dimension) return;

  let boundRect = dimension.boundRect;
  let line = [dimension.pt1, dimension.pt2];

  // dimension is horizontal
  if (dimension.direction == "h") {
    let dy1 = boundRect[0][1] - line[0][1];
    let dy2 = boundRect[1][1] - line[1][1];
    return [
      [boundRect[0][0], boundRect[0][1] - dy1 - dy1],
      [boundRect[1][0], boundRect[1][1] - dy2 - dy2],
    ];
  }
  // dimension is vertical
  else if (dimension.direction == "v") {
    let dx1 = boundRect[0][0] - line[0][0];
    let dx2 = boundRect[1][0] - line[1][0];
    return [
      [boundRect[0][0] - dx1 - dx1, boundRect[0][1]],
      [boundRect[1][0] - dx2 - dx2, boundRect[1][1]],
    ];
  }

  return null;
};

// tuning dimension display: if overlapping, then flip the boundRect
const dimensionTuning = (sortedDimens, axis) => {
  let tempDimens = sortedDimens;
  const axisArray =
    axis === "h"
      ? tempDimens.map((dimen) => dimen.pt1[1])
      : tempDimens.map((dimen) => dimen.pt1[0]);
  const axisMin = axis == "h" ? Math.max(...axisArray) : Math.min(...axisArray);
  const axisMax = axis == "h" ? Math.min(...axisArray) : Math.max(...axisArray);
  let boundRects = [];
  for (let dimen of tempDimens) {
    let temp = axis == "h" ? dimen.pt1[1] : dimen.pt1[0];

    if (temp == axisMin) {
      boundRects.push(getWholeBoundRect(dimen));
    } else if (temp == axisMax) {
      let mirrorBoundRect = getMirroredBoundRect(dimen);
      dimen.setBoundRect(mirrorBoundRect);
      dimen.setFlippedBoundRect();
      boundRects.push(getWholeBoundRect(dimen));
    } else {
      let boundRect = getWholeBoundRect(dimen);
      let reversed = false;
      for (let br of boundRects) {
        if (rectanglesIntersect(br, boundRect)) {
          let mirrorBoundRect = getMirroredBoundRect(dimen);
          dimen.setBoundRect(mirrorBoundRect);
          dimen.setFlippedBoundRect();
          boundRects.push(getWholeBoundRect(dimen));
          reversed = true;
          break;
        }
      }
      if (!reversed) {
        boundRects.push(getWholeBoundRect(dimen));
      }
    }
  }
  return tempDimens;
};

// get whole boundrect(includes line) of dimension
const getWholeBoundRect = (dimension) => {
  const boundRect = dimension.boundRect;
  return [boundRect[0], dimension.pt2];
};

// render material thumbnails
const renderMaterialThumbnails = (matThumbnails, id) => {
  if (matThumbnails.length === 0 || !matThumbnails) return;

  // get side-table element
  let table = document.querySelector(`#wd-${id} .side-table`);

  // generate table head
  // const headData = ['S.No', '', 'Finishes'];
  const headData = ["", "Finishes"];
  generateTableHead(table, headData);

  // generate main content of table
  const data = [];
  Object.keys(matThumbnails).forEach((key, id) => {
    data.push({
      // id: id + 1,
      imageURL: matThumbnails[key]["image_url"],
      name: key,
    });
  });
  generateTable(table, data);
};

const generateTableHead = (table, data) => {
  let thead = table.createTHead();
  let row = thead.insertRow();
  for (let key of data) {
    let th = document.createElement("th");
    let text = document.createTextNode(key);
    th.appendChild(text);
    row.appendChild(th);
  }
};

const generateTable = (table, data) => {
  let tbody = document.createElement("tbody");
  table.appendChild(tbody);
  for (let element of data) {
    let row = tbody.insertRow();
    for (key in element) {
      let cell = row.insertCell();

      if (key === "imageURL") {
        let img = document.createElement("img");
        img.style.width = "20px";
        img.style.height = "30px";
        img.src = element[key];
        img.setAttribute("crossorigin", "*")
        cell.appendChild(img);
      } else {
        cell.contentEditable = true;
        let text = document.createTextNode(element[key]);
        cell.appendChild(text);
      }
    }
  }
};

// render 'TableView'
const renderTableView = (tableView, id) => {
  const compsInfo = tableView.getCompsInfo();

  // get handle of view container and clean the innerHTML of container
  const container = document.querySelector(`#wd-${id} .canvas-container`);

  // create table
  let table = document.createElement("table");
  table.style.width = "100%";
  table.setAttribute("border", "1");
  table.classList.add("main-table");

  // generate table head
  const headData = ["S.No", ...Object.keys(compsInfo[0])];
  generateTableHead(table, headData);

  // reorder compsInfo array
  compsInfo.sort(function (a, b) {
    return Number(a.id.replace(/\D/g, "")) - Number(b.id.replace(/\D/g, ""));
  });

  // generate main content of table
  const data = [];
  compsInfo.forEach((item, id) => {
    data.push({
      no: id + 1,
      ...item,
    });
  });
  generateTable(table, data);

  // add table to container
  container.replaceChild(table, document.querySelector(`#wd-${id} .canvas-container canvas`));
  container.style.pointerEvents = "all";
};

// elementary function: get drawing points for dimension
const getDimensionDrawPts = (dimension, fontStr) => {
  const fontSize = Number(fontStr.replace(/[^0-9]/g, ""));
  const charCnt = dimension.label.toString().length - 1;
  const charLength = fontSize * charCnt;
  const dimenLength = Number(dimension.label);
  const offset1 = (dimenLength - charLength) / 2;
  const offset2 = (dimenLength + charLength) / 2;
  // if the dimension is for horizontal edge
  if (dimension.direction === "h") {
    return [
      [dimension.pt1[0] + offset1, dimension.pt1[1]],
      [dimension.pt1[0] + offset2, dimension.pt1[1]],
    ];
  }
  // else if the dimension is vertical edge one
  else {
    return [
      [dimension.pt1[0], dimension.pt1[1] + offset1],
      [dimension.pt1[0], dimension.pt1[1] + offset2],
    ];
  }
};

// elementary function: convert json pos coords => real fabric drawing pos coords
const jsonCoords2fabricCoords = (pos, scale, origin) => {
  const x = ((pos[0] + origin[0]) * scale) / dpi;
  const y = ((-1 * pos[1] + origin[1]) * scale) / dpi;
  return [x, y];
};

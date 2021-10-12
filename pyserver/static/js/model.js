const compIds = {};

// handle 'project details' and 'org_details' part in json
const getProjectInfo = (json) => {
  let details = {};
  Object.keys(json).forEach((key) => {
    if (key === "project_details" || key === "org_details") {
      details = { ...details, ...json[key] };
    }
  });
  return details;
};

// handle 'floor_plan' part in json
const getFloorPlan = (json) => {
  if (Object.keys(json).includes("floor_plan")) {
    let roomPos,
      outline = [],
      dimens = [],
      viewBoxInfo; // py dimens
    const keys = Object.keys(json["floor_plan"]);
    keys.forEach((key) => {
      if (key.includes("outline")) {
        outline = coords2Edges(json["floor_plan"][key]);
      }
      else if (key.includes("room_name_positions")) {
        roomPos = json["floor_plan"][key];
      }
      // py dimens
      else if (key.includes("dimension")) {
        json["floor_plan"]["dimension"]["dimension"].forEach((el) => {
          if (el[0][0] != el[1][0] || el[0][1] != el[1][1]) {
            dimens.push(new Dimension(...el, Math.hypot(el[0][0] - el[1][0], el[0][1] - el[1][1])));
          }
        });
        viewBoxInfo = json["floor_plan"]["dimension"]["lengths"];
      }
      //
    });

    const floorPlanView = new FloorPlanView("floor_plan", "Ground floor plan", outline, roomPos);
    return [
      floorPlanView,
      Object.keys(json["floor_plan"]["room_name_positions"]),
      dimens,
      viewBoxInfo,
    ];
  }
};

// handle 'rooms' part in json( 1 )
const getRoomDetails = (json, roomNames) => {
  const result = { rooms: {} };
  if (Object.keys(json).includes("rooms")) {
    const roomDetails = json["rooms"];
    Object.keys(roomDetails).forEach((key) => {
      if (key.includes("material_thumbnails")) {
        result.matThumbnails = roomDetails[key];
      } else {
        if (roomNames.includes(key)) {
          result.rooms[key] = roomDetails[key];
        }
      }
    });
    return result;
  }
};

// handle 'rooms' part in json ( 2 )
const getRoomObjects = (rooms) => {
  if (rooms === null) return;
  let resultViews = [],
    dimens = [],
    viewBoxInfo = [];

  // loop through each room
  Object.keys(rooms).forEach((name) => {
    if (!rooms[name]) {
      return;
    }
    // loop through room views/individual comps
    let i = 0;
    Object.keys(rooms[name]).forEach((compName) => {
      if (compName == "room_top_view") {
        //  handle 'room_top_view' data
        let temp = handleRoomTopViewDimens(rooms[name][compName], name);
        let views = handleRoomTopView(rooms[name][compName], name);
        let flag = 0, count = 0;
        for (let i = 0; i < views.length; i++) {
          let k = 0;
          if (views[i].type == "TableView" && views[i].compsInfo.length > 15) {
            flag = 1;
            for (let j = 15; j < views[i].compsInfo.length; j += 15) {
              count++;
              let obj = new TableView(`${views[i].id}+${k++}`, views[i].name, views[i].compsInfo.splice(j, j + 15))
              views.splice(i + 1, 0, obj);
            }
          }
        }

        resultViews = [...resultViews, ...views];
        dimens = [...dimens, ...temp[0]]; // py dimens
        viewBoxInfo = [...viewBoxInfo, ...temp[1]];
        console.log(temp)
        if (flag == 1) {
          for (i = 1; i <= count; i++) {
            viewBoxInfo = [...viewBoxInfo, temp[1]];
            dimens = [...dimens, temp[[0]]]
          }

        }


      } else if (compName == "render_individual_comps") {
        // handle 'render_individual_comps'
        let temp = handleIndividualCompsDimens(rooms[name][compName], name);
        let views = handleIndividualComps(rooms[name][compName], name);
        resultViews = [...resultViews, ...views];
        dimens = [...dimens, ...temp[0]]; // py dimens
        viewBoxInfo = [...viewBoxInfo, ...temp[1]];
      } else {
        //  handle 'view_1', 'view_2', ... 'view_n'
        let temp = handleViewDimens(rooms[name][compName], `${name}+${compName}`);
        let views = handleView(rooms[name][compName], `${name}+${compName}`);
        // Code start for divide of 10 rows
        var flag = 0, count = 0;
        for (let i = 0; i < views.length; i++) {
          let k = 0;
          if (views[i].type == "TableView" && views[i].compsInfo.length > 15) {
            flag = 1;
            for (let j = 15; j < views[i].compsInfo.length; j += 15) {
              count++;
              let obj = new TableView(`${views[i].id}+${k++}`, views[i].name, views[i].compsInfo.splice(j, j + 15))
              views.splice(i + 1, 0, obj);
            }
          }
        }
        resultViews = [...resultViews, ...views];
        dimens = [...dimens, ...temp[0]]; // py dimens
        viewBoxInfo = [...viewBoxInfo, ...temp[1]];

      }
    });
  });

  return [resultViews, dimens, viewBoxInfo];
};

// handle '[room]' => 'room_top_view' part in json
const handleRoomTopView = (data, roomName) => {
  let floor_components = {},
    external = {},
    outlineEdges = [],
    compObjects = [],
    compObjectsTopView = [],
    openings = {}

  externObj = [];
  if (!data) return;
  Object.keys(data).forEach((key) => {
    // if the property is 'room_outline' or contains 'outline'
    if (key.includes("outline")) {
      outlineEdges = coords2Edges(data[key]);
    }
    // handle the 'library' and 'external' components
    else if (key.includes("floor_components")) {
      floor_components = data[key];
      if (floor_components.hasOwnProperty("library")) {
        Object.keys(floor_components["library"]).forEach((compName, id) => {
          const compID = compIds[`${roomName}+room_top_view`][compName];
          if (compID === undefined) {
            return;
          }
          let temp = parseComp1(
            compID,
            compName,
            floor_components["library"][compName]
          );
          compObjects.push(temp);

        });

      }

      if (Object.keys(data["dimension"]["IDs"]).length !== 0) {

        Object.keys(floor_components["library"]).forEach((compName, id) => {
          //  handle 'floor_components' component
          // get id from compIds

          const compID = compIds[`${roomName}+room_top_view`][compName];
          if (compID === undefined) {
            return;
          }
          compObjectsTopView.push(
            parseComp3(
              compID,
              compName,
              floor_components["library"][compName]
            )
          );

        });

      }

      if ("external" in data) {
        if (Object.keys(data["external"]).length !== 0) {
          let i = 1
          Object.keys(data["external"]).forEach((compName, id) => {
            console.log(compName)
            const compID = 'E-'.concat(i++)
            compObjectsTopView.push(
              parseComp3(
                compID,
                compName,
                data["external"][compName]
              )
            );

          });
        }
      }




    } else if (key.includes("external")) {
      external = data[key];
    } else if (key.includes("openings")) {
      Object.keys(data).forEach((key) => {
        if (key.includes("openings")) {
          Object.keys(data[key]).forEach((name) => {
            openings[name] = coords2Edges(data[key][name]);
          });
        }
      });
    }

  });



  Object.keys(external).forEach((objName) => {
    //  handle "external" component
    let temp = parseExtenal(
      roomName + "+room_top_view+external+" + objName,
      objName,
      external[objName]
    );
    externObj.push(temp);
  });

  // if (key.includes("openings")) {
  //   Object.keys(data[key]).forEach((name) => {
  //     openings[name] = coords2Edges(data[key][name]);
  //   });
  // }

  if (Object.keys(data["dimension"]["IDs"]).length !== 0) {
    compObjectsTopView.concat(externObj)
    let tabularView = getTabularView(
      compObjectsTopView,
      `${roomName}+room_top_view+table_view`,
      "table_view"
    );
    return [new RoomSubView(
      `${roomName}+room_top_view`,
      `room_top_view`,
      outlineEdges,
      openings,
      compObjects,
      externObj,
      ""
    ), tabularView];

  }
  else {
    return [
      new RoomSubView(
        `${roomName}+room_top_view`,
        `room_top_view`,
        outlineEdges,
        openings,
        compObjects,
        externObj,
        ""
      ),
    ];
  }

};

// create table view of components(instances)
// return 'TableView' class instance
const getTabularView = (compObjects, id, name) => {
  if (!compObjects) return;
  let comps = [];
  compObjects.forEach((comp) => {
    let info = {};
    info["id"] = comp.getID();
    info["name"] = comp.getName();
    let temp = comp.getDetails();
    for (key in temp) {
      info[key] = temp[key];
    }
    comps.push(info);
  });

  return new TableView(id, name, comps);
};

// py dimens
const handleRoomTopViewDimens = (data, roomName) => {
  let dimens = [],
    viewBoxInfo;
  if (!data) return;
  Object.keys(data).forEach((key) => {
    // if the property is 'room_outline' or contains 'outline'
    if (key.includes("dimension")) {
      data["dimension"]["dimension"].forEach((el) => {
        if (el[0][0] != el[1][0] || el[0][1] != el[1][1]) {
          dimens.push(new Dimension(...el, Math.hypot(el[0][0] - el[1][0], el[0][1] - el[1][1])));
        }
      });
      viewBoxInfo = data["dimension"]["lengths"];
      compIds[`${roomName}+room_top_view`] = data["dimension"]["IDs"]; // 10.27
    }
  });
  if (Object.keys(data["dimension"]["IDs"]).length !== 0) {

    return [
      [dimens, []],
      [viewBoxInfo, {}],
    ];
  } else {
    return [[dimens], [viewBoxInfo]];
  }
};

// parse components of 'room_top_view'
const parseComp1 = (id, name, data) => {
  let compDetail,
    outline = [];
  if (data) {
    Object.keys(data).forEach((key) => {
      if (key === "comp_details") {
        compDetail = getCompDetail(data[key]);
      } else if (key === "outline") {
        outline = coords2Edges(data[key]);
      }
    });

    return new Comp1(id, name, compDetail, outline);
  }
  return;
};

// handle '[room]' => 'render_individual_comps' part in json
const handleIndividualComps = (data, roomName) => {
  if (!data) return;
  let views = [];
  Object.keys(data).forEach((itemName) => {
    if (data[itemName]) {
      Object.keys(data[itemName]).forEach((viewName) => {
        const id = `${roomName}+render_individual_comps+${itemName}+${viewName}`;
        const name = `${itemName}+${viewName}`;
        views.push(new RenderView(id, name, data[itemName][viewName]));
      });
    }
  });

  return views;
};

// handle '[room]' => 'render_individual_comps' part in json
const handleIndividualCompsDimens = (data, roomName) => {
  if (!data) return;
  let dimens = [],
    viewBoxInfo = [];
  Object.keys(data).forEach((itemName) => {
    if (data[itemName]) {
      Object.keys(data[itemName]).forEach((viewName) => {
        dimens.push([]);
        viewBoxInfo.push({});
      });
    }
  });

  return [dimens, viewBoxInfo];
};

// handle '[room]' => 'view_1'/'view_2' .etc in json
// return array of 'RoomSubView' class instances
const handleView = (data, roomName) => {
  const viewType = ["top_view", "front_view", "internal_view", "render_wall_view"];
  let roomSubViews = [];
  Object.keys(data).forEach((viewName) => {
    // if name of unregistered view
    if (!viewType.includes(viewName)) {
      return;
    }
    // handling registered view
    else {
      let views = handleSubView(data[viewName], roomName, viewName);
      roomSubViews = [...roomSubViews, ...views];
    }
  });

  return roomSubViews;
};

// py dimens:  handle '[room]' => 'view_1'/'view_2' .etc in json
const handleViewDimens = (data, roomName) => {
  const viewType = ["top_view", "front_view", "internal_view", "render_wall_view"];
  let dimens = [],
    viewBoxInfo = [];
  Object.keys(data).forEach((viewName) => {
    // if name of unregistered view
    if (!viewType.includes(viewName)) {
      return;
    }
    // handling registered view
    else {
      //
      if (viewName === "front_view" && Object.keys(data[viewName]["dimension"]["IDs"]).length !== 0) {

        var temp = handleSubViewDimens(data[viewName], roomName, viewName);

        dimens = [...dimens, ...temp[0]];
        viewBoxInfo = [...viewBoxInfo, ...temp[1]];
      } else {
        var temp = handleSubViewDimens(data[viewName], roomName, viewName);
        dimens.push(temp[0]);
        viewBoxInfo.push(temp[1]);
      }
    }
  });

  return [dimens, viewBoxInfo];
};

// handle '[room]' => 'view_n' => 'top_view'/'front_view' .etc in json
const handleSubView = (data, roomViewName, viewName) => {
  let floor_components = {},
    compObjects = [],
    compObjects2 = [],
    extern = {},
    externObj = [],
    outlineEdges = [],
    openings = {},
    imgUrl;
  /*  Exception handling */
  // if data is null
  if (!data) return;
  // if render_wall_view
  if (viewName === "render_wall_view") {
    // place a conditon whether image_url exists
    imgUrl = data["image_url"];
    let subView = new RenderView(`${roomViewName}+${viewName}`, viewName, imgUrl);
    return [subView];
  }
  // if no data on "view"
  if (Object.keys(data).length === 0 || Object.keys(data).length === 1) {
    return [new RoomSubView(`${roomViewName}+${viewName}`, viewName, [], {}, [], [], "")];
  }

  /* Preparing objectData */
  Object.keys(data).forEach((key) => {
    // if the property is 'room_outline' or contains 'outline'
    if (key.includes("outline")) {
      outlineEdges = coords2Edges(data[key]);
    }
    // handle the 'floor_components'
    else if (key.includes("floor_components")) {
      floor_components = data[key];


      if (viewName === 'front_view' && Object.keys(data["dimension"]["IDs"]).length !== 0) {

        Object.keys(floor_components["library"]).forEach((compName, id) => {
          const compID = compIds[`${roomViewName}+${viewName}`][compName];
          if (compID === undefined) {
            return;
          }
          compObjects.push(
            parseComp2(
              compID,
              compName,
              floor_components["library"][compName]
            )
          );
        });

      }

    }
    // handle the 'external' components
    else if (key === "external") {
      extern = data[key];
    }
    // handle 'opening' property( 'window' and 'door' )
    else if (key.includes("openings")) {
      Object.keys(data[key]).forEach((name) => {
        openings[name] = coords2Edges(data[key][name]);
      });
    }
    // handle 'image_url' property
    else {
      if (typeof data[key] === "string") {
        imgUrl = data[key];
      } else {
        imgUrl = "";
      }
    }
  });


  Object.keys(extern).forEach((objName) => {
    //  handle 'extern' component => externObj
    externObj.push(
      parseExtenal(`${roomViewName}+${viewName}+external+${objName}`, objName, extern[objName])
    );
  });


  let roomSubView = new RoomSubView(
    `${roomViewName}+${viewName}`,
    viewName,
    outlineEdges,
    openings,
    compObjects,
    externObj,
    imgUrl
  );


  if (viewName == "front_view" && Object.keys(data["dimension"]["IDs"]).length !== 0) {

    let tabularView = getTabularView(
      compObjects,
      `${roomViewName}+${viewName}+table_view`,
      "table_view"
    );
    // let tabularView2 = getTabularView(
    //   compObjects2,
    //   `${roomViewName}+${viewName}+table_view`,
    //   "table_view"
    // );
    return [roomSubView, tabularView];

  }
  else {
    return [roomSubView];
  }
};

// py dimens: handle '[room]' => 'view_n' => 'top_view'/'front_view' .etc in json
const handleSubViewDimens = (data, roomViewName, viewName) => {
  let dimens = [],
    viewBoxInfo;
  /*  Exception handling */
  // if data is null
  if (!data) return;
  // if render_wall_view
  if (viewName === "render_wall_view") {
    return [[], {}];
  }
  // if no data on "view"
  if (Object.keys(data).length === 0 || Object.keys(data).length === 1) {
    // 
    if (viewName === "front_view") {
      return [[[]], [{}]];
    } else {
      return [[], {}];
    }
  }

  /* Preparing objectData */
  Object.keys(data).forEach((key) => {
    // if the property is 'room_outline' or contains 'outline'
    if (key.includes("dimension")) {
      data["dimension"]["dimension"].forEach((el) => {
        if (el[0][0] != el[1][0] || el[0][1] != el[1][1]) {
          dimens.push(new Dimension(...el, Math.hypot(el[0][0] - el[1][0], el[0][1] - el[1][1])));
        }
      });
      viewBoxInfo = data["dimension"]["lengths"];
      compIds[`${roomViewName}+${viewName}`] = data["dimension"]["IDs"];
      // if (viewName == "internal_view") {
      //   compIds[`${roomViewName}+Handles & Accessories`] = data["dimension"]["IDs"];
      // }
    }
  });

  // 
  if (viewName === "front_view" && Object.keys(data["dimension"]["IDs"]).length !== 0) {

    ncomp = Object.keys(data["dimension"]["IDs"]).length;
    x = [dimens, []]
    y = [viewBoxInfo, {}]
    if (ncomp > 15) {
      for (let i = 15; i <= ncomp; i += 15) {
        x.push([])
        y.push({})
      }
    }

    return [
      x,
      y
    ];

  } else {
    return [dimens, viewBoxInfo];
  }
};

// parsing "Comp2" components
const parseComp2 = (id, name, data) => {
  if (!data) return;
  const propNames = Object.keys(data);

  let compDetail, externPts;
  // check existence of keys
  if (propNames.includes("comp_details") && propNames.includes("external_points")) {
    propNames.forEach((prop) => {
      if (prop === "comp_details") {
        compDetail = getCompDetail(data[prop]);
      } else if (prop === "external_points") {
        externPts = parseExternPts(data[prop]);
      }
    });
    return new Comp2(id, name, compDetail, externPts);
  }
  else {
    return;
  }
};

const parseComp3 = (id, name, data) => {
  if (!data) return;
  const propNames = Object.keys(data);

  let compDetail, externPts;
  // check existence of keys
  if (propNames.includes("comp_details") && propNames.includes("outline")) {
    propNames.forEach((prop) => {
      if (prop === "comp_details") {
        compDetail = getCompDetail(data[prop]);
      } else if (prop === "outline") {
        externPts = parseExternPts(data[prop]);
      }
    });
    return new Comp2(id, name, compDetail, externPts);
  }
  else {
    return;
  }
};

// handle "external_points" attr
const parseExternPts = (data) => {
  if (!data) return;
  let objectData = {
    internal: [],
    shutter: [],
    carcass: [],
    fillers: [],
    skirting: [],
    loft_skirting: [],
    cover_panels: [],
  };
  const propNames = Object.keys(data);
  propNames.forEach((prop) => {
    let lowerProp = prop.toLowerCase();
    if (Object.keys(objectData).includes(lowerProp)) {
      // if 'shutter' property
      if (prop === "shutter" || prop === "Shutter") {
        objectData[lowerProp] = getShutterObjs(data[prop]);
      }
      // other data
      else {
        if (Object.entries(data[prop]).length !== 0) {
          objectData[lowerProp] = coords2Edges(data[prop]);
        }
      }
    }
  });
  return new ExternPts(...Object.values(objectData));
};

// handle 'external' items
const parseExtenal = (id, name, data) => {
  let outline = [],
    compDetail;
  if (data) {
    Object.keys(data).forEach((key) => {
      if (key === "comp_details") {
        compDetail = getCompDetail(data[key]);
      } else if (key === "outline") {
        outline = coords2Edges(data[key]);
      }
    });

    return new ExternComp(id, name, compDetail, outline);
  }
  return;
};

// elementary function: coords -> Edges
const coords2Edges = (coordsArr) => {
  let edges = [];
  coordsArr.forEach((coords) => {
    edges.push(new Edge(coords[0], coords[1]));
  });
  return edges;
};

// elementary function: retrun compDetail object
const getCompDetail = (data) => {
  let height,
    width,
    depth,
    acc = [],
    materials = [];
  Object.keys(data).forEach((prop) => {
    const lowerProp = prop.toLowerCase();
    switch (lowerProp) {
      case "height":
        height = data[prop];
        break;
      case "width":
        width = data[prop];
        break;
      case "depth":
        depth = data[prop];
        break;
      case "accessories":
        acc = data[prop];
        break;
      case "materials":
        materials = data[prop];
        break;
    }
  });
  return new CompDetails(width, height, depth, acc, materials);
};

// elementary function: get shutter objects
const getShutterObjs = (shutters) => {
  if (!shutters) return;
  if (shutters.length === 0) return;
  let shutterObjs = [];
  Object.keys(shutters).forEach((shutterName) => {
    let temp = getShutter(shutterName, shutters[shutterName]);
    shutterObjs.push(temp);
  });
  return shutterObjs;
};

// elementary function: return shutter object
const getShutter = (name, data) => {
  if (!data || !name) return;

  let outline = [],
    opening = "",
    handle = { name: "", outline: [] };

  Object.keys(data).forEach((prop) => {
    if (prop === "outline") {
      outline = coords2Edges(data[prop]);
    } else if (prop === "opening") {
      opening = data[prop].toLowerCase();
    } else if (prop === "handle") {
      Object.keys(data[prop]).forEach((key) => {
        if (key === "name") {
          handle[key] = data[prop][key];
        } else if (key === "outline") {
          handle[key] = coords2Edges(data[prop][key]);
        }
      });
    }
  });
  return new Shutter(name, outline, opening, handle);
};

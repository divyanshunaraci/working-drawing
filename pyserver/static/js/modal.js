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
const viewType = ["room_top_view", "top_view", "front_view", "internal_view"];

var openNewJSON = false;


const readJSO = function (input) {
    try {

        $("#loader").toggle();
        $(".main").css({ opacity: 0.5 });
        if (input) {
            fetch(input).then(response => response.json()).then(res => {
                openNewJSON = true;

                let parsedData;
                console.log(JSON.stringify(res));
                // python server
                const url = "http://13.235.82.47:4000/json";
                const othePram = {
                    headers: {
                        "content-type": "application/json; charset=UTF-8",
                    },

                    body: JSON.stringify(JSON.stringify(res)),
                    method: "POST",
                };

                fetch(url, othePram)
                    .then((response) => response.json())
                    .then((data) => {
                        parsedData = data;
                        console.log(JSON.stringify(parsedData));

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
                        parseJSO(parsedData);

                        /*     RENDER PART     */
                        renderAl();

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
                //};
                //   reader.readAsText(input.files[0]);
            })
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

const parseJSO = (parsedData) => {
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

const renderAl = () => {
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
                    canv.renderAl();
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
        console.log(view.id,'state.roomViews'); 
        // floorPlanView
        if (view.type === "FloorPlanView") {
            renderFloorPlan(view, id);
        }
        // other views like RoomSubView, RenderView ...
        else {
            currentRoom = view.id.split('+')[0]
            renderView(state.projectInfo, view, id);
            if (viewType.includes(view.getName())) {
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

function download(filename, text) {
    var project_id = state.projectInfo.project_no;
    fetch(window.APIAddress.generatePDF +`/${project_id}`, {
        method: "POST",
        body: JSON.stringify({
            file: JSON.stringify(text),
            filename: filename
        }),
        headers: {
            'authorization': localStorage.getItem("token"),
            "Content-type": "application/json; charset=UTF-8"
        },
    })
    .then((response) => response.json())
    .then((out) => {
        let link = document.createElement('a');
        link.href = out.pdfLink;
        link.download = out.pdfLink;
        link.click();
        $("#loader").toggle();
        $(".main").css({ opacity: 1 });     
    }).catch(err => console.error(err));
}

$("#print").on("click", async function (e) {
    $("#loader").toggle();
    $(".main").css({ opacity: 0.5 });
    var htmlhead = document.querySelector('head').innerHTML;
    var mainDiv = document.createElement('div');
    mainDiv.id = "maindiv";
    var container = document.querySelectorAll('.whole-container');
    for(var j = 0; j < container.length; j++) {
        if(!state.roomViews) {
            return container.innerHTML;
        } else {
            for(var i = 0; i < state.roomViews.length; i++) {
                // if(state.roomViews[i].name == "table_view") {
                //     var id = document.getElementById("wd-" + i);
                //     id.classList.remove("working-drawing");
                //     var subDiv = document.createElement("div");
                //     subDiv.id = "canvas"+ i;
                //     subDiv.appendChild(id);
                //     mainDiv.appendChild(subDiv);
                //     var pagebreak = document.createElement("div");
                //     pagebreak.setAttribute("style", "clear: both;page-break-after: always;");
                //     mainDiv.appendChild(pagebreak);
                // } else {
                    var convertMeToImg = $('#wd-' + i)[0];
                    const canvas = await html2canvas(convertMeToImg, { logging: true, letterRendering: 1, useCORS: true })
                    // Full Quality= 1.0  // Medium Quality = 0.5   // Low Quality = 0.1
                    var img = canvas.toDataURL('image/webp', 1.0);
                    subDiv = document.createElement("div");
                    subDiv.id = "canvas"+ i;
                    var containerDiv = document.createElement("div");
                    containerDiv.id = "wd-"+ i;
                    containerDiv.classList.add("container-fluid");
                    var imgTag = document.createElement('img');
                    imgTag.src = img;
                    imgTag.id = "imgId"+ i;
                    containerDiv.appendChild(imgTag)
                    subDiv.appendChild(containerDiv);
                    mainDiv.appendChild(subDiv);
                    var pagebreak = document.createElement("div");
                    pagebreak.setAttribute("style", "clear: both;page-break-after: always;");
                    mainDiv.appendChild(pagebreak);
                // }
            }
        }
    }
    elementHTML = mainDiv.innerHTML;
    // var elementScript = [].map.call(document.getElementsByTagName('script'), function(el) {
    //     return el.outerHTML;
    // }).join();
    let date = new Date();
    let datestr = date.toISOString();
    datestr = datestr.replace(/[^0-9]/g, "");
    var fileName = `Drawings_${datestr}`;
    var finalHTML = '<html><head>' + htmlhead + '</head><body>'+ elementHTML + '</body></html>'; //elementScript
    download(fileName, finalHTML)
});

// print statement
// $("#print").on("click", function (e) {
//     print();
// });

// const print = async () => {
//     $("#loader").toggle();
//     $(".main").css({ opacity: 0.5 });

//     let totalPagesNumber = state.roomViews ? state.roomViews.length : 1;
//     const ele = document.querySelector(`#wd-0`);
//     ele.scrollIntoView({ block: "start" });

//     let date = new Date();
//     let datestr = date.toISOString();
//     datestr = datestr.replace(/[^0-9]/g, "");
//     const filename = `Drawings_${datestr}.pdf`;

//     let doc = new jsPDF("l", "px", [ele.clientWidth, ele.clientHeight]);
//     if (totalPagesNumber === 1) {
//         const ele = document.getElementById(`wd-0`);
//         console.log(ele.clientWidth, ele.clientHeight);
//         const opt = {
//             // margin: 30,
//             filename: filename,
//             image: { type: "jpeg", quality: 1 },
//             html2canvas: { scale: 3 },
//             jsPDF: { unit: "px", format: [ele.clientWidth, ele.clientHeight], orientation: "l" },
//         };
//         html2pdf().set(opt).from(ele).save();

//         $("#loader").toggle();
//         $(".main").css({ opacity: 1 });
//     } else {
//         // Todo: create multiple pages
//         const opt = {
//             image: { type: "jpeg", quality: 3 },
//             html2canvas: {
//                 scale: 3,
//                 dpi: 200,
//                 letterRendering: true,
//                 width: ele.clientWidth, // 1145
//                 height: ele.clientHeight, // 815
//                 useCORS: true
//             },
//         };
//         await createPDF(doc, opt, totalPagesNumber);
//         doc.save(filename);
//         alert("Downloading PDF completed!!!");
//         $("#loader").toggle();
//         $(".main").css({ opacity: 1 });
//     }
// }

// const createPDF = async (pdfDoc, options, totalPagesNumber) => {
//     for (var pageIndex = 0; pageIndex < totalPagesNumber; pageIndex++) {
//         const ele = document.querySelector(`#wd-${pageIndex}`);
//         await html2pdf().set(options).from(ele).outputImg("dataurlstring").then((result) => {
//             if (pageIndex != 0) pdfDoc.addPage();
//             pdfDoc.addImage(
//                 result,
//                 "jpeg",
//                 0,
//                 0,
//                 pdfDoc.internal.pageSize.width,
//                 pdfDoc.internal.pageSize.height
//             );
//         });
//     }
// }

// $(window).resize(resizeCanvas);
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

        // const ratio = canvas.getWidth() / canvas.getHeight();
        const containerWidth = outerCanvasContainer.clientWidth;
        const containerHeight = outerCanvasContainer.clientHeight;

        // const scale = containerWidth / canvas.getWidth();
        // const zoom = canvas.getZoom() * scale;
        // canvas.setDimensions({ width: containerWidth, height: containerWidth / ratio });
        // canvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);
        // canvas.setDimensions({ width: containerWidth, height: containerHeight });
        // canvas.setViewportTransform([zoom, 0, 0, 1, 0, 0]);
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


var modal = document.getElementById('myModal');

// Get the button that opens the modal
var btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];
// var myArray = ["stone", "paper", "scissor"];
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
}


window.addEventListener("resize", renderAll());

// When the user clicks the button, open the modal 
var userPrj = [], version = [];
window.onload = function () {
    if (window.location.search) {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const token = urlParams.get('token')
        localStorage.setItem('token', token);
        const versionNo = urlParams.get('versionNo')
        const projectNo = urlParams.get('project_no')
        getProjects(projectNo, versionNo);
        $("#loader").toggle();
        $(".main").css({ opacity: 1 });

    }

    // fetch('https://naraci-test.s3.ap-south-1.amazonaws.com/5ea7fd5fc5c27f1e749fc39c/v1/New+Version+Test+Json+Kitchen+copy.json').then(response=>response.json()).then(res=> {
    //     console.log(res)
    //     readJSO(res);
    // })
    // return;


}

function getProjects(projectNo, versionNo) {
    let userProject = [], version = [];;
    fetch('http://localhost:5000/api/project/wdProject', {
        method: 'GET',
        headers: {
            'Content-type': 'application/json', // The type of data you're sending
            'authorization': localStorage.getItem("token")
        }
    }).then(function (response) {
        console.log(response)
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {
        console.log(data);
        $("#loader").toggle();
        $(".modal").css({ opacity: 1 });
        let project = [];
        data.forEach(el => {
            console.log(data, 'data');
            if (el.workingDrawing) {
                let obj = {
                    "project_no": el.project_no,
                    "version": el.workingDrawing
                }
                userProject.push(el.project_no);
                // version.push(el.workingDrawing);
                version.push(obj);
            }
        })
        userPrj = [...userProject]
        console.log(version, 'wdFile');
        version.forEach(function (el) {
            if (el.project_no === projectNo) {
                console.log(el);
                el.version.forEach(function (ele) {
                    console.log(projectNo, versionNo);
                    if (ele.version == versionNo) {
                        readJSO(ele.wdFile)
                    }
                })
            }
        })

    }).catch(function (error) {
        console.warn('Something went wrong.', error);
    });
}

const heightOutput = document.querySelector('#height');
const widthOutput = document.querySelector('#width');

function reportWindowSize() {
    heightOutput.textContent = window.innerHeight;
    widthOutput.textContent = window.innerWidth;
}

// window.onresize

// function showVersionAndPrjNo() {
//     modal.style.display = "block";
//     document.getElementById('versionNumber').innerHTML = ''
//     document.getElementById('modal').innerHTML = ''
//     userPrj = [], version = [];
//     $("#loader").toggle();
//     $(".modal").css({ opacity: 0.5 });
//     const userId = localStorage.getItem("userId");
//     let userProject = [];
//     console.log(document.getElementById('modal'), localStorage.getItem("token"), userId);
//     fetch('http://13.233.101.175:8080/api/project/wdProject', {
//         method: 'GET',
//         headers: {
//             'Content-type': 'application/json', // The type of data you're sending
//             'authorization': localStorage.getItem("token")
//         }
//     }).then(function (response) {
//         console.log(response)
//         if (response.ok) {
//             return response.json();
//         }
//         return Promise.reject(response);
//     }).then(function (data) {
//         console.log(data);
//         $("#loader").toggle();
//         $(".modal").css({ opacity: 1 });
//         let project = [];
//         data.forEach(el => {
//             console.log(data, 'data');
//             if (el.workingDrawing) {
//                 let obj = {
//                     "project_no": el.project_no,
//                     "version": el.workingDrawing
//                 }
//                 userProject.push(el.project_no);
//                 // version.push(el.workingDrawing);
//                 version.push(obj);
//             }
//         })
//         if (userProject.length === 0 && version.length === 0) {
//             document.getElementById('modal').innerHTML += '<br>' + 'Version not found';
//             return;
//         }
//         userPrj = [...userProject]
//         console.log(userPrj);
//         // userPrj.forEach(function (el) {
//         //     document.getElementById('modal').innerHTML += '<br>' + el;
//         // })
//         console.log(version, 'version');
//         version.forEach(function (el) {
//             console.log(el);
//             document.getElementById('modal').innerHTML += el.project_no;
//             if (window.innerWidth == screen.width) {
//                 for (let i = 0; i < el.version.length / 14; i++) {
//                     document.getElementById('modal').innerHTML += '<br>'
//                 }
//             }
//             else if (window.innerWidth < screen.width) {
//                 for (let i = 0; i < el.version.length / 11; i++) {
//                     document.getElementById('modal').innerHTML += '<br>'
//                 }
//             }
//             let i = 0;
//             // document.getElementById('versionNumber').innerHTML += '<br>'
//             el.version.forEach(function (ele) {
//                 // ele.wdFile = 'https://naraci-test.s3.ap-south-1.amazonaws.com/5ea7fd5fc5c27f1e749fc39c/v1/New+Version+Test+Json+Kitchen+copy.json'
//                 ++i;
//                 document.getElementById('versionNumber').innerHTML += ele.version + ' ' + `<i id=${ele.version}-${el.project_no} class="fa fa-download" style="margin-right:2%;"></i>`
//                 if (i == 14 && window.innerWidth == screen.width) {
//                     document.getElementById('versionNumber').innerHTML += '<br>';
//                     i = 0;
//                 }
//                 if (i == 11 && window.innerWidth < screen.width) {
//                     document.getElementById('versionNumber').innerHTML += '<br>';
//                     i = 1;
//                 }
//             })
//             document.getElementById('versionNumber').innerHTML += '<br>'
//         })
//         console.log(userPrj.length, version.length);

//     }).catch(function (error) {
//         console.warn('Something went wrong.', error);
//     });
// }

// btn.onclick = showVersionAndPrjNo()

btn.onclick = function () {
    modal.style.display = "block";
    userPrj = [], version = [];
    $("#loader").toggle();
    $(".modal").css({ opacity: 0.5 });
    const userId = localStorage.getItem("userId");
    let userProject = [];
    console.log(document.getElementById('modal'), localStorage.getItem("token"), userId);
    fetch('http://localhost:5000/api/project/wdProject', {
        method: 'GET',
        headers: {
            'Content-type': 'application/json', // The type of data you're sending
            'authorization': localStorage.getItem("token")
        }
    }).then(function (response) {
        console.log(response)
        if (response.ok) {
            return response.json();
        }
        return Promise.reject(response);
    }).then(function (data) {
        console.log(data);
        $("#loader").toggle();
        $(".modal").css({ opacity: 1 });
        let project = [];
        data.forEach(el => {
            console.log(data, 'data');
            if (el.workingDrawing) {
                let obj = {
                    "project_no": el.project_no,
                    "version": el.workingDrawing
                }
                userProject.push(el.project_no);
                // version.push(el.workingDrawing);
                version.push(obj);
            }
        })
        if (userProject.length === 0 && version.length === 0) {
            document.getElementById('modal').innerHTML += '<br>' + 'Version not found';
            return;
        }
        userPrj = [...userProject]
        console.log(userPrj);
        // userPrj.forEach(function (el) {
        //     document.getElementById('modal').innerHTML += '<br>' + el;
        // })
        console.log(version, 'version');
        version.forEach(function (el) {
            console.log(el);
            document.getElementById('modal').innerHTML += el.project_no;
            if (window.innerWidth == screen.width) {
                for (let i = 0; i < el.version.length / 14; i++) {
                    document.getElementById('modal').innerHTML += '<br>'
                }
            }
            else if (window.innerWidth < screen.width) {
                for (let i = 0; i < el.version.length / 11; i++) {
                    document.getElementById('modal').innerHTML += '<br>'
                }
            }
            let i = 0;
            // document.getElementById('versionNumber').innerHTML += '<br>'
            el.version.forEach(function (ele) {
                // ele.wdFile = 'https://naraci-test.s3.ap-south-1.amazonaws.com/5ea7fd5fc5c27f1e749fc39c/v1/New+Version+Test+Json+Kitchen+copy.json'
                ++i;
                document.getElementById('versionNumber').innerHTML += ele.version + ' ' + `<i id=${ele.version}_${el.project_no} class="fa fa-download" style="margin-right:2%;"></i>`
                if (i == 15 && window.innerWidth == screen.width) {
                    document.getElementById('versionNumber').innerHTML += '<br>';
                    i = 1;
                }
                if (i == 11 && window.innerWidth < screen.width) {
                    document.getElementById('versionNumber').innerHTML += '<br>';
                    i = 1;
                }
            })
            document.getElementById('versionNumber').innerHTML += '<br>'
        })
        console.log(userPrj.length, version.length);

    }).catch(function (error) {
        console.warn('Something went wrong.', error);
    });

}

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
    modal.style.display = "none";
    clear()

}
function clear() {
    document.getElementById("modal").innerHTML = "";
    document.getElementById("versionNumber").innerHTML = "";
}
// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
    clear()
}



document.getElementById("versionNumber").onclick = function (e) {
    console.log(e.target.id.split('_'), 'versionNumber', version);
    prjAndVersionArr = e.target.id.split('_');
    version.forEach(function (el) {
        if (el.project_no === prjAndVersionArr[1]) {
            console.log(el);
            el.version.forEach(function (ele) {
                console.log(ele.version, prjAndVersionArr[0]);
                if (ele.version == prjAndVersionArr[0]) {
                    console.log(ele, 'wdFile');
                    readJSO(ele.wdFile)
                }
            })
        }
    })
    modal.style.display = "none";

    console.log(document.getElementById(e.target.id).parentNode)
}

// To get the X and Y co-ordinate on click evenet on canvas container
// document.addEventListener('click', function(event) {
//     if (!event.target.matches('.overlay-canvas-container')) return;
//     console.time('bubbling');
//     event.preventDefault();
//     console.log(event, "Event");
//     var xlen = event.x;
//     var ylen = event.y;
//     console.log(xlen, "X", ylen, "Y");
//     console.timeEnd('bubbling');
//   });

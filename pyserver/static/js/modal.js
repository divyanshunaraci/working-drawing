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
const viewType = ["room_top_view", "top_view", "front_view", "internal_view"];

var openNewJSON = false;


const readJSO = function (input) {
    console.log(input, "input");
    try {

        $("#loader").toggle();
        $(".main").css({ opacity: 0.5 });
        if (input) {
            fetch(input).then(response => response.json()).then(res => {
                openNewJSON = true;

                let parsedData;
                // console.log(JSON.stringify(res));
                // python server
                const url = window.APIAddress.readJSO;
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

    // Filter out RenderView/render_wall_view pages and sync all related arrays
    const filteredIndices = [];
    const filteredViews = [];
    const filteredViewBoxInfo = [];
    const filteredDimens = [];
    
    state.roomViews.forEach((view, idx) => {
        if (view.type !== "ImageView" && view.getName() !== "render_wall_view") {
            filteredIndices.push(idx);
            filteredViews.push(view);
            if (state.viewBoxInfo[idx]) filteredViewBoxInfo.push(state.viewBoxInfo[idx]);
            if (state.dimens[idx]) filteredDimens.push(state.dimens[idx]);
        }
    });
    
    // IMPORTANT: Replace state arrays with filtered versions for rendering
    // Store originals for reference if needed
    window._originalViewBoxInfo = [...state.viewBoxInfo];
    window._originalDimens = [...state.dimens];
    state.viewBoxInfo = filteredViewBoxInfo;
    state.dimens = filteredDimens;

    // render project and org info ( footer table )
    renderProjectInfo(state.projectInfo, filteredViews.length);

    // Reset calibration flag
    window._canvasesCalibrated = false;

    // CRITICAL: Wait for DOM to be updated with all canvas elements before initializing overlayCanvases
    setTimeout(() => {
    // render views (using filtered arrays with new indices)
    filteredViews.forEach((view, id) => {
        console.log(view.id, 'state.roomViews');
        
        // Calibrate canvases on first view render (regardless of type)
        if (id === 0 && !window._canvasesCalibrated) {
            calibrateCanvases(state.viewBoxInfo);
            window._canvasesCalibrated = true;
        }
        
        // floorPlanView
        if (view.type === "FloorPlanView") {
            renderFloorPlan(view, id);
        }
        // other views like RoomSubView ...
        else {
            currentRoom = view.id.split('+')[0]
            currentView = view.id.split('+')[1]
            renderView(state.projectInfo, view, id);
            if (viewType.includes(view.getName())) {
            }
            // Render material and handle details for all pages (not just front_view)
            // render material thumbnails
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
            // renderMaterialThumbnails(state.matThumbnails, id);
            let handleNames = [];
            let dupRemoveHandleData = [];
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
                                            dupRemoveHandleData = handleNames.filter((v,i) => handleNames.findIndex(item => item == v) === i );
                                        }
                                    })
                                }
                            })
                            renderHandleData(dupRemoveHandleData, id)
                        }
                    }
                }
            }
        }
    });
    
    // NOW initialize overlay canvases AFTER views are rendered
    overlayCanvasContainers = document.querySelectorAll(".overlay-canvas-container");
    
    if (overlayCanvasContainers.length > 0 && document.querySelector(`#wd-0 canvas`)) {
        w = document.querySelector(`#wd-0 canvas`).width;
        h = document.querySelector(`#wd-0 canvas`).height;
    }
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
    
    if (openNewJSON) {
        // draw py dimens - state.dimens now contains filtered array
        state.dimens.forEach((dimensions, id) => {
            if (!filteredViews[id]) {
                console.warn(`No view found at index ${id}, skipping dimensions`);
                return;
            }
            const viewName = filteredViews[id].getName();
            if (viewName != "table_view") {
                renderPyDimensions(dimensions, id);
            }
        });
    }
    
    }, 100); // End of setTimeout - wait for DOM to update
};

function download(filename, text, canvasHeight) {
    console.log(canvasHeight)
    const queryStringSearch = window.location.search;
    const getUrlParams = new URLSearchParams(queryStringSearch);
    const pdfVersionNo = getUrlParams.get('versionNo')
    var project_id = state.projectInfo.project_no;
    const pdfRequireHeight = canvasHeight + 30;
    const pdfRequireWidth = document.getElementById("checkId-0").offsetWidth;
    console.log(JSON.stringify(text), "Length", pdfRequireHeight, "pdfRequireHeight", pdfRequireWidth, "pdfRequireWidth");
    fetch(window.APIAddress.generatePDF + `/${project_id}`, {
        method: "POST",
        body: JSON.stringify({
            file: JSON.stringify(text),
            filename: filename,
            pdfHeight: pdfRequireHeight,
            pdfWidth: pdfRequireWidth,
            pdfversion: pdfVersionNo
        }),
        headers: {
            'authorization': localStorage.getItem("token"),
            "Content-type": "application/json; charset=UTF-8"
        },
    })
        .then((response) => {
            console.log('PDF API Response Status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((out) => {
            console.log('PDF API Response:', out);
            if(out.errorText) {
                alert(out.errorText)
            }
            if(out.pdfLink) {
                let link = document.createElement('a');
                link.href = out.pdfLink;
                link.download = out.pdfLink;
                link.click();
            }
            $("#loader").toggle();
            $('.loader-msg').html("")
            $('.loader-msg').toggle()
            $(".main").css({ opacity: 1 });
        }).catch(err => {
            console.error('PDF Generation Error:', err);
            alert('PDF generation failed: ' + err.message);
            $("#loader").toggle();
            $('.loader-msg').html("")
            $('.loader-msg').toggle()
            $(".main").css({ opacity: 1 });
        });
}

// Alternative PDF generation using html2canvas
$("#printAlternative").on("click", async function (e) {
    try {
        $("#loader").toggle();
        $('.loader-msg').html("Generating PDF...");
        $('.loader-msg').toggle();
        $(".main").css({ opacity: 0.5 });

        // Create PDF using jsPDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        
        let isFirstPage = true;
        let pageCount = 0;
        
        // Get the total number of pages needed
        let lenOfRooms = state.roomViews ? state.roomViews.length : 1;
        let totalPages = Math.ceil(lenOfRooms/2);
        
        console.log(`Generating PDF with ${totalPages} pages for ${lenOfRooms} room views`);
        
        // First, capture the project information page if it exists
        const projectInfoElement = document.getElementById('project-info');
        if (projectInfoElement) {
            $('.loader-msg').html('Capturing project information page...');
            
            try {
                const canvas = await html2canvas(projectInfoElement, {
                    scale: 1.5,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    width: projectInfoElement.offsetWidth,
                    height: projectInfoElement.offsetHeight
                });

                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pageWidth - 20;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, pageHeight - 20));
                isFirstPage = false;
                pageCount++;
                
                console.log('Successfully captured project information page');
            } catch (pageError) {
                console.error('Failed to capture project info page:', pageError);
                pdf.setFontSize(16);
                pdf.setTextColor(255, 0, 0);
                pdf.text('Error: Failed to capture project information page', 20, 50);
                pdf.text(`${pageError.message}`, 20, 70);
                isFirstPage = false;
                pageCount++;
            }
        }
        
        // Next, capture the laminate/edge band information page if it exists
        const edgeBandElement = document.getElementById('laminate-edgeband-info');
        if (edgeBandElement) {
            $('.loader-msg').html('Capturing materials information page...');
            
            try {
                if (!isFirstPage) {
                    pdf.addPage();
                }
                
                const canvas = await html2canvas(edgeBandElement, {
                    scale: 1.5,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    width: edgeBandElement.offsetWidth,
                    height: edgeBandElement.offsetHeight
                });

                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pageWidth - 20;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, pageHeight - 20));
                isFirstPage = false;
                pageCount++;
                
                console.log('Successfully captured materials information page');
            } catch (pageError) {
                console.error('Failed to capture materials info page:', pageError);
                pdf.setFontSize(16);
                pdf.setTextColor(255, 0, 0);
                pdf.text('Error: Failed to capture materials information page', 20, 50);
                pdf.text(`${pageError.message}`, 20, 70);
                isFirstPage = false;
                pageCount++;
            }
        }
        
        // Now capture each checkId container as a separate PDF page
        for (let i = 0; i < totalPages; i++) {
            const element = document.getElementById(`checkId-${i}`);
            
            if (!element) {
                console.warn(`Element checkId-${i} not found, skipping`);
                continue;
            }
            
            $('.loader-msg').html(`Capturing page ${i + 1} of ${totalPages}...`);
            
            try {
                // Capture the element
                const canvas = await html2canvas(element, {
                    scale: 1.5,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    width: element.offsetWidth,
                    height: element.offsetHeight
                });

                // Convert to image
                const imgData = canvas.toDataURL('image/png');
                
                // Calculate dimensions to fit A4
                const imgWidth = pageWidth - 20; // Leave 10mm margin on each side
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                // Add new page if not the first page
                if (!isFirstPage) {
                    pdf.addPage();
                }
                isFirstPage = false;
                
                // Add image to PDF
                pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, pageHeight - 20));
                pageCount++;
                
                console.log(`Successfully captured page ${i + 1}`);
                
            } catch (pageError) {
                console.error(`Failed to capture page ${i}:`, pageError);
                // Add error page
                if (!isFirstPage) {
                    pdf.addPage();
                }
                isFirstPage = false;
                
                pdf.setFontSize(16);
                pdf.setTextColor(255, 0, 0);
                pdf.text(`Error: Failed to capture page ${i + 1}`, 20, 50);
                pdf.text(`${pageError.message}`, 20, 70);
                pageCount++;
            }
        }
        
        if (pageCount === 0) {
            throw new Error('No pages were successfully captured');
        }
        
        // Save the PDF
        let date = new Date();
        let datestr = date.toISOString().replace(/[^0-9]/g, "");
        const filename = `WorkingDrawing_${datestr}.pdf`;
        
        pdf.save(filename);
        
        alert(`PDF generated successfully with ${pageCount} pages!`);

        $("#loader").toggle();
        $('.loader-msg').html("");
        $('.loader-msg').toggle();
        $(".main").css({ opacity: 1 });
    } catch (error) {
        console.error('Alternative PDF generation failed:', error);
        alert('PDF generation failed: ' + error.message);
        $("#loader").toggle();
        $('.loader-msg').html("");
        $('.loader-msg').toggle();
        $(".main").css({ opacity: 1 });
    }
});

$("#print").on("click", async function (e) {
    $("#loader").toggle();
    $('.loader-msg').toggle();
    $(".main").css({ opacity: 0.5 });
    // var htmlhead = document.querySelector('head').innerHTML;
    var mainDiv = document.createElement('div');
    mainDiv.id = "maindiv";
    var container = document.querySelectorAll('.main');
    var canvasHeightFinal;
    for (var j = 0; j < container.length; j++) {
        // console.log(container[j], "<<<<<");
        if (!state.roomViews) {
            const dataUrl = await domtoimage.toJpeg(document.getElementById("wd-0"), { quality: 0.95 })
            var link = document.createElement('a');
            link.download = 'bcde.png';
            link.href = dataUrl;
            link.click();
            // return container.innerHTML;
        } else {
            var totalpage = state.roomViews ? state.roomViews.length : 1;;
            var currentPage = 0;
            
            // Starting two pages to print
            var projInfoId = $('#project-info')[0];
            var edgeBandInfo = $('#laminate-edgeband-info')[0];
            
            const projInfoIdUrl = await domtoimage.toJpeg(projInfoId, { quality: 0.95 })
            var projInfoIdUrlImgTag = new Image();
            projInfoIdUrlImgTag.src = projInfoIdUrl;
            projInfoIdUrlImgTag.id = "project-info";
            mainDiv.appendChild(projInfoIdUrlImgTag);
            var pagebreak = document.createElement("div");
            pagebreak.setAttribute("style", "clear: both;page-break-after: always;");
            mainDiv.appendChild(pagebreak);
            
            const edgeBandInfoUrl = await domtoimage.toJpeg(edgeBandInfo, { quality: 0.95 })
            // console.log(edgeBandInfoUrl, "edgeBandInfoUrl")
            var edgeBandInfoUrlImgTag = new Image();
            edgeBandInfoUrlImgTag.src = edgeBandInfoUrl;
            edgeBandInfoUrlImgTag.id = "laminate-edgeband-info";
            mainDiv.appendChild(edgeBandInfoUrlImgTag);
            var pagebreak = document.createElement("div");
            pagebreak.setAttribute("style", "clear: both;page-break-after: always;");
            mainDiv.appendChild(pagebreak);
            console.log(state.roomViews.length, ' the length of rooms')
            let lenOfRooms =  state.roomViews.length
            let totalPages = Math.ceil(lenOfRooms/2);
            console.log(`Room views: ${lenOfRooms}, Total pages needed: ${totalPages}`);
            
            // Debug: Check which checkId elements exist
            for (let j = 0; j < totalPages; j++) {
                const elem = document.getElementById(`checkId-${j}`);
                console.log(`checkId-${j} exists:`, !!elem);
            }
            
            if (lenOfRooms%2 === 0){
                for (var i = 0; i < lenOfRooms/2; i++){
                    var convertMeToImg = $('#checkId-' + i)[0]
                    // Check if element exists before trying to convert
                    if (!convertMeToImg) {
                        console.error(`Element checkId-${i} not found`);
                        alert(`Failed to convert page ${i} to image: Element not found`);
                        $("#loader").toggle();
                        $('.loader-msg').html("")
                        $('.loader-msg').toggle()
                        $(".main").css({ opacity: 1 });
                        return;
                    }
                    $('.loader-msg').html(`${currentPage + i}` + "/" + `${totalPages}`);
                    try{
                        console.log('Converting element to image:', convertMeToImg);
                        
                        // Add additional options to handle potential rendering issues
                        const options = {
                            quality: 0.95,
                            bgcolor: '#ffffff',
                            width: convertMeToImg.offsetWidth,
                            height: convertMeToImg.offsetHeight,
                            style: {
                                transform: 'scale(1)',
                                transformOrigin: 'top left'
                            }
                        };
                        
                        const dataUrl = await Promise.race([
                            domtoimage.toJpeg(convertMeToImg, options),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('DOM to image timeout after 30 seconds')), 30000))
                        ]);
                        
                        if (!dataUrl || dataUrl === 'data:,') {
                            throw new Error('Empty or invalid image data generated');
                        }
                        
                        var imgTag = new Image();
                        imgTag.onload = function() {
                            console.log("Successfully converted page", i);
                        };
                        imgTag.onerror = function(e) {
                            console.error("Image load error for page", i, ":", e);
                            throw new Error(`Image failed to load for page ${i}`);
                        };
                        imgTag.src = dataUrl;
                        imgTag.id = "imgId-" + i;
                        mainDiv.appendChild(imgTag);
                        
                        var pagebreak = document.createElement("div");
                        pagebreak.setAttribute("style", "clear: both;page-break-after: always;");
                        mainDiv.appendChild(pagebreak)
                    }catch (error) {
                        console.error("Error converting page", i, ":", error);
                        console.error("Error details:", {
                            message: error.message,
                            stack: error.stack,
                            elementInfo: {
                                id: convertMeToImg.id,
                                className: convertMeToImg.className,
                                offsetWidth: convertMeToImg.offsetWidth,
                                offsetHeight: convertMeToImg.offsetHeight,
                                childElementCount: convertMeToImg.childElementCount
                            }
                        });
                        // Ask user if they want to continue with remaining pages
                        const continueProcessing = confirm(`Failed to convert page ${i} to image: ${error.message || 'Unknown error occurred'}\n\nDo you want to continue with the remaining pages?`);
                        if (!continueProcessing) {
                            $("#loader").toggle();
                            $('.loader-msg').html("")
                            $('.loader-msg').toggle()
                            $(".main").css({ opacity: 1 });
                            return;
                        }
                        
                        // Add a placeholder for the failed page
                        var placeholderDiv = document.createElement("div");
                        placeholderDiv.innerHTML = `<p style="text-align: center; color: red; font-size: 18px; padding: 50px;">Page ${i + 1} failed to convert</p>`;
                        placeholderDiv.style.height = "500px";
                        placeholderDiv.style.border = "2px dashed red";
                        placeholderDiv.style.margin = "20px";
                        mainDiv.appendChild(placeholderDiv);
                        
                        var pagebreak = document.createElement("div");
                        pagebreak.setAttribute("style", "clear: both;page-break-after: always;");
                        mainDiv.appendChild(pagebreak);
                    }
                }
            }else{
                for (var i = 0; i < Math.ceil(lenOfRooms/2); i++){
                    var convertMeToImg = $('#checkId-' + i)[0]
                    // Check if element exists before trying to convert
                    if (!convertMeToImg) {
                        console.error(`Element checkId-${i} not found`);
                        alert(`Failed to convert page ${i} to image: Element not found`);
                        $("#loader").toggle();
                        $('.loader-msg').html("")
                        $('.loader-msg').toggle()
                        $(".main").css({ opacity: 1 });
                        return;
                    }
                    console.log(convertMeToImg, 'image', convertMeToImg.offsetHeight)
                    $('.loader-msg').html(`${currentPage + i}` + "/" + `${totalPages}`);
                    try{
                        console.log('Converting element to image (odd):', convertMeToImg);
                        
                        // Add additional options to handle potential rendering issues
                        const options = {
                            quality: 0.95,
                            bgcolor: '#ffffff',
                            width: convertMeToImg.offsetWidth,
                            height: convertMeToImg.offsetHeight,
                            style: {
                                transform: 'scale(1)',
                                transformOrigin: 'top left'
                            }
                        };
                        
                        const dataUrl = await Promise.race([
                            domtoimage.toJpeg(convertMeToImg, options),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('DOM to image timeout after 30 seconds')), 30000))
                        ]);
                        
                        if (!dataUrl || dataUrl === 'data:,') {
                            throw new Error('Empty or invalid image data generated');
                        }
                        
                        var imgTag = new Image();
                        imgTag.onload = function() {
                            console.log("Successfully converted page (odd)", i);
                        };
                        imgTag.onerror = function(e) {
                            console.error("Image load error for page", i, ":", e);
                            throw new Error(`Image failed to load for page ${i}`);
                        };
                        imgTag.src = dataUrl;
                        imgTag.id = "imgId-" + i;
                        mainDiv.appendChild(imgTag);
                        
                        var pagebreak = document.createElement("div");
                        pagebreak.setAttribute("style", "clear: both;page-break-after: always;");
                        mainDiv.appendChild(pagebreak)
                    }catch (error) {
                        console.error("Error converting page (odd)", i, ":", error);
                        console.error("Error details:", {
                            message: error.message,
                            stack: error.stack,
                            elementInfo: {
                                id: convertMeToImg.id,
                                className: convertMeToImg.className,
                                offsetWidth: convertMeToImg.offsetWidth,
                                offsetHeight: convertMeToImg.offsetHeight,
                                childElementCount: convertMeToImg.childElementCount
                            }
                        });
                        // Ask user if they want to continue with remaining pages
                        const continueProcessing = confirm(`Failed to convert page ${i} to image: ${error.message || 'Unknown error occurred'}\n\nDo you want to continue with the remaining pages?`);
                        if (!continueProcessing) {
                            $("#loader").toggle();
                            $('.loader-msg').html("")
                            $('.loader-msg').toggle()
                            $(".main").css({ opacity: 1 });
                            return;
                        }
                        
                        // Add a placeholder for the failed page
                        var placeholderDiv = document.createElement("div");
                        placeholderDiv.innerHTML = `<p style="text-align: center; color: red; font-size: 18px; padding: 50px;">Page ${i + 1} failed to convert</p>`;
                        placeholderDiv.style.height = "500px";
                        placeholderDiv.style.border = "2px dashed red";
                        placeholderDiv.style.margin = "20px";
                        mainDiv.appendChild(placeholderDiv);
                        
                        var pagebreak = document.createElement("div");
                        pagebreak.setAttribute("style", "clear: both;page-break-after: always;");
                        mainDiv.appendChild(pagebreak);
                    }
                }
            }
    //         for (var i = 0; i < state.roomViews.length; i++) {
    //             console.log(state.roomViews.length, 'the length in state')
    //             var x = document.createElement('div')
    //             x.setAttribute('id', `wd1-${i}`)
    //             x.setAttribute('class', "working-drawing container-fluid")
    //             x.setAttribute('style', 'width: 500px')
    //             // var convertMeToImg = $('#wd1-' + i);
    //             if (i % 2 !== 0){
    //                 let append1 = $('#wd-' + i)[0]
    //                 x.append(append1)
    //                 let append2 = $('#wd-' + (i+1))[0]
    //                 x.append(append2)
    //             } else {
    //                 let append1 = $('#wd-' + i)[0]
    //                 if (append1 !== undefined){
    //                     x.append(append1)
    //                 }
    //                 // if (append1.length > 0){
    //                 //     x.append(append1)
    //                 // }
    //             }
    //             console.log(x, 'the x')
    //             // var convertMeToImg = $('#wd1-' + i)[0];
    //             // convertMeToImg.setAttribute('style', "")
    //             // convertMeToImg.setAttribute('class', "working-drawing container-fluid checkNumber")
    //             // console.log(convertMeToImg,'image')
    //             // $('.loader-msg').html(`${currentPage + i}` + "/" + `${totalpage}`);
    //             try {
    //                 // console.log(x, 'x undefined check')
    //                 const dataUrl = await domtoimage.toJpeg(x, { quality: 0.95 })
    //                 // domtoimage.toJpeg(convertMeToImg, { quality: 0.95 })
    //                 //     .then(function (dataUrl) {
    //                 //             var link = document.createElement('a');
    //                 //             link.download = 'my-image-name.jpeg';
    //                 //             link.href = dataUrl;
    //                 //             link.click();
    //                 //         });
    //                 console.log(dataUrl, 'url datta')
    //                 var imgTag = new Image();
    //                 imgTag.src = dataUrl;
    //                 imgTag.id = "imgId-" + i;
    //                 if(i%2 === 0){
    //                     imgTag.setAttribute('style', 'display: block; float: left')
    //                   }else{
    //                     imgTag.setAttribute('style', 'display: block; float: right')
    //                   }
    //                 mainDiv.appendChild(imgTag);
    //                 var pagebreak = document.createElement("div");
    //                 pagebreak.setAttribute("style", "clear: both;page-break-after: always;");
    //                 if(i%2 === 0){
    //                     pagebreak.setAttribute('style', 'display: none;')
    //                   }
    //                 mainDiv.appendChild(pagebreak);
    //             } catch (error) {
    //                 console.log(error, "error");
    //             }
    //         }
        }
    }
    canvasHeightFinal = convertMeToImg.offsetHeight;
    elementHTML = mainDiv.innerHTML;
    // var elementScript = [].map.call(document.getElementsByTagName('script'), function(el) {
    //     return el.outerHTML;
    // }).join();
    let date = new Date();
    let datestr = date.toISOString();
    datestr = datestr.replace(/[^0-9]/g, "");
    var fileName = `Drawings_${datestr}`;
    var finalHTML = '<html><body>' + elementHTML + '</body></html>'; //elementScript
    download(fileName, finalHTML, canvasHeightFinal)
});

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


window.addEventListener("resize", renderAl());

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
}

function getProjects(projectNo, versionNo) {
    let userProject = [], version = [];;
    fetch(window.APIAddress.getWdProject, {
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
        if (response.status == 401) {
            alert("You are not authorized for this task.");
            $("#loader").toggle();
            $(".modal").css({ opacity: 1 });
        }
        return Promise.reject(response);
    }).then(function (data) {
        console.log(data);
        $("#loader").toggle();
        $(".modal").css({ opacity: 1 });
        let project = [];
        data.forEach(el => {
            // console.log(data, 'data');
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
        // console.log(version, 'wdFile');
        version.forEach(function (el) {
            if (el.project_no === projectNo) {
                // console.log(el);
                el.version.forEach(function (ele) {
                    // console.log(projectNo, versionNo);
                    if (ele.version == versionNo) {
                        readJSO(ele.wdFile)
                    }
                })
            } else {
                console.log("Project WD file Not found");
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


btn.onclick = function () {
    modal.style.display = "block";
    userPrj = [], version = [];
    $("#loader").toggle();
    $(".modal").css({ opacity: 0.5 });
    const userId = localStorage.getItem("userId");
    let userProject = [];
    console.log(document.getElementById('modal'), localStorage.getItem("token"), userId);
    fetch(window.APIAddress.getBtnClickProject, {
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


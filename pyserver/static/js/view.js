// fix_dpi to remove blurring
const dpi = window.devicePixelRatio;
const fix_dpi = (canvas) => {
  // Safety check for null canvas
  if (!canvas) {
    console.warn('fix_dpi called with null canvas');
    return;
  }
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
  // console.log(typeof canvas, 'canvas')
  canvas.setAttribute("width", style.width() * dpi);
  canvas.setAttribute("height", style.height() * dpi);
  canvas.selectable = true;
  
};

// Function to remove site image and show upload box again
const removeSiteImage = (pageIndex) => {
  const uploadInput = document.getElementById(`site-image-upload-${pageIndex}`);
  const uploadBox = document.getElementById(`site-image-upload-box-${pageIndex}`);
  const previewDiv = document.getElementById(`site-image-preview-${pageIndex}`);
  
  if (uploadInput && uploadBox && previewDiv) {
    uploadInput.value = ''; // Clear the file input
    uploadBox.style.display = 'block'; // Show upload box
    previewDiv.style.display = 'none'; // Hide preview
  }
};

// generate views and render project_ & org_url in every views
const renderProjectInfo = (projectInfo, viewsCnt) => {
  if (projectInfo == null || viewsCnt < 0) return;
  let matData = [];
  state.spaceNamesData.forEach(ele => {
    Object.keys(ele).forEach(key => {
      rooms = ele[key]
      let dupRemoveMaterialData = rooms.filter((v,i) => rooms.findIndex(item => item.name == v.name) === i )
      matData.push({
        rname: key,
        materialdata: dupRemoveMaterialData,
        matlen: dupRemoveMaterialData.length
      })
    })
  })

  let orgDetail = {};
  if (projectInfo.project_no.includes('DP.')) {
    orgDetail = {
      org_logo_url : window.decorpotOrg.DPLogo,
      org_name: window.decorpotOrg.DPName,
      org_address: window.decorpotOrg.DPAddress
    }
  } else {
    orgDetail = {
      org_logo_url : projectInfo.org_logo_url,
      org_name: projectInfo.org_name,
      org_address: projectInfo.org_address
    }
  }
  try {
    const details = state.projectInfo;
    // Create one container per view (no longer 2 per page)
    for (let i = 0; i < viewsCnt; i++){
      const check = `
        <div class = "container" id="checkId-${i}" style = "margin-left:1px">
          <div class = "row main-class" id = "div-${i}">

          </div>
        </div>
        <div class="html2pdf__page-break"></div>`
      document.querySelector(".main").insertAdjacentHTML("beforeend", check)
    }
    
    // Function to add dynamic table with room-specific data
    const addDynamicTableToPages = () => {
      // Start from (index 0) - wait a bit for DOM to be ready
      setTimeout(() => {
        for (let i = 0; i < viewsCnt; i++) {
          // Look for the specific working drawing div for this page
          const pageSelector = `#wd-${i}`;
          const pageElement = document.querySelector(pageSelector);
          
          if (pageElement) {
            // Get room information and page header from state if available
            let roomName = 'Foyer';
            let drawingTitle = 'Foyer';
            let electricWorks = '';
            
            // Try to get room information from state.roomViews if available
            if (state.roomViews && state.roomViews[i]) {
              const viewId = state.roomViews[i].getID ? state.roomViews[i].getID() : state.roomViews[i].id;
              if (viewId) {
                const roomParts = viewId.split('+');
                roomName = roomParts[0] || 'Foyer';
                
                // Check for electrical works or components in this room
                if (state.rooms && state.rooms[roomName]) {
                  const roomData = state.rooms[roomName];
                  // Look for electrical components or accessories
                  Object.keys(roomData).forEach(viewKey => {
                    if (roomData[viewKey].floor_components) {
                      const library = roomData[viewKey].floor_components.library;
                      Object.keys(library).forEach(compKey => {
                        const comp = library[compKey];
                        if (comp.comp_details && comp.comp_details.accessories) {
                          electricWorks += comp.comp_details.accessories.join(', ') + ' ';
                        }
                      });
                    }
                  });
                }
              }
            }
            
            // Get the drawing title from the view object or construct it from room data
            if (state.roomViews && state.roomViews[i]) {
              const view = state.roomViews[i];
              if (view.getName) {
                const viewName = view.getName();
                const viewId = view.getID ? view.getID() : view.id;
                
                if (viewId) {
                  const roomParts = viewId.split('+');
                  const roomName = roomParts[0] || 'Room';
                  const viewType = roomParts[1] || '';
                  
                  // Construct drawing title based on view type
                  switch (viewName) {
                    case "room_top_view":
                      drawingTitle = `${roomName} ROOM PLAN`;
                      break;
                    case "render_wall_view":
                      drawingTitle = `${roomName} ${viewType.toUpperCase()} - RENDER VIEW`;
                      break;
                    case "top_view":
                      drawingTitle = `${roomName} ${viewType.toUpperCase()} - PLAN`;
                      break;
                    case "front_view":
                      drawingTitle = `${roomName} ${viewType.toUpperCase()} - ELEVATION`;
                      break;
                    case "internal_view":
                      drawingTitle = `${roomName} ${viewType.toUpperCase()} - INTERNALS`;
                      break;
                    case "Handles & Accessories":
                      drawingTitle = `${roomName} ${viewType.toUpperCase()} - HANDLES & ACCESSORIES`;
                      break;
                    case "Ground floor plan":
                      drawingTitle = "Ground Floor Plan";
                      break;
                    default:
                      drawingTitle = viewName;
                      break;
                  }
                } else {
                  drawingTitle = viewName;
                }
              }
            }
            
            // Check if table already exists for this page
            const existingTable = pageElement.querySelector('.dynamic-table');
            if (!existingTable) {
               // Create the dynamic table covering the full page width
               // Use 75%/25% layout for all pages (this is for the bottom table, not the main content area)
               const leftWidth = "75%";
               const rightWidth = "25%";
               
              const dynamicTable = `
                <div style="background-color:white; padding: 0; margin: 0; display: flex;">
                  <div style="width: ${leftWidth};">
                    <table class="table table-bordered dynamic-table" style="margin: 0; font-size: 11px; width: 100%; border: 1px solid #000; table-layout: fixed;">
                      <tbody>
                       <tr>
                         <td rowspan="3" contenteditable='true' id="electric-works-${i}" data-page="${i}" style="background-color: #e6f3ff; font-weight: bold; padding: 8px; vertical-align: top; width: 16%; text-align: center; border: 1px solid #000;">
                           Electric works:<br/><span style="font-weight: normal; font-size: 10px; color: #666;"></span>
                         </td>
                         <td rowspan="3" contenteditable='true' id="note-dimensions-${i}" data-page="${i}" style="background-color: #ffe6e6; font-weight: bold; padding: 8px; vertical-align: top; width: 21.33%; text-align: center; border: 1px solid #000;">
                           NOTE:<br/>NON STANDARD DIMENSIONS<br/><span style="font-weight: normal; font-size: 10px; color: #666;"></span>
                         </td>
                         <td contenteditable='true' id="client-name-${i}" data-page="${i}" style="padding: 6px; border: 1px solid #000; width: 31.33%;"><strong>CLIENT NAME:</strong><br/>${projectInfo.client_name}</td>
                         <td contenteditable='true' id="drawing-title-${i}" data-page="${i}" style="padding: 6px; border: 1px solid #000; width: 31.33%;"><strong>DRAWING TITLE:</strong><br/>${drawingTitle}</td>
                       </tr>
                        <tr>
                          <td contenteditable='true' id="location-${i}" data-page="${i}" style="padding: 6px; border: 1px solid #000;"><strong>LOCATION:</strong><br/>${projectInfo.address || projectInfo.apartment_name || 'N/A'}</td>
                          <td contenteditable='true' id="designed-by-${i}" data-page="${i}" style="padding: 6px; border: 1px solid #000;"><strong>DESIGNED BY:</strong><br/>${projectInfo.designer_name || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td colspan="1" style="padding: 6px; border: 1px solid #000; height: 50px; background-color: white;">
                            <strong>DESIGN QC SIGN:</strong>
                            <!-- Empty space for QC sign as requested -->
                          </td>
                           <td colspan="1" style="padding: 6px; border: 1px solid #000; height: 50px; background-color: white;">
                             <strong>NOTES:</strong><br/>
                             
                           </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                   <div style="width: ${rightWidth};">
                     <table class="table table-bordered" style="margin: 0; font-size: 11px; width: 100%; border-left: none; table-layout: fixed; height: 100%;">
                       <tbody>
                         <tr style="height: 100%;">
                           <td style="padding: 8px; border: 1px solid #000; vertical-align: top; text-align: center;">
                             <div style="margin-bottom: 10px; margin-top: 10px; display: flex; justify-content: center; align-items: center;">
                               <img src="assets/decorpot.png" alt="Decorpot Logo" style="max-width: 160px; max-height: 80px; width: auto; height: auto; object-fit: contain;" crossorigin="anonymous"/>
                             </div>
                             <div contenteditable='true' id="org-address-${i}" data-page="${i}" style="font-size: 10px; line-height: 1.3; text-align: center;">
                               ${orgDetail.org_address || projectInfo.org_address || 'Not specified'}
                             </div>
                           </td>
                         </tr>
                       </tbody>
                     </table>
                   </div>
                </div>
              `;
               
               // Insert the table into the dedicated bottom container at full width
               const bottomContainer = pageElement.querySelector(`#bottom-table-container-${i}`);
               if (bottomContainer) {
                 bottomContainer.innerHTML = dynamicTable;
               }
            }
          }
        }
      }, 500); // Wait for all elements to be rendered
    };
    
    let viewsCount = []
    for (let i = 0; i < viewsCnt; i++) {
      // Apply 2-partition left column layout starting from page index 3 (4th page)
      // Pages 0-2: Project Details, Laminates, Ground Floor Plan (keep original layout)
      // Pages 3+: Room view pages (divide left column into 2 partitions)
      
      let leftColumnContent;
      if (i >= 1) {
        // For pages 1+ (index 0+), divide the left column into 2 partitions
        leftColumnContent = `
          <div class="row">
            <div class="col-8" style="border-right: 2px solid #ddd; padding: 10px;">
              <div class="canvas-container">
                <canvas id='checks'></canvas>
                <canvas class = 'overlay-canvas-container' id = "c#${i}"></canvas>
              </div>
            </div>
            <div class="col-4" style="padding: 10px;">
              <div style="height: 100%; display: flex; flex-direction: column;">
                <!-- Top half of the right partition -->
                <div style="flex: 1; background-color: #f9f9f9; border: 1px solid #ddd; padding: 15px; margin-bottom: 5px;">
                  <h6 style="margin-bottom: 15px; font-weight: bold; text-align: center;">3D Image</h6>
                  <div id="render-view-image-${i}" style="width: 100%; height: 200px; border: 1px solid #ddd; background-color: white; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <p style="color: #999; font-size: 12px; text-align: center;">RENDER VIEW Image will appear here</p>
                  </div>
                </div>
                <!-- Bottom half of the right partition -->
                <div style="flex: 1; background-color: #f0f0f0; border: 1px solid #ddd; padding: 15px; margin-top: 5px;">
                  <h6 style="margin-bottom: 15px; font-weight: bold; text-align: center;">Site Image</h6>
                  
                  <!-- Upload box (shown initially) -->
                  <div id="site-image-upload-box-${i}" style="border: 2px dashed #ccc; padding: 20px; text-align: center; background-color: white; margin-bottom: 10px;">
                    <p style="color: #999; font-size: 12px; margin-bottom: 10px;">Click to upload site image</p>
                    <input type="file" accept="image/*" style="display: none;" id="site-image-upload-${i}" />
                    <button type="button" onclick="document.getElementById('site-image-upload-${i}').click()" style="background-color: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                      Upload Image
                    </button>
                  </div>
                  
                  <!-- Image preview (hidden initially) -->
                  <div id="site-image-preview-${i}" style="display: none; margin-top: 10px; position: relative;">
                    <img id="site-image-display-${i}" style="width: 100%; height: 200px; object-fit: cover; border: 1px solid #ddd;" />
                    <button type="button" onclick="removeSiteImage(${i})" style="background-color: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-size: 11px; margin-top: 8px; width: 100%;">
                      Remove Image
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        // For page 1, keep the original single left column layout
        leftColumnContent = `
          <div class="row">
            <div class="canvas-container">
              <canvas id='checks'></canvas>
              <canvas class = 'overlay-canvas-container' id = "c#${i}"></canvas>
            </div>
          </div>
        `;
      }
      
      const template = `
      <div class="working-drawing container-fluid col-md-12 checkNumber" id='wd-${i}'>
        <div class="row" style="min-height: 100vh;">
          <div id="legend-view" class="col-9">
            ${leftColumnContent}
          </div>
          <div id="legend-view_1" class="col-3" style="border-left: 2px solid #ddd; min-height: 100vh; padding: 15px;">
            <div class = 'fixed-table-body'>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h6 style="margin: 0;">Materials Details</h6>
                <button class="legend-add-row" data-table="materials" onclick="console.log('Materials button clicked')">+</button>
              </div>
              <table class="table table-bordered side-table" style="background-color: white;">            
              </table>
            </div>
            <div class='fixed-table-body'>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h6 style="margin: 0;">Handles Details</h6>
                <button class="legend-add-row" data-table="handles" onclick="console.log('Handles button clicked')">+</button>
              </div>
              <table class="table table-bordered side-Handletable" style="background-color: white;">            
              </table>
            </div>
          </div>
        </div>
        <!-- Move dynamic table to full width outside the main row -->
        <div class="row" id="bottom-table-container-${i}" style="margin-top: 10px;">
        </div>
      </div>
      `;
      viewsCount.push(template)
      
      // Add functionality for 3D Image and Site Image sections
      if (i >= 1) {
        setTimeout(() => {
          // Site Image upload functionality
          const uploadInput = document.getElementById(`site-image-upload-${i}`);
          const uploadBox = document.getElementById(`site-image-upload-box-${i}`);
          const previewDiv = document.getElementById(`site-image-preview-${i}`);
          const imageDisplay = document.getElementById(`site-image-display-${i}`);
          
          if (uploadInput && uploadBox && previewDiv && imageDisplay) {
            uploadInput.addEventListener('change', function(e) {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                  imageDisplay.src = e.target.result;
                  // Hide upload box and show preview
                  uploadBox.style.display = 'none';
                  previewDiv.style.display = 'block';
                };
                reader.readAsDataURL(file);
              }
            });
          }
          
          // 3D Image - populate with render image URL from the current view
          const renderViewContainer = document.getElementById(`render-view-image-${i}`);
          if (renderViewContainer && state.roomViews && state.roomViews[i]) {
            const currentView = state.roomViews[i];
            let renderViewImageURL = null;
            
            // Check if current view has a render image URL using the new getRenderImgUrl method
            if (currentView && currentView.getRenderImgUrl) {
              renderViewImageURL = currentView.getRenderImgUrl();
            }
            
            // Display the render view image if found for this specific view
            if (renderViewImageURL && renderViewImageURL.trim() !== '') {
              const img = new Image();
              img.onload = function() {
                renderViewContainer.innerHTML = `<img src="${renderViewImageURL}" style="width: 100%; height: 100%; object-fit: contain;" alt="3D Render View" />`;
              };
              img.onerror = function() {
                renderViewContainer.innerHTML = `<p style="color: #999; font-size: 12px; text-align: center;">3D render image failed to load</p>`;
              };
              img.src = renderViewImageURL;
            } else {
              renderViewContainer.innerHTML = `<p style="color: #999; font-size: 12px; text-align: center;">No 3D render image available for this view</p>`;
            }
          }
        }, 100); // Small delay to ensure DOM elements are created
      }
      
      // document.querySelector(".main-class").insertAdjacentHTML("beforeend", template);
      // const pageBreak = `<div class="html2pdf__page-break"></div>`;
      // if (i %2 === 0){
      //   document.querySelector(`#wd-${i}`).insertAdjacentHTML("beforeend", pageBreak);
      // }else{
      //   document.querySelector(`#wd-${i}`).insertAdjacentHTML("beforeend", pageBreak)
      // }
    }
    console.log(viewsCount.length, 'the count of views')
    let len = viewsCount.length
    // Insert each view into its own container (one view per page)
    for (let i = 0; i < len; i++) {
      if (document.getElementById(`div-${i}`)) {
        document.getElementById(`div-${i}`).insertAdjacentHTML('beforeend', viewsCount[i])
      }
    }
    // Remove the old even/odd logic - now each view gets its own container
    // Old logic kept for reference but not used
    if (false) {
      const createdDiv = `
      <div class="working-drawing container-fluid col-md-12 checkNumber" id='wd'>
      </div>
      `
      viewsCount.push(createdDiv)
      console.log('odd hit')
      for (let i = 0; i < Math.ceil(len/2); i++){ // i = 0-8
        for (let j = 0; j < len; j++){ //j = 0-4
          if (document.getElementById(`div-${i}`).childElementCount !== 2 && j < len-1){
            document.getElementById(`div-${i}`).insertAdjacentHTML('beforeend', viewsCount[j])
            document.getElementById(`div-${i}`).insertAdjacentHTML('beforeend', viewsCount[j+1])
            let index = viewsCount.indexOf(viewsCount[j])
            viewsCount.splice(index,2)
            console.log(document.getElementById(`div-${i}`))
          }
        }
      }
    }

 //[[0,1],[2,3],[4,5]]
    // Material Table Data Page
    const materialTableDataPage = `
      <div class="working-drawing container-fluid" id="laminate-edgeband-info" style="height: 100vh; padding: 15px 40px; background-color: #fff; box-sizing: border-box;">
        <div class="row pt-2">
          <div class="col-md-8">
            <h2 id="title" style="font-size: 32px; font-weight: bold; margin-bottom: 20px; color: #333;">Laminates & Edge Band Table :-</h2>
          </div>
          <div class="col-md-4" style="text-align: right;">
            <div style="display: inline-block; text-align: center; margin-top: 10px;">
              <div style="margin-bottom: 10px; margin-top: 10px; display: flex; justify-content: center; align-items: center;">
                <img src="assets/decorpot.png" alt="Decorpot Logo" style="max-width: 160px; max-height: 80px; width: auto; height: auto; object-fit: contain;" crossorigin="anonymous"/>
              </div>
            </div>
          </div>
          <div class="col-md-12">
            <div id="laminateEdgeBand">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; font-size: 14px;">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="border: 2px solid #000; padding: 6px; text-align: center; font-weight: bold; width: 12%;">Space/Area<br/><span style="color: red; font-weight: bold;">(Designer)</span></th>
                    <th style="border: 2px solid #000; padding: 6px; text-align: center; font-weight: bold; width: 58%;">
                      Laminate Code And Laminate Image<span style="color: red; font-weight: bold;">(Designer)</span><br/>
                      <span style="font-size: 11px; font-weight: normal; color: #666;">Note : Physical Laminate Selected Will Be Final, Soft Copy For Office Use</span>
                    </th>
                    <th style="border: 2px solid #000; padding: 6px; text-align: center; font-weight: bold; width: 15%;">Edge Banding Code<br/><span style="color: red; font-weight: bold;">(Factory)</span></th>
                  </tr>
                </thead>
                <tbody id="laminatetbodyData">
                  <!-- Dynamic content will be populated here -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div class="html2pdf__page-break"></div>`
    document.querySelector("#checkId-0").insertAdjacentHTML("beforebegin", materialTableDataPage);

    // Make all table cells editable and enable dynamic content updates
    setTimeout(() => {
      // Make all laminate table cells editable (they're already set in the template)
      const laminateCells = document.querySelectorAll('#laminatetbodyData td[contenteditable]');
      laminateCells.forEach(cell => {
        cell.style.cursor = 'text';
      });
      
      // Make material name cells editable
      const materialNameCells = document.querySelectorAll('#laminatetbodyData div[contenteditable]');
      materialNameCells.forEach(cell => {
        cell.style.cursor = 'text';
        cell.addEventListener('focus', function() {
          this.style.backgroundColor = '#fff3cd';
        });
        cell.addEventListener('blur', function() {
          this.style.backgroundColor = 'transparent';
        });
      });
      
      // Add click handlers for material images
      const materialBoxes = document.querySelectorAll('#laminatetbodyData img, #laminatetbodyData div[style*="background-color"]');
      materialBoxes.forEach(box => {
        box.addEventListener('click', function() {
          // Allow editing of material codes
          const parentDiv = this.closest('div[style*="text-align: center"]');
          if (parentDiv) {
            const codeElement = parentDiv.querySelector('div[contenteditable][style*="font-weight: bold"]');
            if (codeElement) {
              codeElement.focus();
              // Select all text for easy editing
              const range = document.createRange();
              range.selectNodeContents(codeElement);
              const selection = window.getSelection();
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        });
      });
    }, 500); // Increased timeout to ensure dynamic content is loaded

    // Dynamic table generation using actual material data from JSON
    for(let i = 0; i < matData.length; i++) {
      const roomName = matData[i].rname;
      const materials = matData[i].materialdata;
      
      // Generate material boxes HTML
      let materialsHTML = '';
      materials.forEach((material, index) => {
        const materialName = material.name || `Material_${index + 1}`;
        const imageUrl = material.image_url || (state.matThumbnails && state.matThumbnails[materialName] ? 
                        state.matThumbnails[materialName].image_url : '');
        const edgeBandCode = material.edge_band_code || '';
        
        materialsHTML += `
          <div style="text-align: center; flex: 1; max-width: 90px;">
            <div style="background-color: #f5f5f5; width: 70px; height: 80px; margin: 0 auto 3px; border: 1px solid #999; display: flex; align-items: center; justify-content: center; overflow: hidden;">
              ${imageUrl ? 
                `<img src="${imageUrl}" alt="${materialName}" style="width: 100%; height: 100%; object-fit: cover;" crossorigin="anonymous" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" onload="this.nextElementSibling.style.display='none';"/>
                 <div style="font-size: 8px; text-align: center; color: #666; padding: 5px; display: none;">${materialName}</div>` : 
                `<div style="font-size: 8px; text-align: center; color: #666; padding: 5px;">${materialName}</div>`
              }
            </div>
            <div style="font-size: 10px; font-weight: bold;" contenteditable="true">${materialName}</div>
            <div style="font-size: 9px; color: #666;" contenteditable="true">${materialName}</div>
          </div>
        `;
      });
      
      // Add flexible space if there are materials
      if (materials.length > 0) {
        materialsHTML += `<div style="flex: ${Math.max(1, 6 - materials.length)};"></div>`;
      }
      
      const tableRow = `
        <tr>
          <td style="border: 2px solid #000; padding: 10px; text-align: center; font-weight: bold; vertical-align: middle;" contenteditable="true">${roomName}</td>
          <td style="border: 2px solid #000; padding: 6px;">
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              ${materialsHTML || '<div style="text-align: center; width: 100%; color: #999; font-style: italic;">No materials assigned</div>'}
            </div>
          </td>
          <td style="border: 2px solid #000; padding: 10px; text-align: center; vertical-align: middle;" contenteditable="true"></td>
        </tr>
      `;
      
      document.querySelector("#laminatetbodyData").insertAdjacentHTML("beforeend", tableRow);
    }

    // Project Details Page
    const topProjectInfoDetailPage = `
      <div class="row">
        <div class="col-md-12" style="margin-top: 55px">
        </div>
      </div>
      <div class="working-drawing container-fluid" id="project-info" style="height: 90vh; padding: 40px; background-color: #fff;">
        <div class="row pt-4">
          <div class="col-md-8">
            <h2 id="title" style="font-size: 48px; font-weight: bold; margin-bottom: 40px; color: #333;">Project Details :</h2>
          </div>
          <div class="col-md-4" style="text-align: right;">
            <div style="display: inline-block; text-align: center; margin-top: 10px;">
              <div style="margin-bottom: 10px; margin-top: 10px; display: flex; justify-content: center; align-items: center;">
                <img src="assets/decorpot.png" alt="Decorpot Logo" style="max-width: 180px; max-height: 90px; width: auto; height: auto; object-fit: contain;" crossorigin="anonymous"/>
              </div>
            </div>
          </div>
          <div class="col-md-12">
            <table style="margin: 40px auto; width: 95%; font-size: 20px; border-collapse: collapse; border: 2px solid #000;">
              <tbody>
                <tr>
                  <td style="background-color: #f8f9fa; font-weight: bold; padding: 18px; width: 35%; border: 2px solid #000; vertical-align: middle;">Client name</td>
                  <td contenteditable='true' style="padding: 18px; border: 2px solid #000; vertical-align: middle;">${projectInfo.client_name}</td>
                </tr>
                <tr>
                  <td style="background-color: #f8f9fa; font-weight: bold; padding: 18px; border: 2px solid #000; vertical-align: middle;">Apartment Address</td>
                  <td contenteditable='true' style="padding: 18px; border: 2px solid #000; vertical-align: middle; line-height: 1.4;">${projectInfo.address || projectInfo.apartment_name || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="background-color: #f8f9fa; font-weight: bold; padding: 18px; border: 2px solid #000; vertical-align: middle;">Client contact number</td>
                  <td contenteditable='true' style="padding: 18px; border: 2px solid #000; vertical-align: middle;">${projectInfo.contact_no || projectInfo.client_contact || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="background-color: #f8f9fa; font-weight: bold; padding: 18px; border: 2px solid #000; vertical-align: middle;">Designer Name</td>
                  <td contenteditable='true' style="padding: 18px; border: 2px solid #000; vertical-align: middle;">${projectInfo.designer_name || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="background-color: #f8f9fa; font-weight: bold; padding: 18px; border: 2px solid #000; vertical-align: middle;">Design QC Name</td>
                  <td contenteditable='true' style="padding: 18px; border: 2px solid #000; vertical-align: middle;">${projectInfo.qc_name || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="background-color: #f8f9fa; font-weight: bold; padding: 18px; border: 2px solid #000; vertical-align: middle;">Project number /Unique ID</td>
                  <td contenteditable='true' style="padding: 18px; border: 2px solid #000; vertical-align: middle;">${projectInfo.project_no}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="html2pdf__page-break"></div>`
    document.querySelector("#laminate-edgeband-info").insertAdjacentHTML("beforebegin", topProjectInfoDetailPage);
    
    // add space
    document
      .querySelector(".main")
      .insertAdjacentHTML(
        "beforeend",
        '<div class = "tempPage container-fluid"></div>'
      );
    // initialize the current and total page number in menu bar
    // Page number display elements removed

    // Add dynamic tables to pages 3+ after all containers are created
    setTimeout(() => {
      addDynamicTableToPages();
    }, 100);

    
    // Event handler removed - each page now has independent editable fields
    // Previously, this code synced content across all pages, which is not desired
    // $(document).on("input", '.dynamic-table td[contenteditable]', function (e) {
    //   $('.dynamic-table').each(function () {
    //     var tr = $(this).find('tr')[e.target.closest('tr').rowIndex];
    //     var td = $(tr).find('td')[e.target.cellIndex]
    //     if (td === e.target) {
    //       return;
    //     };
    //     $(td).html(e.target.innerHTML);
    //   })
    // })
    
    // add row to 'legend' table
    $(".legend-add-row").on("click", (e) => {
      $(e.target).next().click()
    });

    $(".legend-add-image").on("change", (e) => {
      addLegendRow(e);
      $(".legend-add-image").val(null);
    })

  } catch (err) {
    console.log(err);
  }
  // let x = document.getElementsByClassName("checkNumber")
  // let z = document.getElementsByClassName("html2pdf__page-break")
  // for (let i = 0; i < x.length; i++){
  //   let evOrOdd = x[i].id
  //   let y = evOrOdd.split('-')
  //   if(Number(y[1])%2 === 0){
  //     x[i].setAttribute('style', 'display: block; float: left')
  //   }else{
  //     x[i].setAttribute('style', 'display: block; float: right')
  //   }
  // }
  // for (let i = 0; i < z.length; i++){
  //   if(i%2 === 0){
  //     z[i].setAttribute('style', 'display: none;')
  //   }
  // }
};

// fix dpi of canvases and calibrate the origin point
const calibrateCanvases = (viewBoxInfoes) => {
  for (let i = 0; i < viewBoxInfoes.length; i++) {
    // fix canvas-dpi
    const canvas = document.querySelector(`#wd-${i} canvas`);
    
    // Skip if canvas doesn't exist yet
    if (!canvas) {
      console.warn(`Canvas #wd-${i} not found, skipping calibration`);
      continue;
    }
    
    fix_dpi(canvas);

    const newOrigin = calcScaleOrigin(
      viewBoxInfoes[i],
      canvas.width,
      canvas.height
    );

    //console.log(i, newOrigin.scale, newOrigin.x, newOrigin.y);

    // Update the viewBoxInfo entry
    if (viewBoxInfoes[i]) {
      viewBoxInfoes[i].scale = newOrigin.scale;
      viewBoxInfoes[i].newOriginX = newOrigin.x;
      viewBoxInfoes[i].newOriginY = newOrigin.y;
    }

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
  // Calibration is now handled in the main render loop
  
  state.roomViews.forEach((elem, index) => {
    // Skip render_wall_view pages
    if (elem.name === "render_wall_view" || elem.type === "ImageView") {
      return;
    }
    
    if (elem.name == "room_top_view") {
      ele2 = document.querySelector("#wd-" + index);
      if (ele2) {
        ele2.querySelectorAll("[id='extraInfo']").forEach(b => {
          b.innerHTML = 'Note: Components not attached to the wall are showed in room plan';
          b.setAttribute('style', "position: absolute;top: 40px;width: 20%;right:0;font-size:13px;color: #d60000;");
        });
      }
    }
    if (elem.name === "EXTRA_VIEW"){
      ele1 = document.querySelector("#wd-" + index);
      if (ele1) {
        ele1.contentEditable = true
      }
    }
  });
  /* draw lines */
  const floorCanvas = document.querySelector(`#wd-${id} canvas`);
  if (!floorCanvas) {
    console.warn(`Canvas #wd-${id} not found in renderFloorPlan, skipping outline drawing`);
    return;
  }
  
  const cx = floorCanvas.getContext("2d");
  const path = floorPlanView.getOutline();
  cx.beginPath();
  cx.strokeStyle = "black";
  cx.lineWidth = "16";
  cx.selectable = true;
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
    
    // Check if canvas is available, otherwise defer
    if (!canvas || !state.viewBoxInfo[0]) {
      console.warn('Canvas or viewBoxInfo missing for Ground Floor Plan, deferring room name rendering');
      setTimeout(() => {
        if (overlayCanvases[0] && state.viewBoxInfo[0]) {
          console.log('Deferred room name rendering for Ground Floor Plan now executing');
          // Recursively call renderFloorPlan to render room names
          const tempCanvas = overlayCanvases[0];
          Object.keys(room_pos).forEach((roomName) => {
            const pos = room_pos[roomName];
            const canvasPos = CoordinateTransform.worldToCanvas(pos[0] - 30, pos[1], state.viewBoxInfo[0]);
            const textbox = new fabric.Textbox(roomName, {
              left: canvasPos.x,
              top: canvasPos.y,
              width: 40,
              fontSize: 12,
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

            tempCanvas.getObjects();
            tempCanvas.add(textbox);
            tempCanvas.selection = false;
            tempCanvas.renderAll();
            tempCanvas.calcOffset();
          });
        }
      }, 200);
      return; // Skip rendering now, will be deferred
    }
    
    Object.keys(room_pos).forEach((roomName) => {
      const pos = room_pos[roomName];
      const canvasPos = CoordinateTransform.worldToCanvas(pos[0] - 30, pos[1], state.viewBoxInfo[0]);
      const textbox = new fabric.Textbox(roomName, {
        left: canvasPos.x,
        top: canvasPos.y,
        width: 40,
        fontSize: 12,
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
    });
  }
  
  // Replace legend content with SCOPING DATA for Ground Floor Plan
  const scopingDataHTML = `
    <div style="margin-bottom: 20px;">
      <h5 style="margin: 0 0 15px 0; font-weight: bold; text-decoration: underline;">SCOPING DATA</h5>
      <div style="line-height: 1.8;">
        <div style="margin-bottom: 8px;">
          <span style="color: black;">FULL HOUSE PAINTING</span>
          <span style="color: red; margin-left: 5px;">- CX SCOPE</span>
        </div>
        <div style="margin-bottom: 8px;">
          <span style="color: black;">KITCHEN GRANITE MATERIAL</span>
          <span style="color: red; margin-left: 5px;">- CX SCOPE</span>
        </div>
        <div style="margin-bottom: 8px;">
          <span style="color: black;">KITCHEN GRANITE FIXING</span>
          <span style="color: red; margin-left: 5px;">- CX SCOPE</span>
        </div>
        <div style="margin-bottom: 8px;">
          <span style="color: black;">LIGHT FIXTURES</span>
          <span style="color: red; margin-left: 5px;">- CX SCOPE</span>
        </div>
        <div style="margin-bottom: 8px;">
          <span style="color: black;">ELECTRIC POINTS</span>
          <span style="color: red; margin-left: 5px;">- CX SCOPE</span>
        </div>
      </div>
    </div>
    <div style="margin-top: auto; padding-top: 20px; border-top: 1px solid #ddd;">
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <div style="width: 20px; height: 20px; background-color: black; margin-right: 10px; flex-shrink: 0;"></div>
        <div style="font-size: 12px; color: #666;">
          No 17, 2nd floor, 18th Cross Rd,<br>
          Sector 4, HSR Layout,<br>
          Bengaluru, Karnataka 560102
        </div>
      </div>
    </div>
  `;
  
  // Replace the legend content with SCOPING DATA for Ground Floor Plan page
  const groundFloorElement = document.querySelector(`#wd-${id}`);
  if (groundFloorElement) {
    const legendSection = groundFloorElement.querySelector('#legend-view_1');
    if (legendSection) {
      // Clear existing content and replace with SCOPING DATA
      legendSection.innerHTML = scopingDataHTML;
    }
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
  
  // Skip RenderView/render_wall_view pages (safety check)
  if (view.type === "ImageView" || view.getName() === "render_wall_view") {
    return;
  }
  
  const viewName = view.getName();
  // render titles
  renderTitle(view, id);

  // if view is 'RoomSubView'
  if (viewType.includes(viewName)) {
    // render view 'outline'
    const outline = view.getOutline();
    renderOutline(outline, id, "view", [], viewName);

    // render 'opening'('window', 'door') except for top_view

    // if (viewName !== "top_view") { //openings
    renderWindowDoor(view, id);
    //}

    // render 'floor_components'
    if (view.getComps().length !== 0) {
      renderComponents(view, id);
    }



    // render 'external' items
    if (viewName === 'room_top_view') {
      renderExternalItems(view, id);
      renderViewNames(view, id)
    }
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

const renderViewNames = (view, id) => {
  const viewnames = state.rooms[currentRoom]["room_top_view"]["views"]
  renderViewTexts(viewnames, id);
};

const renderViewTexts = (textObject, id) => {
  if (!textObject || Object.keys(textObject) === 0) return;

  if (!openNewJSON) return;
  const canvas = overlayCanvases[id];
  
  // Safety check for canvas - defer if not ready
  if (!canvas || !state.viewBoxInfo[id]) {
    // Defer text rendering until canvases are ready
    setTimeout(() => {
      if (overlayCanvases[id] && state.viewBoxInfo[id]) {
        renderViewTexts(textObject, id);
      }
    }, 200);
    return;
  }
  
  const scale = state.viewBoxInfo[id]["scale"];
  const origin = [
    state.viewBoxInfo[id]["newOriginX"],
    state.viewBoxInfo[id]["newOriginY"],
  ];
  for (let j in state.rooms[currentRoom]["room_top_view"]["views"]) {
    let newDirectionArray = new Array();
    for (let z = 0; z < state.rooms[currentRoom]["room_top_view"]["views"][j].length; z++) {
      let cntForX = 0;
      let cntForY = 0;
      for (let i = 0; i < state.rooms[currentRoom]["room_top_view"]["views"][j][z].length; i++) {
        for (let k = 0; k < state.rooms[currentRoom]["room_top_view"]["views"][j][z][i].length; k++) {
          cntForX += state.rooms[currentRoom]["room_top_view"]["views"][j][z][i][k][0];
          cntForY += state.rooms[currentRoom]["room_top_view"]["views"][j][z][i][k][1];
        }
      }
      let l = cntForX / (2 * state.rooms[currentRoom]["room_top_view"]["views"][j][z].length)
      let t = (cntForY / (2 * state.rooms[currentRoom]["room_top_view"]["views"][j][z].length))
      const canvasPos = CoordinateTransform.worldToCanvas(l, t, state.viewBoxInfo[id]);
      const textbox = new fabric.Textbox(j, {
        left: canvasPos.x,
        top: canvasPos.y,
        width: 40,
        fontSize: 11,
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
      for(let x in state.rooms[currentRoom]) {
        if(state.rooms[currentRoom][x]['direction']) {
          newDirectionArray.push(
            {
              "direction": state.rooms[currentRoom][x]["direction"],
              "name": x
            }
          )
        }
      }
      var compassTopText;
      var compassBottomText;
      var compassLeftText;
      var compassRightText;
      newDirectionArray.forEach(ele => {
        if(ele.direction == 'top') {
          compassTopText = new fabric.Textbox(ele.name, {
            left: 70,
            top: 10,
            width: 50,
            fontSize: 14,
            originX: "center",
            originY: "center",
            lockMovementY: true,
            lockMovementX: true, selectable: false
          });
        }
        if(ele.direction == 'bottom') {
          compassBottomText = new fabric.Textbox(ele.name, {
            left: 70,
            top: 135,
            width: 50,
            fontSize: 14,
            originX: "center",
            originY: "center",
            lockMovementY: true,
            lockMovementX: true, selectable: false
          });
        }
        if(ele.direction == 'left') {
          compassLeftText = new fabric.Textbox(ele.name, {
            left: 30,
            top: 90,
            width: 50,
            fontSize: 14,
            originX: "center",
            originY: "center",
            lockMovementY: true,
            lockMovementX: true, selectable: false
          });
        }
        if(ele.direction == 'right') {
          compassRightText = new fabric.Textbox(ele.name, {
            left: 130,
            top: 60,
            width: 50,
            fontSize: 14,
            originX: "center",
            originY: "center",
            lockMovementY: true,
            lockMovementX: true, selectable: false
          });
        }
      })
      const compassHorizontalView = new fabric.Line([50, 50, 200, 50], {
        left: 20,
        top: 75,
        stroke: 'blue', scaleX: 0.7, selectable: false
      })
      const compassverticalView = new fabric.Line([50, 50, 200, 50], {
        left: 70,
        top: 20, stroke: 'blue',
        angle: 90,
        scaleX: 0.7,
        centerTransform: true, selectable: false
      });
      const compassCircle = new fabric.Circle({ radius: 5,top: 70,left: 64,fill: "#004de6",selectable: false, border: 1 })
      const triangleTop = new fabric.Triangle({ fill: "blue",top: 23,left: 70,height: 10,width: 10,originX: 'center',originY: 'center',selectable: false });
      const triangleBottom = new fabric.Triangle({ angle: 180,fill: "blue",top: 125,left: 70,height: 10,width: 10,originX: 'center',originY: 'center',selectable: false });
      const triangleLeft = new fabric.Triangle({ angle: 270,fill: "blue",top: 75,left: 23,height: 10,width: 10,originX: 'center',originY: 'center',selectable: false });
      const triangleRight = new fabric.Triangle({ angle: 90,fill: "blue",top: 75,left: 123,height: 10,width: 10,originX: 'center',originY: 'center',selectable: false });

      if(compassTopText && compassTopText.text) {
        canvas.add(compassTopText)
      }
      if(compassBottomText && compassBottomText.text) {
        canvas.add(compassBottomText)
      }
      if(compassLeftText && compassLeftText.text) {
        canvas.add(compassLeftText)
      }
      if(compassRightText && compassRightText.text) {
        canvas.add(compassRightText)
      }
      canvas.getObjects();
      canvas.add(textbox, compassHorizontalView, compassverticalView, compassCircle, triangleTop, triangleBottom, triangleLeft, triangleRight);
      console.log(`Added view text "${textbox.text}" to canvas ${id} at position (${textbox.left}, ${textbox.top})`);
      console.log(`View text object properties:`, {
        visible: textbox.visible,
        opacity: textbox.opacity,
        fontSize: textbox.fontSize,
        color: textbox.fill,
        width: textbox.width,
        height: textbox.height
      });
      canvas.selection = false;
      canvas.renderAll();
      canvas.calcOffset();
    }
  }
};

// render 'render_wall_view'
const renderRenderView = (imgURL, id) => {
  const canvas = document.querySelector(`#wd-${id} canvas`);
  if (!canvas) {
    console.warn(`Canvas #wd-${id} not found in renderRenderView, skipping`);
    return;
  }
  
  const cx = canvas.getContext("2d");
  // reset the canvas transform( setTransform is absolute transformation )
  cx.setTransform(1, 0, 0, 1, 0, 0);
  cx.selectable = true;
  
  // Enable image smoothing for better quality
  cx.imageSmoothingEnabled = true;
  cx.imageSmoothingQuality = 'high';
  
  const image = new Image();
  image.setAttribute("crossorigin", "*")
  image.onload = drawImageActualSize; // Draw when image has loaded

  // Load the image
  image.src = imgURL;

  function drawImageActualSize() {
    // Get canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Calculate scaling to fit the image in the canvas while maintaining aspect ratio
    const imageAspectRatio = this.width / this.height;
    const canvasAspectRatio = canvasWidth / canvasHeight;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (imageAspectRatio > canvasAspectRatio) {
      // Image is wider than canvas - fit to width
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imageAspectRatio;
      drawX = 0;
      drawY = (canvasHeight - drawHeight) / 2;
    } else {
      // Image is taller than canvas - fit to height
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imageAspectRatio;
      drawX = (canvasWidth - drawWidth) / 2;
      drawY = 0;
    }
    
    // Clear the canvas first
    cx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw the image with proper scaling
    cx.drawImage(this, drawX, drawY, drawWidth, drawHeight);
  }
};

// render view title(viewName)
const renderTitle = (view, id) => {
  const ID = view.getID();
  const viewType = view.type;
  const viewName = view.getName();
  const temp = ID.split("+");
  // console.log(temp, 'HHSADUHUHD ')
  const roomName = temp[0];
  $(`#wd-${id} #title`).text(viewName);
  switch (viewName) {
    case "room_top_view":
      $(`#wd-${id} #title`).text(`${roomName} ROOM PLAN`);
      break;
    case "render_wall_view":
      $(`#wd-${id} #title`).text(
        `${roomName} ${temp[1].toUpperCase()} - RENDER VIEW`
      );
      break;
    case "top_view":
      $(`#wd-${id} #title`).text(`${roomName} ${temp[1].toUpperCase()} - PLAN`);
      break;
    case "front_view":
      $(`#wd-${id} #title`).text(
        `${roomName} ${temp[1].toUpperCase()} - ELEVATION`
      );
      break;
    case "internal_view":
      $(`#wd-${id} #title`).text(
        `${roomName} ${temp[1].toUpperCase()} - INTERNALS`
      );
      break;
    case "Handles & Accessories":
      $(`#wd-${id} #title`).text(
        `${roomName} ${temp[1].toUpperCase()} - HANDLES & ACCESSORIES`
      );
      break;
    case "table_view":
      $(`#wd-${id} #title`).text(
        `${roomName} ${temp[1].toUpperCase()} - TABLE_VIEW`
      );
      break;
    case "EXTRA_VIEW":
      $(`#wd-${id} #title`).text(viewName);
      break;
    default:
      $(`#wd-${id} #title`).text(
        `${roomName} ${temp[2]} - ${temp[3].toUpperCase()}`
      );
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

      // if (comp1["id"] === undefined) {
      //   return
      // }
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
      if (viewName === "internal_view") {
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
    // if (viewName === "internal_view") {
    //   const handlesInfo = getAccHandlesInfo(view);
    //   for (let i in handlesInfo) {
    //     renderOutline(handlesInfo[i], id, "component")
    //   }

    //   //renderTexts(handlesInfo, id);
    // }
  }
};

// supplementary function: get handle info from corresponding front-view
const getAccHandlesInfo = (haView) => {
  const textObject = {};
  const id = haView.getID();
  let corresFrontViewID = id.split("+").slice(0, -1).join("+") + "+front_view";
  const roomView = state.roomViews.filter(
    (view) => view.getID() === corresFrontViewID
  );
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

    // accs.forEach((accessory) => {
    //   textObject[accessory] = accsPosition;
    // });

    // get Handles position & push to textObject
    shutters.forEach((shutter, id) => {
      const handle = shutter.getHandle();
      const handleName = handle["name"].concat(comp2["id"]) + id;
      const position = handle["outline"];
      textObject[handleName] = position;
    });
  });
  return textObject;
};
// render view name on footer table
const renderViewDetail = (projectInfo, view, id) => {
  const viewID = view.getID();
  $(`#wd-${id} .drawing-title`).text(`Drawing TITLE: ${viewID.split("+")[0]}`);
};

// render 'external' items inside view
const renderExternalItem = (view, id) => {
  const viewName = view.getName();
  const extItems = view.getExternalItems();
  console.log(viewName, 'View names')
  if (viewName === "room_top_view") {
    let compsCoords = {};
    extItems.forEach((item, id) => {
      const outline = item.getOutline();
      renderOutline(outline, id, "externItem");
      const ID = item.id;
      compsCoords[ID] = outline;


      const compID = item.id;
      const temp = {};
      temp[compID] = outline;
      renderTexts(temp, id);
    });


    const reducedDimens = removeRedun(compsCoords);

  }
  // const extItems = view.getExternalItems();
  // console.log(extItems, 'lol')
  // extItems.forEach((item) => {
  //   const outline = item.getOutline();
  //   renderOutline(outline, id, "externItem");
  // });


};

const renderExternalItems = (view, id) => {
  const extItems = view.getExternalItems();
  let compsCoords = {};
  // comp1
  i = 1
  extItems.forEach((item) => {
    const coords = item.getOutline();
    renderOutline(coords, id, "externItem");

    // render component dimensions(1)
    // const ID = item.getID();
    const ID = 'E-'.concat(i++)
    compsCoords[ID] = coords;

    // render component id( comp-1, comp-2, ...)
    // const compID = item.getID();
    const compID = ID
    const temp = {};
    temp[compID] = coords;
    renderTexts(temp, id);
  });
  // extItems.forEach((item) => {
  //   const outline = item.getOutline();
  //   renderOutline(outline, id, "externItem");
  //   let dict = {}
  //   dict[item.name] = outline;
  //   renderTexts(dict, id)
  // });
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
  renderOutline(handleOutline, id, "handle");

  // opening
  if (outline.length === 0) return; // exception handling( no data )
  const openDirection = shutter.getOpening();
  switch (openDirection) {
    case "right":
      midPt = outline[2].getMidPt();
      temp = outline[0].getCoords();
      lines = [new Edge(temp[0], midPt), new Edge(midPt, temp[1])];
      renderOutline(lines, id, "opening", [50, 50]);
      break;
    case "left":
      midPt = outline[0].getMidPt();
      temp = outline[2].getCoords();
      lines = [new Edge(temp[0], midPt), new Edge(midPt, temp[1])];
      renderOutline(lines, id, "opening", [50, 50]);
      break;
    case "down":
      midPt = outline[3].getMidPt();
      temp = outline[1].getCoords();
      lines = [new Edge(temp[0], midPt), new Edge(midPt, temp[1])];
      renderOutline(lines, id, "opening", [50, 50]);
      break;
    case "up":
      midPt = outline[1].getMidPt();
      temp = outline[3].getCoords();
      lines = [new Edge(temp[0], midPt), new Edge(midPt, temp[1])];
      renderOutline(lines, id, "opening", [50, 50]);
      break;
    case "sliding":
      // Todo: outline(8 edges)
      if (state.roomViews[id].getName() !== "front_view") break;
      const mids = outline.map((line) => line.getMidPt());
      const xs = mids.map((mid) => mid[0]);
      const ys = mids.map((mid) => mid[1]);
      const minx = Math.min(...xs);
      const maxx = Math.max(...xs);
      const miny = Math.min(...ys);
      const maxy = Math.max(...ys);
      const mid = [(minx + maxx) / 2, (miny + maxy) / 2];
      lines = [];
      lines.push(
        new Edge([mid[0] - 200, mid[1] - 40], [mid[0] + 200, mid[1] - 40])
      );
      lines.push(
        new Edge([mid[0] - 200, mid[1] + 40], [mid[0] + 200, mid[1] + 40])
      );
      lines.push(
        new Edge([mid[0] - 140, mid[1] - 100], [mid[0] - 200, mid[1] - 40])
      );
      lines.push(
        new Edge([mid[0] + 140, mid[1] + 100], [mid[0] + 200, mid[1] + 40])
      );
      renderOutline(lines, id, "opening", [30, 30]);
      break;
    case "pullout":
      lines = [
        new Edge(outline[0].getMidPt(), outline[1].getMidPt()),
        new Edge(outline[1].getMidPt(), outline[2].getMidPt()),
        new Edge(outline[2].getMidPt(), outline[3].getMidPt()),
        new Edge(outline[3].getMidPt(), outline[0].getMidPt()),
      ];
      renderOutline(lines, id, "opening", [50, 50]);
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
const renderOutline = (outline, id, type, dashPattern = [], view_name = '') => {
  const drawConfig = {
    view: { strokeStyle: "black", lineWidth: "8" },
    component: { strokeStyle: "red", lineWidth: "6" },
    handle: { strokeStyle: "DarkGreen", lineWidth: "6" },
    externItem: { strokeStyle: "gray", lineWidth: "8" },
    opening: { strokeStyle: "DarkGreen", lineWidth: "8" },
  };

  // Safety check - ensure canvas exists
  const canvas = document.querySelector(`#wd-${id} canvas`);
  if (!canvas) {
    console.warn(`Canvas #wd-${id} not found for renderOutline, skipping`);
    return;
  }
  
  const cx = canvas.getContext("2d");

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
  cx.editable = true;
  cx.selectable = true;
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
    let tempEdge = new Edge(
      [(xmin + xmax) / 2, ymin],
      [(xmin + xmax) / 2, ymax]
    );
    return tempEdge.getMidPt();
  }
};

// elementray function: render Text on canvas
const renderTexts = (textObject, id) => {
  if (!textObject || Object.keys(textObject) === 0) return;

  // Always render text if we have valid data - removed openNewJSON check
  const canvas = overlayCanvases[id];
  
  // Safety check - defer if canvas or viewBoxInfo not ready
  if (!canvas || !state.viewBoxInfo[id]) {
    // Defer text rendering until canvases are ready
    setTimeout(() => {
      if (overlayCanvases[id] && state.viewBoxInfo[id]) {
        renderTexts(textObject, id);
      }
    }, 200);
    return;
  }
  
  Object.keys(textObject).forEach((text) => {
    const outline = textObject[text];
    if (outline.length !== 0) {
      const center = getOutlineCenter(outline);
      if (text[0] == 'd' || text[0] == 'w') {
        text = text.slice(0, text.lastIndexOf(text.match(/[a-z]/ig)[text.match(/[a-z]/ig).length - 1]) + 1)
      }
      const canvasPos = CoordinateTransform.worldToCanvas(center[0], center[1], state.viewBoxInfo[id]);
      const textbox = new fabric.Textbox(text, {
        left: canvasPos.x,
        top: canvasPos.y,
        width: 40,
        fontSize: 11,
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
      canvas.selectable = true;
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
  if (!canvas) {
    console.warn(`Canvas #wd-${id} not found in renderDimensions, skipping`);
    return;
  }
  
  const cx = canvas.getContext("2d");
  cx.font = id == 0 ? "260px Arial" : "140px Arial";
  cx.textAlign = "center";

  cx.beginPath();
  cx.strokeStyle = "blue";
  cx.lineWidth = "4";
  cx.selectable = true;
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
        cx.fillText(
          dimension.label.toString(),
          position[0] - 200,
          -1 * (position[1] - 200)
        );
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
      cx.fillText(
        dimension.label.toString(),
        0,
        dimension.label.toString().length / 2
      );
      cx.restore();
    }
  });
  cx.selectable = true;
  cx.stroke();
  cx.closePath();
};

// render py dimens
const renderPyDimensions = (dimensions, id) => {
  // Safety check - skip only if essential data is missing
  const canvas = overlayCanvases[id];
  
  if (!canvas || !state.viewBoxInfo[id]) {
    console.warn(`Canvas or viewBoxInfo missing for id ${id}, skipping dimension rendering`);
    return;
  }
  
  console.log(`Rendering ${dimensions.length} dimensions for view ${id}`);
  
  const scale = state.viewBoxInfo[id]["scale"];
  const origin = [
    state.viewBoxInfo[id]["newOriginX"],
    state.viewBoxInfo[id]["newOriginY"],
  ];
  
  console.log(`View ${id} scale: ${scale}, origin: [${origin[0]}, ${origin[1]}]`);

  dimensions.forEach((dimension) => {
    let lineGroup;
    let pt1 = jsonCoords2fabricCoords(dimension.pt1, scale, origin);
    let pt2 = jsonCoords2fabricCoords(dimension.pt2, scale, origin);

    let line1 = new fabric.Line(
      [
        pt1[0] - 15 * scale,
        pt1[1] + 15 * scale,
        pt1[0] + 15 * scale,
        pt1[1] - 15 * scale,
      ],
      {
        left: pt1[0] - 15 * scale,
        top: pt1[1] - 15 * scale,
        stroke: "blue",
        strokeWidth: 2,
        evented: false,
        objectCaching: false,
        selectable: true
      }
    );
    let line2 = new fabric.Line(
      [
        pt2[0] - 15 * scale,
        pt2[1] + 15 * scale,
        pt2[0] + 15 * scale,
        pt2[1] - 15 * scale,
      ],
      {
        left: pt2[0] - 15 * scale,
        top: pt2[1] - 15 * scale,
        stroke: "blue",
        strokeWidth: 2,
        evented: false,
        objectCaching: false,
        selectable: true
      }
    );
    // if the dimension is < 200, just draw line
    /*Here we have enable that even if the dimension is > 5 we will draw
    the blue lines */
    if (Number(dimension.label) <= 10) { //
      let line3 = new fabric.Line([pt1[0], pt1[1], pt2[0], pt1[2]], {
        left: pt1[0],
        top: pt1[1],
        stroke: "blue",
        evented: false,
        objectCaching: false,
        selectable: true
      });
      lineGroup = new fabric.Group([line1, line2, line3]);
    }

    // else if the dimension is > 200, then draw 2 lines
    else {
      const midPts = getDimensionDrawPts(
        dimension,
        `${parseInt(15 / scale)}px`
      );

      const mid1 = jsonCoords2fabricCoords(midPts[0], scale, origin);
      const mid2 = jsonCoords2fabricCoords(midPts[1], scale, origin);
      const x1 = parseInt(mid1[0]);
      const y1 = parseInt(mid1[1]);
      const x2 = parseInt(mid2[0]);
      const y2 = parseInt(mid2[1]);
      let line3, line4;
      if (dimension.direction == "h") {
        line3 = new fabric.Line([pt1[0], pt1[1], mid1[0], mid1[1]], {
          left: pt1[0],
          top: pt1[1],
          stroke: "blue",
          evented: false,
          objectCaching: false,
          selectable: true
        });
        line4 = new fabric.Line([mid2[0], mid2[1], pt2[0], pt2[1]], {
          left: mid2[0],
          top: mid2[1],
          stroke: "blue",
          evented: false,
          objectCaching: false,
          selectable: true
        });
      } else {
        line3 = new fabric.Line([mid1[0], mid1[1], pt1[0], pt1[1]], {
          left: mid1[0],
          top: mid1[1],
          stroke: "blue",
          evented: false,
          objectCaching: false,
          selectable: true
        });
        line4 = new fabric.Line([pt2[0], pt2[1], mid2[0], mid2[1]], {
          left: pt2[0],
          top: pt2[1],
          stroke: "blue",
          evented: false,
          objectCaching: false,
          selectable: true
        });
      }
      if (x1 == x2 && y1 == y2 && Number(dimension.label) > 99) {
        lineGroup = new fabric.Group([line1, line2]);
      }
      else {
        lineGroup = new fabric.Group([line1, line2, line3, line4]);
      }

    }

    // let lineGroup = new fabric.Group([line1, line2]);
    lineGroup.setControlsVisibility({
      mtr: false,
      mt: false,
      mb: false,
      ml: false,
      mr: false,
      br: false,
      bl: false,
      tl: true,
      tr: true,
    });
    lineGroup.lockScalingX = true;
    lineGroup.lockScalingY = true;
    lineGroup.lockMovementX = false;
    lineGroup.lockMovementY = false;

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
    /*The value determines that if the dimension is greater than 80 it will be 
    displayed at the bottom of the dimension else in the center*/
    const textAligni = Number(dimension.label) > 99 ? "center" : "bottom"; //200
    const canvasPos = CoordinateTransform.worldToCanvas(position[0] - 20, position[1], state.viewBoxInfo[id]);
    const textbox = new fabric.Textbox(dimension.label.toString(), {
      left: canvasPos.x,
      top: canvasPos.y,
      width: 20,
      fontSize: 12,
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
      mtr: false,
      mt: false,
      mb: false,
      ml: false,
      mr: false,
      br: false,
      bl: false,
      tl: false,
      tr: false,
    });
    textbox.lockScalingX = true;
    textbox.lockScalingY = true;
    textbox.lockMovementX = false;
    textbox.lockMovementY = false;

    canvas.getObjects();
    canvas.add(textbox);
    canvas.selection = true;
    canvas.renderAll();
    canvas.calcOffset();
  });
  
  console.log(`Added ${dimensions.length} dimension objects to canvas ${id}. Total objects: ${canvas.getObjects().length}`);
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
  if (!matThumbnails) {
    return;
  }
  if (matThumbnails.length === 0) {
    return;
  }

  // get side-table element (check for both old and new table classes)
  let table = document.querySelector(`#wd-${id} .side-table`) || document.querySelector(`#wd-${id} .scoping-table`);
  
  // If no table found, skip rendering material thumbnails
  if (!table) {
    console.log('No table found for material thumbnails, skipping...');
    return;
  }

  // generate table head
  // const headData = ['', 'Finishes'];
  // generateTableHead(table, headData);

  // generate main content of table (no quantities)
  const data = [];
  Object.keys(matThumbnails).forEach((key) => {
    data.push({
      imageURL: matThumbnails[key]["image_url"],
      name: key,
    });
  });
  generateTable(table, data);
};

const generateTableHead = (table, data) => {
  let thead = table.createTHead();
  let row = thead.insertRow();
  row.setAttribute('style', 'background: #225ee5;color: #fff;letter-spacing: 1px;text-transform: capitalize;');
  for (let key of data) {
    let th = document.createElement("th");
    let text = document.createTextNode(key);
    th.appendChild(text);
    row.appendChild(th);
  }
};

const generateTable =
  (table, data) => {
    let tbody = document.createElement("tbody");
    let btn1 = ""
    // console.log(data, "all the data here")
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
        } else if(key === "materials") {
          for (materialKey of element[key]){
            cell.contentEditable = true;
            let text = document.createTextNode(materialKey.name);
            let img = document.createElement("img");
            img.style.width = "25px";
            img.style.height = "15px";
            img.style.display = "inline-flex";
            img.style.marginRight = "10px";
            img.style.marginBottom = "1px";
            img.src = materialKey.image_url;
            img.setAttribute("crossorigin", "*")
            let liTag = document.createElement("li");
            liTag.style.listStyle = "none";
            liTag.appendChild(img);
            liTag.appendChild(text);
            cell.appendChild(liTag);
          }
        } else {
          cell.contentEditable = true;
          let text = document.createTextNode(element[key]);
          cell.appendChild(text);
        }
      }
    }
    for (let i = 0; i < data.length; i++){
      if (data[i].hasOwnProperty("imageURL")){
        tbody.classList.add("finishes")
        let btn3 = document.createElement("button")
        btn3.innerHTML = "-"
        btn3.classList.add("delete-finish")
        table.appendChild(btn3)
        let tf = document.querySelector('.finishes')
        if (tf.rows.length > 1){
          btn3.onclick = () => {
            tf.deleteRow(tf.rows.length-1)
          }
        }else{
          btn3.onclick = () => {
            tf.deleteRow(tf.rows.length)
          }
        } 
      }
      break
    }
    for (let i = 0; i < data.length; i++){
      if (data[i].hasOwnProperty("id")){
        tbody.classList.add(`tabs${i}`)
        btn1 = document.createElement("button")
        btn1.innerHTML = "+"
        btn1.classList.add('add-row')
        let btn2 = document.createElement("button")
        btn2.innerHTML = "-"
        btn2.classList.add('delete-row')
        tbody.appendChild(btn1)
        btn1.onclick = () => {
          tbody.appendChild(btn2)
          let tb = document.querySelector('.tabs')
          let tc = document.querySelector('.tabs').rows[0].cells.length
          let tr = tb.rows.length
          let row = tb.insertRow(data.length)
          for (let j = 0; j < tc; j++){
            let cell1 = row.insertCell(j)
            cell1.contentEditable = true
            cell1.style.height = "30px"
          }
          if (tr > data.length){
            btn2.onclick = () => {
              tb.deleteRow(data.length)
            }
          }
        }
        break
      }
    }
  };

// render 'TableView'
const renderTableView = (tableView, id) => {
  const compsInfo = tableView.getCompsInfo();
  // get handle of view container and clean the innerHTML of container
  const container = document.querySelector(`#wd-${id} .canvas-container`);
  
  // Safety check - if container doesn't exist, skip rendering
  if (!container) {
    console.warn(`TableView container #wd-${id} not found, skipping table rendering`);
    return;
  }

  //container.style.overflow = "auto";

  // create table
  let table = document.createElement("table");

  // table.style.width = "100%";

  // table.style.height = "100%";
  // table.style.fontSize = '8px';
  // table.style.wordWrap = 'break-word';
  // table.style.wordBreak = 'break-all';
  // table.setAttribute('style', 'width:75px;height:75px;');
  table.setAttribute('style', 'display:inline-table;overflow-y:scroll;font-size:10px;width:100%;text-align:center;');
  table.setAttribute("border", "1");
  // table.classList.add("main-table");
  table.classList.add("table-responsive");
  //canvas width and height- console.log
  /*console.log(container.clientHeight, container.clientWidth);
 
  //font size of the text
  var multiply = container.clientHeight * container.clientWidth;
 
  if (multiply / 4 < 6) {
 
    table.style.fontSize = "6px";
  } else if (multiply / 4 >= 6 && multiply / 4 < 12) {
    table.style.fontSize = multiply / 4 + 'px';
  } else {
    table.style.fontSize = '8px';
  }*/


  //console.log(compsInfo);
  //console.log(compsInfo.length);


  // generate table head
  const headData = ["S.No", ...Object.keys(compsInfo[0])];
  // console.log(headData, 'Head Data')
  generateTableHead(table, headData);

  // reorder compsInfo array
  compsInfo.sort(function (a, b) {
    return Number(a.id.replace(/\D/g, "")) - Number(b.id.replace(/\D/g, ""));
  });

  // generate main content of table
  const data = [];
  compsInfo.sort((a, b) => a.id - b.id);
  compsInfo.forEach((item, id) => {
    data.push({
      no: id + 1,
      ...item,
    });
  });
  for (data_temp in data) {
    let str = data[data_temp].name
    data[data_temp].name = str.slice(0, str.lastIndexOf(str.match(/./ig)[str.match(/./ig).length - 1]) + 1)
  }

  //change the text size 6 px 
  generateTable(table, data);



  // add table to container
  const canvasElement = document.querySelector(`#wd-${id} .canvas-container canvas`);
  if (canvasElement && container) {
    container.replaceChild(table, canvasElement);
    container.style.pointerEvents = "all";
  } else {
    console.warn(`Canvas element not found for #wd-${id}, appending table directly`);
    if (container) {
      container.innerHTML = '';
      container.appendChild(table);
      container.style.pointerEvents = "all";
    }
  }
};

// elementary function: get drawing points for dimension
const getDimensionDrawPts = (dimension, fontStr) => {
  const fontSize = Number(fontStr.replace(/[^0-9]/g, ""));
  const charCnt = dimension.label.toString().length - 1;
  const charLength = fontSize * charCnt;
  const dimenLength = Number(dimension.label);
  let offset1 = 0
  let offset2 = 0
  if (charLength < dimenLength) {
    offset1 = (dimenLength - charLength) / 2;
    offset2 = (dimenLength + charLength) / 2;
  }
  // const offset1 = (dimenLength - charLength) / 2;
  // const offset2 = (dimenLength + charLength) / 2;
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
  // Using CoordinateTransform utility for consistency
  const viewBoxInfo = { scale, newOriginX: origin[0], newOriginY: origin[1] };
  const canvasPos = CoordinateTransform.worldToCanvas(pos[0], pos[1], viewBoxInfo);
  return [canvasPos.x, canvasPos.y];
};

// Render Handle Data
const renderHandleData = (handleDetail, id) => {
  if (!handleDetail) {
    return;
  }
  if (handleDetail.length === 0) {
    return;
  }
  // get side-table element (check for both old and new table classes)
  let table = document.querySelector(`#wd-${id} .side-Handletable`) || document.querySelector(`#wd-${id} .scoping-table`);
  
  // If no table found, skip rendering handle data
  if (!table) {
    console.log('No table found for handle data, skipping...');
    return;
  }

  // generate table head
  // const headData = ['Component', 'Handle/KNOB'];
  // generateTableHead(table, headData);

  // Generate table data with component names (no quantities)
  const data = [];
  handleDetail.forEach((item) => {
    data.push({
      component: item.component,
      handle: item.handle,
    });
  });
  generateTable(table, data);
};
/**
 * ViewRenderer - Centralized rendering module
 * 
 * This module consolidates all rendering logic that was previously duplicated
 * between script.js and modal.js. By having a single source of truth for rendering,
 * we eliminate:
 * - ~500 lines of duplicated code
 * - The need to update two files for every change
 * - Synchronization bugs between script.js and modal.js
 * 
 * Usage:
 *   const renderer = new ViewRenderer(state, openNewJSON);
 *   renderer.renderAll();
 */

class ViewRenderer {
  constructor(state, openNewJSON = false) {
    this.state = state;
    this.openNewJSON = openNewJSON;
    this.filteredViews = [];
  }

  /**
   * Main rendering orchestrator - called by both script.js and modal.js
   */
  renderAll() {
    // Validate state
    if (!this.state || Object.keys(this.state).length === 0) {
      console.warn('ViewRenderer: No state data available');
      return;
    }

    // Clear existing content
    this.clearMainContainer();

    // Filter views (removes excluded types/names)
    this.filterAndUpdateState();

    // Render project info containers
    this.renderProjectInfo();

    // Reset calibration flag
    window._canvasesCalibrated = false;

    // Wait for DOM to be ready, then render views
    setTimeout(() => {
      // First render the main views (this creates the main canvases)
      this.renderViews();
      
      // Then initialize overlay canvases (this must happen after main canvases are created)
      this.initializeOverlayCanvases();
      
      // Finally render dimensions (this needs overlay canvases to exist)
      this.renderDimensions();
    }, CONFIG.TIMING.DOM_READY_DELAY);
  }

  /**
   * Clear the main container
   */
  clearMainContainer() {
    const mainContainer = document.querySelector(".main");
    if (mainContainer) {
      mainContainer.innerHTML = ``;
    }
  }

  /**
   * Filter views and update state with filtered data
   */
  filterAndUpdateState() {
    // Filter out excluded view types and names
    this.filteredViews = this.state.views.filter(viewData => {
      const isExcluded = CONFIG.VIEW_FILTERS.EXCLUDED_TYPES.includes(viewData.view.type) || 
                        CONFIG.VIEW_FILTERS.EXCLUDED_NAMES.includes(viewData.view.getName());
      return !isExcluded;
    });

    // Update state with filtered views
    this.state.views = this.filteredViews;

    // Keep backward compatibility - update legacy arrays
    this.state.roomViews = this.filteredViews.map(v => v.view);
    this.state.viewBoxInfo = this.filteredViews.map(v => v.viewBoxInfo);
    this.state.dimens = this.filteredViews.map(v => v.dimensions);
  }

  /**
   * Render project info containers
   */
  renderProjectInfo() {
    renderProjectInfo(this.state.projectInfo, this.filteredViews.length);
  }

  /**
   * Render all views (FloorPlan, RoomSubView, TableView, etc.)
   */
  renderViews() {
    this.filteredViews.forEach((viewData, id) => {
      const view = viewData.view;

      // Calibrate canvases on first view render
      if (id === 0 && !window._canvasesCalibrated) {
        calibrateCanvases(this.state.viewBoxInfo);
        window._canvasesCalibrated = true;
      }

      // Render based on view type
      if (view.type === "FloorPlanView") {
        this.renderFloorPlanView(view, id);
      } else {
        this.renderSubView(view, id);
      }
    });
  }

  /**
   * Render a floor plan view
   */
  renderFloorPlanView(view, id) {
    renderFloorPlan(view, id);
  }

  /**
   * Render a sub-view (RoomSubView, TableView, etc.)
   */
  renderSubView(view, id) {
    const currentRoom = view.id.split('+')[0];
    const currentView = view.id.split('+')[1];
    
    // Set global variables (for backward compatibility with existing functions)
    window.currentRoom = currentRoom;
    window.currentView = currentView;

    // Render the main view
    renderView(this.state.projectInfo, view, id);

    // Render material thumbnails and handle data
    this.renderMaterialAndHandleData(currentRoom, currentView, id);
  }

  /**
   * Render material thumbnails and handle data for a view
   */
  renderMaterialAndHandleData(currentRoom, currentView, id) {
    for (const roomKey in this.state.rooms) {
      if (roomKey === currentRoom) {
        const room = this.state.rooms[roomKey];
        
        for (const viewKey in room) {
          if (viewKey === currentView) {
            const viewData = room[viewKey];
            
            // Render material thumbnails
            const materialThumbnails = viewData["material_thumbnails"];
            if (materialThumbnails && Object.keys(materialThumbnails).length > 0) {
              renderMaterialThumbnails(materialThumbnails, id);
            }
          }
        }
      }
    }

    // Extract and render handle data (more complex logic)
    let handleData = [];
    
    for (const roomKey in this.state.rooms) {
      if (roomKey === currentRoom) {
        const room = this.state.rooms[roomKey];
        
        for (const viewKey in room) {
          if (viewKey === currentView) {
            const frontView = room[viewKey]["front_view"];
            if (frontView) {
              const lib = frontView["floor_components"]["library"];
              
              Object.keys(lib).forEach(comp => {
                const shutter = lib[comp]["external_points"]["shutter"];
                if (shutter !== undefined) {
                  Object.keys(shutter).forEach(shtr => {
                    const handleName = shutter[shtr]["handle"]["name"];
                    if (handleName !== undefined) {
                      handleData.push({
                        component: comp,
                        handle: handleName
                      });
                    }
                  });
                }
              });
              
              renderHandleData(handleData, id);
            }
          }
        }
      }
    }
  }

  /**
   * Initialize overlay canvases for all views
   */
  initializeOverlayCanvases() {
    // Find all overlay canvas containers
    const overlayCanvasContainers = document.querySelectorAll(".overlay-canvas-container");
    console.log('Overlay canvas containers found:', overlayCanvasContainers.length);

    // Get dimensions from first main canvas
    const firstMainCanvas = document.querySelector("#wd-0 canvas");
    const w = firstMainCanvas ? firstMainCanvas.offsetWidth : 0;
    const h = firstMainCanvas ? firstMainCanvas.offsetHeight : 0;
    console.log('Main canvas dimensions:', w, 'x', h);

    // Clear existing overlay canvases (use global variable)
    // Make sure we're working with the global overlayCanvases array
    if (typeof window.overlayCanvases === 'undefined') {
      window.overlayCanvases = [];
    }
    window.overlayCanvases = [];

    // Create Fabric.js canvas for each container
    // Important: overlayCanvasContainers are in DOM order, which matches filteredViews order
    overlayCanvasContainers.forEach((container, id) => {
      const canvasId = `c#${id}`;
      
      // Use getElementById for IDs with special characters like #
      let canvas = document.getElementById(canvasId);

      // Create canvas element if it doesn't exist
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = canvasId;
        canvas.className = 'overlay-canvas-container';
        container.appendChild(canvas);
      }

      // Set canvas dimensions
      canvas.setAttribute("width", w);
      canvas.setAttribute("height", h);
      canvas.style.imageRendering = CONFIG.CANVAS.IMAGE_RENDERING;

      // Create Fabric.js canvas instance
      const canv = new fabric.Canvas(canvasId, {
        backgroundColor: CONFIG.CANVAS.BACKGROUND_COLOR,
        selection: CONFIG.CANVAS.SELECTION_ENABLED
      });

      canv.setHeight(h);
      canv.setWidth(w);

      // Load existing JSON data if available
      if (!this.openNewJSON && canvasJSONs[id]) {
        const json = JSON.parse(canvasJSONs[id]);
        if (json && json.objects && json.objects.length > 0) {
          canv.loadFromJSON(json, CallBack, function (o, object) {
            canv.setActiveObject(object);
          });
        }
      }

      // Add to global array at the correct index
      window.overlayCanvases[id] = canv;
    });

    console.log('Overlay canvases created:', window.overlayCanvases.length);
  }

  /**
   * Render dimensions for all views
   */
  renderDimensions() {
    if (!this.openNewJSON) return;

    this.filteredViews.forEach((viewData, id) => {
      const view = viewData.view;
      const dimensions = viewData.dimensions;
      const viewName = view.getName();

      // Skip table views (they don't have dimensions)
      if (viewName !== "table_view") {
        renderPyDimensions(dimensions, id);
      }
    });
  }
}

// Export for use in script.js and modal.js
// (In ES5/browser environment, this is attached to window)
if (typeof window !== 'undefined') {
  window.ViewRenderer = ViewRenderer;
}


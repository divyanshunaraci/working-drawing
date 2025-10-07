/**
 * Utility Functions for Working Drawing Application
 * 
 * Provides reusable helper functions for coordinate transformations,
 * canvas operations, and common calculations.
 */

/**
 * Coordinate Transformation Utilities
 * Handles conversion between world coordinates (from JSON) and canvas coordinates
 */
const CoordinateTransform = {
  /**
   * Convert world coordinates to canvas pixel coordinates
   * @param {number} worldX - X coordinate in world space (mm)
   * @param {number} worldY - Y coordinate in world space (mm)
   * @param {Object} viewBoxInfo - ViewBox information containing scale and origin
   * @param {number} [dpi] - Device pixel ratio (defaults to window.devicePixelRatio)
   * @returns {{x: number, y: number}} Canvas coordinates in pixels
   */
  worldToCanvas(worldX, worldY, viewBoxInfo, dpi = window.devicePixelRatio) {
    const scale = viewBoxInfo.scale;
    const originX = viewBoxInfo.newOriginX;
    const originY = viewBoxInfo.newOriginY;
    
    return {
      x: ((worldX + originX) * scale) / dpi,
      y: ((-worldY + originY) * scale) / dpi  // Y is inverted
    };
  },
  
  /**
   * Convert canvas pixel coordinates back to world coordinates
   * @param {number} canvasX - X coordinate on canvas (pixels)
   * @param {number} canvasY - Y coordinate on canvas (pixels)
   * @param {Object} viewBoxInfo - ViewBox information containing scale and origin
   * @param {number} [dpi] - Device pixel ratio (defaults to window.devicePixelRatio)
   * @returns {{x: number, y: number}} World coordinates in mm
   */
  canvasToWorld(canvasX, canvasY, viewBoxInfo, dpi = window.devicePixelRatio) {
    const scale = viewBoxInfo.scale;
    const originX = viewBoxInfo.newOriginX;
    const originY = viewBoxInfo.newOriginY;
    
    return {
      x: (canvasX * dpi) / scale - originX,
      y: -((canvasY * dpi) / scale - originY)  // Y is inverted
    };
  },
  
  /**
   * Get center point of an outline
   * @param {Array<Array<Array<number>>>} outline - Array of edge point arrays
   * @returns {[number, number]} Center point [x, y]
   */
  getOutlineCenter(outline) {
    if (!outline || outline.length === 0) {
      return [0, 0];
    }
    
    let xmin = Infinity;
    let xmax = -Infinity;
    let ymin = Infinity;
    let ymax = -Infinity;
    
    outline.forEach(edge => {
      edge.forEach(point => {
        const x = point[0];
        const y = point[1];
        xmin = Math.min(xmin, x);
        xmax = Math.max(xmax, x);
        ymin = Math.min(ymin, y);
        ymax = Math.max(ymax, y);
      });
    });
    
    return [(xmin + xmax) / 2, (ymax + ymin) / 2];
  },
  
  /**
   * Get midpoint between two points
   * @param {[number, number]} point1 - First point [x, y]
   * @param {[number, number]} point2 - Second point [x, y]
   * @returns {[number, number]} Midpoint [x, y]
   */
  getMidpoint(point1, point2) {
    return [
      (point1[0] + point2[0]) / 2,
      (point1[1] + point2[1]) / 2
    ];
  }
};

/**
 * Canvas Utilities
 * Helper functions for working with HTML5 Canvas and Fabric.js
 */
const CanvasUtils = {
  /**
   * Get the main canvas element for a view
   * @param {number} viewId - View index
   * @returns {HTMLCanvasElement|null} Canvas element or null if not found
   */
  getMainCanvas(viewId) {
    const canvas = document.querySelector(`#wd-${viewId} canvas`);
    if (!canvas) {
      console.warn(`Main canvas #wd-${viewId} not found`);
    }
    return canvas;
  },
  
  /**
   * Get the overlay (Fabric.js) canvas for a view
   * @param {number} viewId - View index
   * @param {Array} overlayCanvasesArray - Global overlayCanvases array
   * @returns {fabric.Canvas|null} Fabric canvas or null if not found
   */
  getOverlayCanvas(viewId, overlayCanvasesArray) {
    const canvas = overlayCanvasesArray[viewId];
    if (!canvas) {
      console.warn(`Overlay canvas ${viewId} not found`);
    }
    return canvas;
  },
  
  /**
   * Check if canvas and viewBoxInfo are ready for rendering
   * @param {number} viewId - View index
   * @param {Array} overlayCanvasesArray - Global overlayCanvases array
   * @param {Array} viewBoxInfoArray - ViewBoxInfo array
   * @returns {boolean} True if ready, false otherwise
   */
  isCanvasReady(viewId, overlayCanvasesArray, viewBoxInfoArray) {
    return !!(overlayCanvasesArray[viewId] && viewBoxInfoArray[viewId]);
  },
  
  /**
   * Get canvas context with viewBoxInfo
   * @param {number} viewId - View index
   * @param {Array} overlayCanvasesArray - Global overlayCanvases array
   * @param {Array} viewBoxInfoArray - ViewBoxInfo array
   * @returns {{canvas: fabric.Canvas, viewBoxInfo: Object}|null} Canvas context or null
   */
  getCanvasContext(viewId, overlayCanvasesArray, viewBoxInfoArray) {
    if (!this.isCanvasReady(viewId, overlayCanvasesArray, viewBoxInfoArray)) {
      return null;
    }
    
    return {
      canvas: overlayCanvasesArray[viewId],
      viewBoxInfo: viewBoxInfoArray[viewId]
    };
  }
};

/**
 * Fabric.js Object Creation Utilities
 * Simplifies creation of common Fabric.js objects with default settings
 */
const FabricUtils = {
  /**
   * Create a standard textbox with common settings
   * @param {string} text - Text content
   * @param {number} left - Left position (canvas coordinates)
   * @param {number} top - Top position (canvas coordinates)
   * @param {Object} [options={}] - Additional Fabric.js textbox options
   * @returns {fabric.Textbox} Configured textbox
   */
  createTextbox(text, left, top, options = {}) {
    const textbox = new fabric.Textbox(text, {
      left: left,
      top: top,
      width: options.width || 40,
      fontSize: options.fontSize || 11,
      textAlign: options.textAlign || "center",
      originX: options.originX || "center",
      originY: options.originY || "center",
      borderColor: options.borderColor || "green",
      editingBorderColor: options.editingBorderColor || "orange",
      showTextBoxBorder: options.showTextBoxBorder !== false,
      textboxBorderColor: options.textboxBorderColor || "green",
      backgroundColor: options.backgroundColor || "transparent",
      objectCaching: options.objectCaching !== undefined ? options.objectCaching : false,
      fill: options.fill || "rgb(0,0,0)",
      ...options
    });
    
    // Set control visibility
    textbox.setControlsVisibility({
      mt: false,
      mb: false,
      br: false,
      bl: false,
      tl: false,
      tr: false
    });
    
    textbox.lockScalingY = true;
    
    return textbox;
  },
  
  /**
   * Create a dimension line
   * @param {[number, number]} point1 - Start point [x, y]
   * @param {[number, number]} point2 - End point [x, y]
   * @param {Object} [options={}] - Additional line options
   * @returns {fabric.Line} Configured line
   */
  createDimensionLine(point1, point2, options = {}) {
    return new fabric.Line([point1[0], point1[1], point2[0], point2[1]], {
      stroke: options.stroke || "#ff0000",
      strokeWidth: options.strokeWidth || 1,
      selectable: options.selectable !== undefined ? options.selectable : false,
      ...options
    });
  },
  
  /**
   * Add object to canvas and render
   * @param {fabric.Canvas} canvas - Fabric canvas
   * @param {fabric.Object|Array<fabric.Object>} objects - Object(s) to add
   * @param {boolean} [render=true] - Whether to render immediately
   */
  addAndRender(canvas, objects, render = true) {
    if (Array.isArray(objects)) {
      objects.forEach(obj => canvas.add(obj));
    } else {
      canvas.add(objects);
    }
    
    if (render) {
      canvas.renderAll();
      canvas.calcOffset();
    }
  }
};

/**
 * View Filtering Utilities
 */
const ViewUtils = {
  /**
   * Check if a view should be excluded from rendering
   * @param {Object} view - View object
   * @param {Array<string>} excludedTypes - Array of excluded type names
   * @param {Array<string>} excludedNames - Array of excluded view names
   * @returns {boolean} True if view should be excluded
   */
  shouldExcludeView(view, excludedTypes, excludedNames) {
    return excludedTypes.includes(view.type) || 
           excludedNames.includes(view.getName());
  },
  
  /**
   * Filter views and related arrays while maintaining index synchronization
   * @param {Object} state - Global state object with roomViews, viewBoxInfo, dimens
   * @param {Array<string>} excludedTypes - View types to exclude
   * @param {Array<string>} excludedNames - View names to exclude
   * @returns {{views: Array, viewBoxInfo: Array, dimensions: Array}} Filtered arrays
   */
  filterViewsWithSync(state, excludedTypes, excludedNames) {
    const filtered = {
      views: [],
      viewBoxInfo: [],
      dimensions: []
    };
    
    state.roomViews.forEach((view, idx) => {
      const isExcluded = this.shouldExcludeView(view, excludedTypes, excludedNames);
      
      if (!isExcluded) {
        filtered.views.push(view);
        if (state.viewBoxInfo[idx]) filtered.viewBoxInfo.push(state.viewBoxInfo[idx]);
        if (state.dimens[idx]) filtered.dimensions.push(state.dimens[idx]);
      }
    });
    
    return filtered;
  }
};

/**
 * DOM Utilities
 */
const DOMUtils = {
  /**
   * Safely query selector with error handling
   * @param {string} selector - CSS selector
   * @param {Element} [parent=document] - Parent element to search within
   * @returns {Element|null} Found element or null
   */
  safeQuerySelector(selector, parent = document) {
    try {
      return parent.querySelector(selector);
    } catch (error) {
      console.error(`Error querying selector "${selector}":`, error);
      return null;
    }
  },
  
  /**
   * Safely query all elements
   * @param {string} selector - CSS selector
   * @param {Element} [parent=document] - Parent element to search within
   * @returns {NodeList} Found elements (empty if error)
   */
  safeQuerySelectorAll(selector, parent = document) {
    try {
      return parent.querySelectorAll(selector);
    } catch (error) {
      console.error(`Error querying selector "${selector}":`, error);
      return [];
    }
  }
};

// Export for use in other files (if using modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CoordinateTransform,
    CanvasUtils,
    FabricUtils,
    ViewUtils,
    DOMUtils
  };
}


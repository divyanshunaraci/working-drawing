/**
 * Configuration Constants for Working Drawing Application
 * 
 * Centralizes all magic numbers, delays, colors, and settings
 * for easier maintenance and consistency across the codebase.
 */

const CONFIG = {
  // Timing constants (in milliseconds)
  TIMING: {
    DOM_READY_DELAY: 100,        // Wait for DOM after creating containers
    DEFER_RETRY_DELAY: 200,      // Wait before retrying deferred rendering
    LOADING_MESSAGE_DELAY: 3000, // Show "Processing JSON" message delay
    MAX_DEFER_RETRIES: 5         // Maximum attempts for deferred operations
  },
  
  // Canvas settings
  CANVAS: {
    BACKGROUND_COLOR: "rgba(0, 0, 0, 0)",  // Transparent background
    POINTER_EVENTS: "all",                  // Enable interaction
    SELECTION_ENABLED: true,                // Allow object selection
    IMAGE_RENDERING: "crisp-edges"          // Prevent blur
  },
  
  // Text rendering settings
  TEXT: {
    DEFAULT_SIZE: 11,              // Default font size
    DEFAULT_WIDTH: 40,             // Default text box width
    ALIGN: "center",               // Text alignment
    BORDER_COLOR: "green",         // Text box border color
    EDIT_BORDER_COLOR: "orange",   // Border when editing
    BACKGROUND: "transparent",     // Text background
    SHOW_BORDER: true,             // Show text box border
    ORIGIN_X: "center",            // Horizontal origin
    ORIGIN_Y: "center"             // Vertical origin
  },
  
  // Room name text settings (Ground Floor Plan)
  ROOM_NAME_TEXT: {
    SIZE: 12,                      // Slightly larger than component text
    WIDTH: 40,
    X_OFFSET: -30                  // Offset from room center
  },
  
  // Dimension settings
  DIMENSIONS: {
    LINE_COLOR: "#ff0000",         // Red dimension lines
    LINE_WIDTH: 1,                 // Line thickness
    TEXT_SIZE: 11,                 // Dimension text size
    ARROW_SIZE: 10,                // Arrow head size (if used)
    EXTENSION_LINE_OFFSET: 5       // Gap between object and extension line
  },
  
  // Floor plan outline settings
  FLOOR_PLAN: {
    OUTLINE_COLOR: "black",
    OUTLINE_WIDTH: 16,
    OUTLINE_STYLE: "black"
  },
  
  // View filtering
  VIEW_FILTERS: {
    EXCLUDED_NAMES: ["render_wall_view"],  // View names to exclude
    EXCLUDED_TYPES: ["ImageView"]          // View types to exclude
  },
  
  // View types (for identification)
  VIEW_TYPES: {
    FLOOR_PLAN: "FloorPlanView",
    ROOM_SUB: "RoomSubView",
    TABLE: "TableView",
    IMAGE: "ImageView",
    RENDER: "RenderView"
  },
  
  // View names (for checking)
  VIEW_NAMES: {
    ROOM_TOP: "room_top_view",
    TOP: "top_view",
    FRONT: "front_view",
    INTERNAL: "internal_view",
    TABLE: "table_view",
    RENDER_WALL: "render_wall_view",
    EXTRA: "EXTRA_VIEW"
  },
  
  // Fabric.js text box control visibility
  TEXT_CONTROLS: {
    mt: false,  // Middle top
    mb: false,  // Middle bottom
    mr: false,  // Middle right
    ml: false,  // Middle left
    br: false,  // Bottom right
    bl: false,  // Bottom left
    tl: false,  // Top left
    tr: false   // Top right
  },
  
  // API endpoints
  API: {
    JSON_VALIDATION: "http://localhost:4000/json",
    PROJECT_DATA: "http://3.7.252.246:5000/api/project/wdProject"
  },
  
  // Selectors (commonly used)
  SELECTORS: {
    MAIN_CONTAINER: ".main",
    OVERLAY_CANVAS_CONTAINER: ".overlay-canvas-container",
    CANVAS_CONTAINER: ".canvas-container",
    WORKING_DRAWING: ".working-drawing"
  },
  
  // IDs patterns
  ID_PATTERNS: {
    WORKING_DRAWING: "wd-",      // wd-0, wd-1, etc.
    OVERLAY_CANVAS: "c#",        // c#0, c#1, etc.
    MAIN_CANVAS: "checks"        // Main canvas ID
  },
  
  // Logging flags (for debugging)
  DEBUG: {
    SHOW_FILTER_COUNTS: true,
    SHOW_CANVAS_CREATION: true,
    SHOW_VIEW_RENDERING: true,
    SHOW_DIMENSION_COUNTS: true,
    SHOW_DEFERRED_TASKS: true,
    SHOW_TEXT_PROPERTIES: true
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}


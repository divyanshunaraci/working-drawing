# Working Drawing - Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Data Flow](#data-flow)
4. [State Management](#state-management)
5. [Rendering Pipeline](#rendering-pipeline)
6. [Canvas System](#canvas-system)
7. [View Types](#view-types)
8. [Critical Timing Issues](#critical-timing-issues)
9. [Common Pitfalls](#common-pitfalls)
10. [File Reference](#file-reference)

---

## System Overview

This is a web-based working drawing visualization system that:
- Takes JSON input containing architectural floor plans and room elevations
- Renders interactive 2D views with dimensions, text labels, and material information
- Uses HTML5 Canvas API for drawing and Fabric.js for interactive overlays
- Supports PDF generation and editing capabilities

### Technology Stack
- **Frontend**: Vanilla JavaScript, jQuery
- **Canvas Libraries**: HTML5 Canvas API, Fabric.js
- **Backend**: Python server (serves static files and processes JSON)
- **UI Framework**: Bootstrap 4

---

## Architecture

### Frontend Structure

```
pyserver/static/
├── js/
│   ├── base.js           # Base utility functions
│   ├── model.js          # Data parsing and model creation
│   ├── view.js           # Core rendering functions
│   ├── script.js         # Main orchestration and event handling
│   ├── modal.js          # Modal rendering (mirrors script.js logic)
│   ├── misc.js           # Miscellaneous utilities
│   └── constantConfig.js # Configuration constants
├── css/
│   ├── style.css         # Main styles
│   ├── sidebar.css       # Sidebar styles
│   └── modal.css         # Modal styles
└── wdPdf.html           # Main HTML template
```

### Key Files and Their Roles

| File | Primary Responsibility | Key Functions |
|------|----------------------|---------------|
| `model.js` | Parse JSON data into view objects | `handleView`, `handleViewDimens`, `getFloorPlan`, `getRoomObjects` |
| `view.js` | Render individual view components | `renderFloorPlan`, `renderView`, `renderTexts`, `renderPyDimensions` |
| `script.js` | Orchestrate rendering, handle events | `renderAll`, `parseJSON`, `readJSON` |
| `modal.js` | Handle modal popups (mirrors script.js) | Same as script.js but for modal context |

---

## Data Flow

### 1. JSON Upload Flow

```
User uploads JSON file
    ↓
readJSON() (script.js)
    ↓
Send to Python backend: POST /json
    ↓
Backend validates and returns processed data
    ↓
parseJSON() - Parse into state object
    ↓
renderAll() - Render all views
```

### 2. Parsing Flow (parseJSON)

```
parseJSON(parsedData)
    ↓
getProjectInfo() → state.projectInfo
    ↓
getFloorPlan() → state.roomViews[0] (FloorPlanView)
                 state.roomNames
                 state.dimens[0]
                 state.viewBoxInfo[0]
    ↓
getRoomDetails() → state.matThumbnails
                   state.rooms (nested object)
    ↓
getRoomObjects() → Additional views (RoomSubView, TableView, etc.)
                   Additional dimens
                   Additional viewBoxInfo
    ↓
state.roomViews = [FloorPlanView, ...subViews]
state.dimens = [floorPlanDimens, ...subViewDimens]
state.viewBoxInfo = [floorPlanViewBox, ...subViewBoxes]
```

### 3. Rendering Flow (renderAll)

```
renderAll()
    ↓
Filter out RenderView/ImageView pages
    ↓
Create synchronized filtered arrays:
  - filteredViews
  - filteredViewBoxInfo
  - filteredDimens
    ↓
Replace state arrays with filtered versions
    ↓
renderProjectInfo() - Create page containers
    ↓
setTimeout(100ms) - Wait for DOM to be ready
    ↓
For each view:
  - Calibrate canvases (first view only)
  - Render based on view type:
    * FloorPlanView → renderFloorPlan()
    * RoomSubView → renderView()
    * TableView → renderTableView()
    ↓
Initialize overlay canvases (Fabric.js)
    ↓
Render dimensions (renderPyDimensions)
    ↓
Deferred text rendering executes (200ms delay)
```

---

## State Management

### Global State Object

The `state` object is the central data store:

```javascript
state = {
  projectInfo: {
    project_no: string,
    client_name: string,
    designer_name: string,
    location_name: string,
    // ... other project metadata
  },
  
  roomViews: [
    FloorPlanView,      // Index 0: Ground floor plan
    RoomSubView,        // Index 1+: front_view, internal_view, etc.
    TableView,          // Table views
    // Note: RenderView/ImageView are filtered out
  ],
  
  viewBoxInfo: [
    {
      x0, y0, xn, yn,     // Bounding box
      length, breadth,
      scale,              // Scaling factor
      newOriginX,         // Transformed origin X
      newOriginY,         // Transformed origin Y
    },
    // ... one per view (synchronized with roomViews)
  ],
  
  dimens: [
    [                     // Array of dimension objects per view
      {
        dim_line: [[x1,y1], [x2,y2]],
        extn_lines: [...]
        dim_text: "1200",
        text_pos: [x, y],
      },
      // ...
    ],
    // ... one array per view (synchronized with roomViews)
  ],
  
  rooms: {
    "RoomName": {
      "room_top_view": { ... },
      "view_2": {
        "front_view": { ... },
        "internal_view": { ... },
        "table_view": { ... },
      },
      // ...
    },
    // ...
  },
  
  matThumbnails: { ... },
  roomNames: ["RoomName1", "RoomName2", ...],
  spaceNamesData: [ ... ]
}
```

### Critical State Array Synchronization

**IMPORTANT**: The following arrays MUST be synchronized by index:
- `state.roomViews[i]` - The view object
- `state.viewBoxInfo[i]` - Viewport information for that view
- `state.dimens[i]` - Dimensions for that view
- `overlayCanvases[i]` - Fabric.js canvas for that view

**When filtering views**, ALL arrays must be filtered together to maintain index alignment.

### Global Variables

```javascript
// script.js and modal.js
var state = {};                    // Main data store
var currentRoom = '';              // Currently rendering room name
var currentView = '';              // Currently rendering view name
var overlayCanvasContainers = [];  // DOM canvas elements
var overlayCanvases = [];          // Fabric.js canvas instances
var w = 0;                         // Canvas width
var h = 0;                         // Canvas height
var canvasJSONs = [];              // Saved canvas states for restore
var openNewJSON = false;           // Flag: new JSON loaded
var currentPageNumber = 1;         // Current page in view

// Calibration
window._canvasesCalibrated = false; // Flag: canvases calibrated
window._originalViewBoxInfo = [];   // Backup of original viewBoxInfo
window._originalDimens = [];        // Backup of original dimens
```

---

## Rendering Pipeline

### Phase 1: Data Parsing (model.js)

#### View Object Creation

Views are created from JSON data in `model.js`:

```javascript
// In handleView()
if (viewType.includes("room_top_view")) {
  view = new FloorPlanView(id, name, outline, roomNamePos, roomTopView);
}
else if (name === "render_wall_view") {
  view = new RenderView(id, name, imageURL);  // FILTERED OUT
}
else {
  view = new RoomSubView(id, name, outline, openings, texts, components, externalItems);
}
```

**View Filtering**: `render_wall_view` and `ImageView` types are explicitly filtered out in `renderAll()`.

### Phase 2: Container Creation (view.js)

#### renderProjectInfo(projectInfo, viewsCnt)

Creates HTML containers for each view:

```javascript
// Creates viewsCnt containers (one per view)
for (let i = 0; i < viewsCnt; i++) {
  // Creates:
  // <div id="wd-{i}" class="working-drawing">
  //   <div class="canvas-container">
  //     <canvas id='checks'></canvas>
  //     <canvas class='overlay-canvas-container' id="c#{i}"></canvas>
  //   </div>
  // </div>
}
```

**Container Structure**:
- `#wd-{i}` - Main working drawing container
- `#checks` - Main canvas for drawing (unnamed in selector)
- `#c#{i}` - Overlay canvas for Fabric.js (dimensions, text)

### Phase 3: View Rendering (view.js)

#### Rendering by View Type

**FloorPlanView** (Ground floor plan):
```javascript
renderFloorPlan(view, id)
  ↓
Draw outline on main canvas (Canvas 2D API)
  ↓
Add room names to overlay canvas (Fabric.js) - DEFERRED
  ↓
Add SCOPING DATA table (HTML)
```

**RoomSubView** (Elevations, front/internal views):
```javascript
renderView(projectInfo, view, id)
  ↓
Render outline (Canvas 2D API)
  ↓
Render components (Fabric.js)
  ↓
Render window/door openings (Fabric.js)
  ↓
Render texts (Fabric.js) - DEFERRED
  ↓
Render material thumbnails (HTML table)
  ↓
Render handle data (HTML table)
```

**TableView** (Material/specification tables):
```javascript
renderTableView(view, id)
  ↓
Replace canvas with HTML table
```

### Phase 4: Canvas Initialization (script.js)

**CRITICAL TIMING**: This happens AFTER all views are rendered

```javascript
// Inside setTimeout() after view rendering
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
  overlayCanvases.push(canv);
});
```

### Phase 5: Dimension Rendering (view.js)

```javascript
// For each view (except table_view)
renderPyDimensions(dimensions, id)
  ↓
For each dimension:
  - Create dimension line (fabric.Line)
  - Create extension lines (fabric.Line)
  - Create dimension text (fabric.Textbox)
  - Group into fabric.Group
  - Add to overlayCanvases[id]
```

### Phase 6: Deferred Text Rendering

**After 200ms delay**, deferred text rendering executes:

```javascript
// In renderTexts, renderViewTexts, renderFloorPlan
setTimeout(() => {
  if (overlayCanvases[id] && state.viewBoxInfo[id]) {
    // Add text objects to canvas
    canvas.add(textbox);
    canvas.renderAll();
  }
}, 200);
```

---

## Canvas System

### Two-Layer Canvas Architecture

Each view uses **two overlapping canvases**:

1. **Main Canvas** (HTML5 Canvas 2D)
   - Purpose: Static drawing (outlines, component shapes)
   - Selector: `#wd-{id} canvas` (first canvas in container)
   - API: Canvas 2D Context (`getContext("2d")`)
   - Operations: `drawImage()`, `beginPath()`, `moveTo()`, `lineTo()`, `stroke()`

2. **Overlay Canvas** (Fabric.js)
   - Purpose: Interactive elements (dimensions, text, annotations)
   - Selector: `.overlay-canvas-container` or `#c#{id}`
   - API: Fabric.js Canvas
   - Objects: `fabric.Textbox`, `fabric.Line`, `fabric.Group`

### Canvas Sizing and DPI

```javascript
const dpi = window.devicePixelRatio;

function fix_dpi(canvasId) {
  const canvas = document.getElementById(canvasId);
  const style_height = +getComputedStyle(canvas).height.slice(0, -2);
  const style_width = +getComputedStyle(canvas).width.slice(0, -2);
  
  canvas.setAttribute("height", style_height * dpi);
  canvas.setAttribute("width", style_width * dpi);
}
```

**Purpose**: Fixes canvas blurriness on high-DPI displays by scaling canvas internal resolution.

### Canvas Calibration

```javascript
function calibrateCanvases(viewBoxInfo) {
  viewBoxInfo.forEach((info, id) => {
    const canvas = document.querySelector(`#wd-${id} canvas`);
    fix_dpi(`wd-${id}`);
    
    const cx = canvas.getContext("2d");
    const scale = info["scale"];
    const origin = [info["newOriginX"], info["newOriginY"]];
    
    cx.scale(scale / dpi, scale / dpi);
    cx.translate(origin[0], origin[1]);
  });
}
```

**Purpose**: 
- Applies coordinate transformation to all main canvases
- Sets up scaling and translation based on viewBox data
- Called ONCE on the first view render

**CRITICAL**: Must be called AFTER canvas elements exist in DOM but BEFORE any drawing operations.

---

## View Types

### 1. FloorPlanView (Ground Floor Plan)

**Data Structure**:
```javascript
class FloorPlanView {
  id: string,
  name: "Ground floor plan",
  type: "FloorPlanView",
  outline: Edge[],           // Building outline
  roomNamePos: {             // Room label positions
    "RoomName": [x, y],
    ...
  },
  roomTopView: { ... }       // Detailed room data
}
```

**Rendering**:
- Draws building outline with Canvas 2D API
- Adds room name labels with Fabric.js (DEFERRED)
- Adds SCOPING DATA table (HTML)
- Does NOT add view direction labels (this was a bug we discovered)

**Index**: Always at index 0

### 2. RoomSubView (Elevation Views)

**Data Structure**:
```javascript
class RoomSubView {
  id: "RoomName+view_name",  // e.g., "Kitchen+front_view"
  name: "front_view" | "internal_view",
  type: "RoomSubView",
  outline: Edge[],
  openings: { ... },         // Windows, doors
  texts: { ... },            // Component labels (C-1, C-2, etc.)
  components: { ... },       // Furniture, fixtures
  externalItems: { ... }     // External elements
}
```

**Rendering**:
- `renderOutline()` - Draws component outlines
- `renderComponents()` - Draws furniture/fixtures with Fabric.js
- `renderWindowDoor()` - Draws windows/doors
- `renderTexts()` - Adds component labels (DEFERRED)
- `renderMaterialThumbnails()` - Adds material table
- `renderHandleData()` - Adds handle data table

**Common View Names**:
- `front_view` - Front elevation
- `internal_view` - Internal elevation
- `room_top_view` - Top view (uses FloorPlanView for ground floor)

### 3. TableView (Specification Tables)

**Data Structure**:
```javascript
class TableView {
  id: "RoomName+table_view",
  name: "table_view",
  type: "TableView",
  // ... table data
}
```

**Rendering**:
- Replaces canvas with HTML table
- No canvas operations

### 4. RenderView (FILTERED OUT)

**Data Structure**:
```javascript
class RenderView {
  id: string,
  name: "render_wall_view",
  type: "ImageView",
  imageURL: string
}
```

**Status**: **EXPLICITLY FILTERED OUT** in `renderAll()` and `handleView()`.

**Why Filtered**: These pages were causing index misalignment and are not needed in the current workflow.

---

## State Management

### State Initialization

```javascript
// parseJSON() reinitializes state
state = {};
state.projectInfo = getProjectInfo(parsedData);
state.roomViews = [floorPlanView];
state.roomNames = [...];
// ... etc
```

### State Arrays and Filtering

**Original Arrays** (before filtering):
```javascript
state.roomViews = [
  FloorPlanView,
  RoomSubView (front_view),
  TableView,
  RenderView,        // ← FILTERED OUT
  RoomSubView (internal_view),
  // ...
]
```

**Filtered Arrays** (in renderAll):
```javascript
const filteredViews = state.roomViews.filter(
  view => view.type !== "ImageView" && view.getName() !== "render_wall_view"
);

// CRITICAL: Sync viewBoxInfo and dimens
const filteredViewBoxInfo = [];
const filteredDimens = [];
state.roomViews.forEach((view, idx) => {
  if (view.type !== "ImageView" && view.getName() !== "render_wall_view") {
    filteredViewBoxInfo.push(state.viewBoxInfo[idx]);
    filteredDimens.push(state.dimens[idx]);
  }
});

// Replace state arrays
state.viewBoxInfo = filteredViewBoxInfo;
state.dimens = filteredDimens;
```

**Why This Matters**: After filtering, indices must align:
- `filteredViews[5]` corresponds to `state.viewBoxInfo[5]` and `state.dimens[5]`

---

## Rendering Pipeline

### Critical Rendering Order

**THE CORRECT ORDER** (learned through debugging):

1. **Parse Data** → `parseJSON()`
2. **Filter Views** → Remove RenderView/ImageView
3. **Create Containers** → `renderProjectInfo(viewsCnt)`
4. **Wait for DOM** → `setTimeout(100ms)`
5. **Render Views** → Loop through `filteredViews`
   - **First view**: Call `calibrateCanvases()`
   - **Each view**: Call appropriate render function
   - **Text rendering**: DEFERRED (canvas not ready yet)
6. **Initialize Overlay Canvases** → Create Fabric.js canvases
7. **Render Dimensions** → `renderPyDimensions()`
8. **Execute Deferred Text** → After 200ms, text rendering completes

### Why This Order Matters

**Problem**: If overlay canvases are created BEFORE views are rendered:
- ✗ Canvas elements don't exist in DOM yet
- ✗ Canvas dimensions are wrong (default 300x150)
- ✗ Text added early gets wiped when canvas is recreated

**Solution**: Create overlay canvases AFTER all view rendering:
- ✓ All canvas elements exist in DOM
- ✓ Correct dimensions from main canvas
- ✓ Text deferred until canvas is ready

---

## Canvas System

### Main Canvas Operations (Canvas 2D API)

Used in: `renderFloorPlan`, `renderOutline`, `renderRenderView`

```javascript
const canvas = document.querySelector(`#wd-${id} canvas`);
const cx = canvas.getContext("2d");

// Drawing operations (after calibrateCanvases)
cx.beginPath();
cx.strokeStyle = "black";
cx.lineWidth = "16";
cx.moveTo(x1, -y1);  // Note: Y is inverted
cx.lineTo(x2, -y2);
cx.stroke();
cx.closePath();

// Drawing images
const img = new Image();
img.onload = function() {
  cx.drawImage(img, 0, 0, canvas.width, canvas.height);
};
img.src = imageURL;
```

**Coordinate System**: 
- X: Left to right (normal)
- Y: **Inverted** (multiply by -1)
- Origin: Transformed via `calibrateCanvases()`

### Overlay Canvas Operations (Fabric.js)

Used in: `renderTexts`, `renderViewTexts`, `renderPyDimensions`, `renderComponents`

```javascript
const canvas = overlayCanvases[id];

// Creating text
const textbox = new fabric.Textbox(text, {
  left: ((x + origin[0]) * scale) / dpi,
  top: ((-y + origin[1]) * scale) / dpi,
  width: 40,
  fontSize: 11,
  textAlign: "center",
  originX: "center",
  originY: "center",
  // ... styling options
});

// Add to canvas
canvas.add(textbox);
canvas.renderAll();
canvas.calcOffset();
```

**Coordinate Transformation**:
```javascript
// World coordinates → Canvas coordinates
canvasX = ((worldX + originX) * scale) / dpi;
canvasY = ((-worldY + originY) * scale) / dpi;  // Y inverted
```

**Key Fabric.js Objects**:
- `fabric.Textbox` - Text labels (editable)
- `fabric.Line` - Dimension lines
- `fabric.Group` - Grouped objects (dimension + text)
- `fabric.Circle` - Circles (e.g., compass)

---

## Critical Timing Issues

### Issue 1: Canvas Element Availability

**Problem**: Canvas elements don't exist when rendering starts.

**Solution**: 
```javascript
setTimeout(() => {
  // Render all views
  // Initialize overlay canvases
}, 100);
```

Wait 100ms after `renderProjectInfo()` creates containers.

### Issue 2: Overlay Canvas Initialization

**Problem**: Text added before overlay canvas initialization is lost.

**Original Code** (WRONG):
```javascript
// At page load
var overlayCanvases = [];
overlayCanvasContainers.forEach((canvas, id) => {
  let canv = new fabric.Canvas(`c#${id}`, ...);
  overlayCanvases.push(canv);
});

// Later in renderAll()
// Creates NEW canvases, destroying old ones with text
overlayCanvases = [];
overlayCanvasContainers.forEach(...) // Text is lost!
```

**Fixed Code**:
```javascript
// At page load - NO INITIALIZATION
var overlayCanvases = [];

// In renderAll() - ONLY PLACE canvases are created
// After all views are rendered
overlayCanvases = [];
overlayCanvasContainers.forEach((canvas, id) => {
  let canv = new fabric.Canvas(`c#${id}`, ...);
  overlayCanvases.push(canv);
});
```

### Issue 3: Text Rendering Timing

**Problem**: Text rendering happens before canvas is ready.

**Solution**: Deferred rendering pattern

```javascript
const renderTexts = (textObject, id) => {
  const canvas = overlayCanvases[id];
  
  if (!canvas || !state.viewBoxInfo[id]) {
    console.warn(`Deferring text rendering for id ${id}`);
    setTimeout(() => {
      if (overlayCanvases[id] && state.viewBoxInfo[id]) {
        renderTexts(textObject, id);  // Retry
      }
    }, 200);
    return;
  }
  
  // Normal rendering...
};
```

**Applied To**:
- `renderTexts()` - Component labels
- `renderViewTexts()` - View direction labels  
- `renderFloorPlan()` - Room name labels

### Issue 4: Canvas Dimension Synchronization

**Problem**: Overlay canvases sized before main canvas rendered.

**Solution**: Initialize overlay canvases AFTER view rendering loop:

```javascript
// AFTER filteredViews.forEach() completes
overlayCanvasContainers = document.querySelectorAll(".overlay-canvas-container");

if (overlayCanvasContainers.length > 0) {
  w = document.querySelector(`#wd-0 canvas`).width;   // ✓ Canvas exists now
  h = document.querySelector(`#wd-0 canvas`).height;
}
```

---

## View Types

### View Type Determination

In `model.js`, view type is determined by:

```javascript
const viewType = [
  "room_top_view",
  "top_view", 
  "front_view",
  "internal_view",
  "render_wall_view"  // ← FILTERED OUT
];

if (viewType.includes("room_top_view")) {
  // FloorPlanView
}
else if (name === "render_wall_view") {
  // RenderView (SKIPPED via explicit check)
}
else {
  // RoomSubView
}
```

### View Naming Convention

**Room Views**:
- ID format: `"{RoomName}+{view_name}"`
- Examples:
  - `"Kitchen+front_view"`
  - `"GBR+internal_view"`
  - `"Washroom+table_view"`

**Ground Floor Plan**:
- ID: Usually just the floor name
- Name: `"Ground floor plan"`
- Type: `"FloorPlanView"`

---

## Common Pitfalls

### 1. Array Index Misalignment

❌ **WRONG**:
```javascript
// Filtering only roomViews
const filteredViews = state.roomViews.filter(...);

// viewBoxInfo and dimens NOT filtered
// Now indices don't match!
```

✓ **CORRECT**:
```javascript
// Filter all arrays together
state.roomViews.forEach((view, idx) => {
  if (shouldKeep(view)) {
    filteredViews.push(view);
    filteredViewBoxInfo.push(state.viewBoxInfo[idx]);
    filteredDimens.push(state.dimens[idx]);
  }
});
```

### 2. Canvas Creation Timing

❌ **WRONG**:
```javascript
// Creating canvases at page load
var overlayCanvases = [];
document.querySelectorAll(".overlay-canvas-container").forEach(...);
```

✓ **CORRECT**:
```javascript
// Create canvases ONLY in renderAll(), AFTER views rendered
var overlayCanvases = []; // Empty at start

// Later in renderAll(), after setTimeout
overlayCanvases = [];
overlayCanvasContainers.forEach(...); // Create once
```

### 3. Text Rendering Without Defer

❌ **WRONG**:
```javascript
const renderTexts = (textObject, id) => {
  const canvas = overlayCanvases[id];
  canvas.add(textbox); // Crashes if canvas undefined
};
```

✓ **CORRECT**:
```javascript
const renderTexts = (textObject, id) => {
  const canvas = overlayCanvases[id];
  
  if (!canvas) {
    setTimeout(() => renderTexts(textObject, id), 200);
    return;
  }
  
  canvas.add(textbox);
};
```

### 4. Calling calibrateCanvases Too Early

❌ **WRONG**:
```javascript
renderProjectInfo(...);
calibrateCanvases(state.viewBoxInfo); // Canvas elements don't exist yet!
filteredViews.forEach(...);
```

✓ **CORRECT**:
```javascript
renderProjectInfo(...);
setTimeout(() => {
  filteredViews.forEach((view, id) => {
    if (id === 0 && !window._canvasesCalibrated) {
      calibrateCanvases(state.viewBoxInfo); // Canvas elements exist now
      window._canvasesCalibrated = true;
    }
    // Render view...
  });
}, 100);
```

### 5. Browser Caching

**Problem**: Browser aggressively caches JavaScript files.

**Solution**: Version query parameters in HTML:
```html
<script src="js/view.js?v=1.13"></script>
<script src="js/script.js?v=1.5"></script>
```

**IMPORTANT**: Increment version number after EVERY change to force cache refresh.

---

## File Reference

### model.js

**Purpose**: Parse JSON data and create view objects

**Key Functions**:

#### `handleView(rooms, roomName, viewName, viewData, viewType)`
- Creates view objects from JSON data
- **FILTERS OUT**: `render_wall_view` types
- Returns: `[view, viewBoxInfo, dimens]`

#### `handleViewDimens(viewData, viewName)`
- Extracts dimension data from view
- **SKIPS**: `render_wall_view` types
- Returns: Array of dimension objects

#### `getFloorPlan(parsedData)`
- Creates the ground floor plan view
- Returns: `[FloorPlanView, roomNames, dimens, viewBoxInfo]`

#### `getRoomObjects(rooms)`
- Processes all room views
- Returns: `[views, dimens, viewBoxInfo]`

**Critical Code**:
```javascript:437:470
// In handleView - Line 437
if (name === "render_wall_view" || viewType.includes("render_wall_view")) {
  // Skip processing render_wall_view
  return [null, {}, []];
}

// In handleViewDimens - Line 467
if (viewName === "render_wall_view") {
  return [];
}
```

### view.js

**Purpose**: Core rendering functions for all view types

**Key Functions**:

#### `renderProjectInfo(projectInfo, viewsCnt)`
- Creates HTML containers for all views
- **CRITICAL**: Creates `viewsCnt` containers (one per view)
- Previously had bug: created `viewsCnt/2` containers

```javascript:72:81
for (let i = 0; i < viewsCnt; i++) {
  // Create container with id="wd-{i}"
  // Contains main canvas and overlay canvas
}
```

#### `calibrateCanvases(viewBoxInfo)`
- Applies coordinate transformation to all main canvases
- Fixes DPI for high-resolution displays
- **MUST** be called after canvas elements exist

```javascript:684:698
viewBoxInfo.forEach((info, id) => {
  fix_dpi(`wd-${id}`);
  const canvas = document.querySelector(`#wd-${id} canvas`);
  const cx = canvas.getContext("2d");
  cx.scale(scale / dpi, scale / dpi);
  cx.translate(origin[0], origin[1]);
});
```

#### `renderFloorPlan(floorPlanView, id)`
- Renders ground floor plan
- Draws outline with Canvas 2D
- Adds room names with Fabric.js (DEFERRED)
- Adds SCOPING DATA table

**Deferred Rendering**:
```javascript:770:867
if (!canvas || !state.viewBoxInfo[0]) {
  setTimeout(() => {
    // Retry room name rendering
  }, 200);
  return;
}
```

#### `renderView(projectInfo, view, id)`
- Renders elevation views (RoomSubView)
- Calls sub-rendering functions:
  - `renderOutline()`
  - `renderComponents()`
  - `renderWindowDoor()`
  - `renderViewDetail()`

#### `renderTexts(textObject, id)`
- Renders component labels (C-1, C-2, etc.)
- **DEFERRED** if canvas not available
- Uses Fabric.js Textbox

**Deferred Pattern**:
```javascript:1577:1666
const canvas = overlayCanvases[id];

if (!canvas || !state.viewBoxInfo[id]) {
  console.warn(`Deferring text rendering for id ${id}`);
  setTimeout(() => {
    if (overlayCanvases[id] && state.viewBoxInfo[id]) {
      renderTexts(textObject, id); // Recursive retry
    }
  }, 200);
  return;
}

// Add text to canvas...
```

#### `renderViewTexts(textObject, id)`
- Renders view direction labels with compass
- Shows which elevation corresponds to which direction
- Only called for `room_top_view` (NOT for ground floor plan in current implementation)

**Where Called**:
```javascript:897:899
if (viewName === 'room_top_view') {
  renderViewNames(view, id);  // → renderViewTexts()
}
```

#### `renderPyDimensions(dimensions, id)`
- Renders dimension lines and text
- Creates `fabric.Group` containing:
  - Dimension line (`fabric.Line`)
  - Extension lines (`fabric.Line[]`)
  - Dimension text (`fabric.Textbox`)

**Coordinate Transformation**:
```javascript:1950:1951
left: ((pt[0] + origin[0]) * scale) / dpi,
top: ((-1 * pt[1] + origin[1]) * scale) / dpi,
```

### script.js

**Purpose**: Main orchestration, event handling, render coordination

**Key Functions**:

#### `readJSON(input)`
- Handles file upload
- Sends JSON to backend for validation
- Calls `parseJSON()` and `renderAll()`

#### `parseJSON(parsedData)`
- Parses JSON into state object
- Calls model.js functions to build state

#### `renderAll()`
- **Main rendering orchestrator**
- Clears existing content
- Filters views
- Coordinates entire rendering pipeline

**Critical Structure**:
```javascript:182:370
const renderAll = () => {
  // 1. Filter views
  const filteredViews = [];
  const filteredViewBoxInfo = [];
  const filteredDimens = [];
  
  state.roomViews.forEach((view, idx) => {
    if (view.type !== "ImageView" && view.getName() !== "render_wall_view") {
      filteredViews.push(view);
      filteredViewBoxInfo.push(state.viewBoxInfo[idx]);
      filteredDimens.push(state.dimens[idx]);
    }
  });
  
  // 2. Replace state arrays
  state.viewBoxInfo = filteredViewBoxInfo;
  state.dimens = filteredDimens;
  
  // 3. Create containers
  renderProjectInfo(state.projectInfo, filteredViews.length);
  
  // 4. Wait for DOM
  setTimeout(() => {
    // 5. Render views
    filteredViews.forEach((view, id) => {
      if (id === 0) calibrateCanvases(state.viewBoxInfo);
      
      if (view.type === "FloorPlanView") {
        renderFloorPlan(view, id);
      } else {
        renderView(state.projectInfo, view, id);
        renderMaterialThumbnails(...);
        renderHandleData(...);
      }
    });
    
    // 6. Initialize overlay canvases
    overlayCanvasContainers = document.querySelectorAll(".overlay-canvas-container");
    w = document.querySelector(`#wd-0 canvas`).width;
    h = document.querySelector(`#wd-0 canvas`).height;
    
    overlayCanvases = [];
    overlayCanvasContainers.forEach((canvas, id) => {
      overlayCanvases.push(new fabric.Canvas(`c#${id}`, {
        backgroundColor: "rgba(0, 0, 0, 0)",
        width: w,
        height: h,
      }));
    });
    
    // 7. Render dimensions
    state.dimens.forEach((dimensions, id) => {
      if (filteredViews[id].getName() != "table_view") {
        renderPyDimensions(dimensions, id);
      }
    });
    
    // 8. Deferred text executes after 200ms
  }, 100);
};
```

### Issue 3: Deferred Rendering Coordination

**Why 200ms delay?**
- Overlay canvases created after 100ms
- Deferred text waits 200ms (total ~300ms from start)
- Ensures canvases are fully initialized

**Execution Timeline**:
```
T+0ms:   renderAll() starts
T+0ms:   renderProjectInfo() creates containers
T+100ms: setTimeout executes
T+100ms: Views rendered (text deferred)
T+100ms: Overlay canvases created
T+100ms: Dimensions added
T+300ms: Deferred text executes (200ms after view render)
```

---

## CSS Styling

### Canvas Container Styles

```css
.canvas-container {
  position: relative;
  width: 100%;
  height: 120vh;
  pointer-events: none;
  overflow: hidden;
}

.working-drawing canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: all;
  image-rendering: crisp-edges;
}

.overlay-canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: all;
  z-index: 10;  /* Above main canvas */
}
```

**Key Properties**:
- `position: absolute` - Overlays canvases
- `z-index: 10` - Overlay canvas above main canvas
- `width/height: 100%` - Fill container
- `pointer-events: all` - Enable interaction

---

## Debugging Tips

### Console Logging Strategy

**Critical Checkpoints**:
```javascript
// 1. Array filtering
console.log('Filtered views count:', filteredViews.length);
console.log('Filtered viewBoxInfo count:', filteredViewBoxInfo.length);
console.log('Filtered dimens count:', filteredDimens.length);

// 2. Canvas initialization
console.log('Overlay canvas containers found:', overlayCanvasContainers.length);
console.log('Main canvas dimensions:', w, 'x', h);
console.log('Overlay canvases created:', overlayCanvases.length);

// 3. View rendering
console.log(`Rendering view ${id}: ${view.getName()}, type: ${view.type}`);

// 4. Dimension rendering
console.log(`View ${id} (${viewName}): ${dimensions.length} dimensions`);

// 5. Text rendering
console.log(`renderTexts called for id ${id}:`, {
  canvas: !!canvas,
  viewBoxInfo: !!state.viewBoxInfo[id],
  textObjectKeys: Object.keys(textObject)
});

// 6. Deferred execution
console.log(`Deferred renderTexts for id ${id} now executing`);
```

### Verifying Canvas State

**Check canvas objects in browser console**:
```javascript
// Check if canvas has objects
overlayCanvases[0].getObjects().length

// List all objects
overlayCanvases[0].getObjects().forEach((obj, i) => {
  console.log(`Object ${i}:`, obj.type, 'visible:', obj.visible, 
              'left:', obj.left, 'top:', obj.top);
});

// Check canvas dimensions
console.log('Canvas dimensions:', 
            overlayCanvases[0].width, 
            overlayCanvases[0].height);

// Check DOM element size
const elem = document.querySelector('#c#0');
console.log('DOM element size:', elem.offsetWidth, elem.offsetHeight);
```

### Common Error Patterns

**Error**: `Cannot read properties of null (reading 'setAttribute')`
- **Cause**: `fix_dpi()` called before canvas element exists
- **Fix**: Call `calibrateCanvases()` after canvas elements created

**Error**: `Cannot read properties of undefined (reading 'getObjects')`
- **Cause**: `overlayCanvases[id]` is undefined when text rendering
- **Fix**: Add deferred rendering with setTimeout retry

**Error**: Dimensions visible but text not visible
- **Cause**: Text rendered before canvas properly sized
- **Fix**: Move overlay canvas initialization after view rendering

**Error**: First view missing text but others have it
- **Cause**: Canvas 1 created early, then destroyed
- **Fix**: Don't create overlay canvases at page load

---

## Backend Integration

### Python Server Endpoints

**POST /json**
- Receives raw JSON string
- Validates structure
- Returns processed data with warnings/errors
- Used in: `readJSON()`

**GET /api/project/wdProject**
- Fetches saved project data
- Returns processed JSON
- Used in: Modal population

### JSON Data Structure

**Top Level**:
```json
{
  "project_details": {
    "project_no": "...",
    "client_name": "...",
    "designer_name": "...",
    "location_name": "...",
    // Additional fields: address, contact_no
  },
  "space_names_data": [...],
  "rooms": {
    "RoomName": {
      "room_top_view": { ... },
      "view_2": { ... },
      "view_3": { ... },
      // ...
    }
  }
}
```

**Room View Structure**:
```json
{
  "front_view": {
    "outline": [...],
    "openings": { ... },
    "floor_components": {
      "library": { ... },
      "outline": { ... },
      "texts": { ... }
    },
    "external": { ... },
    "image_url": "...",
    "dimens": [...],
    "view_box_info": { ... }
  },
  "internal_view": { ... },
  "table_view": { ... },
  "render_wall_view": { ... },  // ← FILTERED OUT
  "material_thumbnails": { ... },
  "direction": "top" | "bottom" | "left" | "right"
}
```

**ViewBox Info**:
```json
{
  "x0": 0,
  "y0": 0,
  "xn": 3684,
  "yn": 3000,
  "length": 3684,
  "breadth": 3000,
  "scale": 0.14694173,
  "newOriginX": 922,
  "newOriginY": 8017
}
```

**Dimension Object**:
```json
{
  "dim_line": [[x1, y1], [x2, y2]],
  "extn_lines": [
    [[x1, y1], [x2, y2]],
    [[x3, y3], [x4, y4]]
  ],
  "dim_text": "1200",
  "text_pos": [x, y]
}
```

---

## Rendering Functions Deep Dive

### renderFloorPlan(floorPlanView, id)

**Location**: view.js:724

**Purpose**: Render the ground floor plan view

**Steps**:
1. Add "Note" text for components not on wall
2. Draw building outline on main canvas
3. Add room name labels on overlay canvas (DEFERRED)
4. Add SCOPING DATA table

**Canvas Used**:
- Main: `document.querySelector(#wd-${id} canvas)`
- Overlay: `overlayCanvases[0]` (always index 0)

**Deferred Operations**:
- Room name labels (if `overlayCanvases[0]` not ready)

### renderView(projectInfo, view, id)

**Location**: view.js:850

**Purpose**: Render elevation views (RoomSubView)

**Steps**:
1. Determine view name (front_view, internal_view, etc.)
2. Call `renderOutline()` - draw component outlines
3. Call `renderComponents()` - draw furniture/fixtures
4. Call `renderWindowDoor()` - draw windows/doors (includes text)
5. Call `renderViewDetail()` - add footer table
6. If `room_top_view`: call `renderViewNames()`

**Special Handling**:
- Sets global `currentRoom` and `currentView` variables
- These are used by other functions to access room data

### renderTexts(textObject, id)

**Location**: view.js:1577

**Purpose**: Render component labels (C-1, C-2, D-1, W-1, etc.)

**Input**: 
```javascript
textObject = {
  "C-1": [[x1,y1], [x2,y2], ...],  // Outline points
  "C-2": [[x1,y1], [x2,y2], ...],
  // ...
}
```

**Process**:
1. Check if canvas available → defer if not
2. Calculate center point of outline
3. Transform to canvas coordinates
4. Create Fabric.js Textbox
5. Add to overlay canvas

**Coordinate Transform**:
```javascript:1616:1617
left: ((center[0] + origin[0]) * scale) / dpi,
top: ((-1 * center[1] + origin[1]) * scale) / dpi,
```

### renderViewTexts(textObject, id)

**Location**: view.js:930

**Purpose**: Render view direction labels with compass arrows

**Input**:
```javascript
textObject = {
  "view_2": [[[points for arrow]]],
  "view_3": [[[points for arrow]]],
  // ...
}
```

**Process**:
1. Check if canvas available → defer if not
2. Calculate center of each view indicator
3. Create compass with arrows
4. Add view name text (view_2, view_3, etc.)
5. Add direction labels (North, South, etc.)

**Where Called**:
- Only for `room_top_view` type views
- **NOT called** for ground floor plan (FloorPlanView)

### renderPyDimensions(dimensions, id)

**Location**: view.js:1818

**Purpose**: Render dimension lines, extension lines, and text

**Process**:
1. Check if canvas available
2. For each dimension:
   - Create dimension line (fabric.Line)
   - Create extension lines (fabric.Line[])
   - Create dimension text (fabric.Textbox)
   - Group all into fabric.Group
   - Add group to canvas

**Styling**:
- Line color: `#ff0000` (red)
- Line width: 1
- Text: Black, 11pt, editable

---

## Common Issues and Solutions

### Issue: Pages Missing After Filtering

**Symptom**: Second half of pages don't render

**Root Cause**: 
- `renderProjectInfo()` created `viewsCnt/2` containers
- Should create `viewsCnt` containers

**Fix**:
```javascript
// WRONG
for (let i = 0; i < viewsCnt/2; i++) { ... }

// CORRECT
for (let i = 0; i < viewsCnt; i++) { ... }
```

### Issue: Dimensions Not Visible

**Symptom**: Console shows dimensions added, but not visible on page

**Root Cause**:
- Overlay canvases initialized before main canvas rendered
- Canvas sized at default 300x150 instead of actual size
- Dimensions drawn outside visible area

**Fix**:
- Move overlay canvas initialization AFTER view rendering loop
- Get dimensions from already-rendered main canvas

### Issue: Text Labels Missing

**Symptom**: Component labels (C-1, C-2) not visible

**Root Causes**:
1. Text added before canvas initialized → wiped when canvas recreated
2. Canvas not available when text function called
3. Overlay canvas initial setup creates canvases that get destroyed

**Fixes**:
1. Remove initial overlay canvas creation at page load
2. Add deferred rendering pattern to all text functions
3. Initialize canvases only once, after all views rendered

### Issue: Browser Caching

**Symptom**: Changes to JS/CSS not reflected after refresh

**Root Cause**: Browser caches static files

**Fix**:
- Add version query parameters: `?v=1.X` (helps track which version is loaded)
- Increment version after file changes for clarity
- Perform hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- **Note**: Hard refresh reliably clears cache and loads latest version

---

## Development Workflow

### Making Changes to Rendering

1. **Identify which file** to modify:
   - Data parsing → `model.js`
   - Rendering logic → `view.js`
   - Orchestration → `script.js`
   - Modal behavior → `modal.js`

2. **Make the change**

3. **Update version number** in `wdPdf.html`:
   ```html
   <script src="js/view.js?v=1.XX"></script>
   ```

4. **Test with hard refresh**

5. **Check console logs** for errors

### Adding New Text Rendering

**Template** for adding text to any view:

```javascript
const renderMyText = (textData, id) => {
  if (!textData || Object.keys(textData).length === 0) return;
  if (!openNewJSON) return;
  
  const canvas = overlayCanvases[id];
  
  // ALWAYS add this defer pattern
  if (!canvas || !state.viewBoxInfo[id]) {
    console.warn(`Deferring text rendering for id ${id}`);
    setTimeout(() => {
      if (overlayCanvases[id] && state.viewBoxInfo[id]) {
        renderMyText(textData, id); // Recursive retry
      }
    }, 200);
    return;
  }
  
  // Safe to render now
  const scale = state.viewBoxInfo[id]["scale"];
  const origin = [
    state.viewBoxInfo[id]["newOriginX"],
    state.viewBoxInfo[id]["newOriginY"],
  ];
  
  // Create and add text...
  const textbox = new fabric.Textbox(text, {
    left: ((x + origin[0]) * scale) / dpi,
    top: ((-y + origin[1]) * scale) / dpi,
    // ... other properties
  });
  
  canvas.add(textbox);
  canvas.renderAll();
  canvas.calcOffset();
};
```

### Adding New View Type

1. **Create view class** in `model.js`:
   ```javascript
   class MyNewView extends View {
     constructor(id, name, /* data */) {
       super(id, name, "MyNewView");
       // Store data
     }
   }
   ```

2. **Add to handleView()** in `model.js`:
   ```javascript
   if (name === "my_new_view") {
     view = new MyNewView(id, name, ...);
   }
   ```

3. **Create render function** in `view.js`:
   ```javascript
   const renderMyNewView = (view, id) => {
     // Rendering logic
   };
   ```

4. **Add to renderAll()** in `script.js`:
   ```javascript
   if (view.type === "MyNewView") {
     renderMyNewView(view, id);
   }
   ```

5. **Add corresponding data** to:
   - `state.viewBoxInfo`
   - `state.dimens`

---

## Performance Considerations

### Canvas Rendering

**Expensive Operations**:
- `canvas.renderAll()` - Redraws entire Fabric canvas
- `calibrateCanvases()` - Transforms all canvases
- Creating new Fabric.Canvas instances

**Optimization**:
- Only call `calibrateCanvases()` once (use `_canvasesCalibrated` flag)
- Reuse canvas instances instead of recreating
- Batch text additions before calling `renderAll()`

### Memory Management

**Canvas Cleanup**:
```javascript
// When clearing canvases
canvas.clear();           // Clear all objects
canvas.dispose();         // Dispose canvas instance
```

**Note**: Currently, we don't dispose canvases when clearing `.main` innerHTML. This might cause memory leaks on repeated renders.

---

## Known Limitations

### 1. View Direction Labels on Ground Floor Plan

**Status**: Not implemented

**Issue**: `renderViewTexts()` (which renders the compass with view direction indicators like "view_2", "view_3") is only called for `room_top_view` type views, NOT for `FloorPlanView`.

**Impact**: Ground floor plan doesn't show which elevation corresponds to which direction.

**Potential Fix**: Would need to call `renderViewTexts()` for all rooms in `renderFloorPlan()`, but this caused conflicts in previous attempts.

### 2. Single Global currentRoom Variable

**Issue**: `currentRoom` and `currentView` are global variables set during view rendering.

**Impact**: 
- Cannot easily render multiple rooms in parallel
- Functions depend on global state being correct

**Better Approach**: Pass room/view as parameters instead of using globals.

### 3. Array Index Dependency

**Issue**: Many operations rely on synchronized array indices.

**Impact**: 
- Fragile when filtering or reordering views
- Easy to introduce bugs with index misalignment

**Better Approach**: Use object maps with view IDs as keys.

---

## Testing Checklist

After making changes, verify:

- [ ] All pages render (check count matches expected)
- [ ] Dimensions visible on all elevation views
- [ ] Text labels visible on all elevation views
- [ ] Room names visible on ground floor plan
- [ ] Material thumbnails render correctly
- [ ] Tables render correctly (table_view pages)
- [ ] No console errors
- [ ] Canvas calibration happens exactly once
- [ ] Deferred rendering executes successfully
- [ ] Version numbers updated in wdPdf.html
- [ ] Hard refresh performed to clear browser cache

---

## Version History

### Major Changes (Recent)

**v1.13 (view.js)** - Oct 2025 ✅ **WORKING**
- Added deferred rendering for Ground Floor Plan room names
- Fixed `Cannot read properties of undefined` error in renderFloorPlan
- **Result**: Ground Floor Plan room names now render correctly

**v1.5 (script.js)** - Oct 2025 ✅ **WORKING**
- Removed initial overlay canvas creation at page load
- Canvases now only created in renderAll() after views rendered
- Fixes text being wiped when canvas recreated
- **Result**: Text labels now visible on all elevation views including first view

**v1.9 (modal.js)** - Oct 2025 ✅ **WORKING**
- Same fixes as script.js for modal context
- **Result**: Modal rendering consistent with main page

**v1.12 (view.js)** - Oct 2025
- Added deferred rendering pattern to renderTexts
- Added deferred rendering pattern to renderViewTexts
- Enhanced debug logging for text object properties

**v1.2 (script.js)** - Oct 2025
- Moved overlay canvas initialization after view rendering loop
- Fixed canvas dimension synchronization
- Enhanced debug logging

**v1.1 (style.css)** - Oct 2025
- Added `.overlay-canvas-container` styles
- Fixed z-index and positioning

**v1.0 (model.js)** - Oct 2025
- Added explicit filtering for `render_wall_view` in handleView
- Added explicit filtering for `render_wall_view` in handleViewDimens
- Prevents RenderView pages from being created

---

## Future Improvements

### High Priority

1. **Add view direction labels to Ground Floor Plan**
   - Currently missing the compass/arrow indicators
   - Need to safely call renderViewTexts for all rooms

2. **Clean up duplicate text rendering**
   - Text is sometimes added multiple times to same canvas
   - Need to check if text already exists before adding

3. **Memory leak prevention**
   - Dispose old canvas instances before creating new ones
   - Clear event listeners on DOM cleanup

### Medium Priority

1. **Refactor global variables**
   - Convert `currentRoom`, `currentView` to parameters
   - Reduce reliance on global state

2. **Improve error handling**
   - Better null checks throughout
   - Graceful degradation when data missing

3. **Add loading states**
   - Visual feedback during deferred rendering
   - Progress indicator for large projects

### Low Priority

1. **Code documentation**
   - JSDoc comments for all functions
   - Type definitions for better IDE support

2. **Unit tests**
   - Test coordinate transformations
   - Test array filtering logic
   - Test deferred rendering

---

## Coordinate Systems

### World Coordinates (JSON Data)

- Origin: Bottom-left
- X-axis: Left → Right (positive)
- Y-axis: Bottom → Top (positive)
- Units: Millimeters (typically)

### Canvas Coordinates (After Transformation)

- Origin: Top-left (standard HTML canvas)
- X-axis: Left → Right (positive)
- Y-axis: **Top → Bottom** (positive, inverted from world)
- Units: Pixels

### Transformation Formula

```javascript
const scale = state.viewBoxInfo[id]["scale"];
const origin = [
  state.viewBoxInfo[id]["newOriginX"],
  state.viewBoxInfo[id]["newOriginY"]
];
const dpi = window.devicePixelRatio;

// World → Canvas
canvasX = ((worldX + origin[0]) * scale) / dpi;
canvasY = ((-worldY + origin[1]) * scale) / dpi;  // Y inverted with -1
```

**Why the transformation?**
- `origin`: Shifts coordinate system
- `scale`: Converts mm to pixels and fits to canvas
- `dpi`: Accounts for high-DPI displays
- `-worldY`: Inverts Y-axis from bottom-up to top-down

---

## Debugging Scenarios

### Scenario 1: Dimensions Not Showing

**Check**:
```javascript
// 1. Are dimensions in state?
console.log(state.dimens[id]);

// 2. Is canvas available?
console.log(overlayCanvases[id]);

// 3. Are objects added?
console.log(overlayCanvases[id].getObjects().length);

// 4. Check canvas size
console.log(overlayCanvases[id].width, overlayCanvases[id].height);

// 5. Check if objects are in visible area
overlayCanvases[id].getObjects().forEach(obj => {
  console.log('Position:', obj.left, obj.top);
  console.log('Visible:', obj.visible, 'Opacity:', obj.opacity);
});
```

### Scenario 2: Text Not Showing

**Check**:
```javascript
// 1. Is renderTexts being called?
// Look for: "renderTexts called for id X"

// 2. Is it being deferred?
// Look for: "Canvas or viewBoxInfo missing for id X"

// 3. Does deferred execution happen?
// Look for: "Deferred renderTexts for id X now executing"

// 4. Are text objects added?
// Look for: "Added text ... to canvas X"

// 5. Check text properties
// Look for: "Text object properties: {visible, opacity, ...}"
```

### Scenario 3: Pages Missing

**Check**:
```javascript
// 1. Check filtered counts
console.log('Original views:', state.roomViews.length);
console.log('Filtered views:', filteredViews.length);

// 2. Check container creation
console.log('Containers created:', viewsCnt);

// 3. Check canvas containers
console.log('Canvas containers found:', 
            document.querySelectorAll('.overlay-canvas-container').length);

// 4. Are views being filtered unexpectedly?
state.roomViews.forEach((view, idx) => {
  console.log(`View ${idx}:`, view.getName(), view.type);
});
```

---

## Key Learnings from Recent Debugging

### 1. Timing is Everything

- DOM elements must exist before accessing them
- Canvases must be initialized before adding objects
- Use `setTimeout` to defer operations when elements not ready

### 2. Index Synchronization is Critical

- Filtering one array requires filtering ALL related arrays
- Use same filter logic for views, viewBoxInfo, and dimens
- Test array lengths match after filtering

### 3. Canvas Lifecycle Matters

- Creating `new fabric.Canvas()` on existing element destroys previous instance
- Don't recreate canvases unnecessarily
- Initialize once, reuse thereafter

### 4. Browser Caching is Aggressive

- Version numbers help track which version is loaded
- Hard refresh clears cache and loads latest version reliably
- After hard refresh (Ctrl+F5 or Cmd+Shift+R), updates are always reflected

### 5. Deferred Rendering Pattern

**Essential for**:
- Any operation that needs canvas to exist
- Any operation that needs viewBoxInfo
- Text rendering, room names, view labels

**Pattern**:
```javascript
if (!requiredResource) {
  setTimeout(() => {
    if (requiredResource) {
      retryOperation();
    }
  }, delay);
  return;
}
// Proceed with operation
```

---

## Quick Reference

### Common Selectors

```javascript
// Main canvas for view
document.querySelector(`#wd-${id} canvas`)

// Overlay canvas element
document.querySelector(`#c#${id}`)

// All overlay canvas containers  
document.querySelectorAll(".overlay-canvas-container")

// Working drawing container
document.querySelector(`#wd-${id}`)
```

### Common Operations

```javascript
// Get view name
const viewName = view.getName();

// Get view type
const viewType = view.type;

// Get current room data
const roomData = state.rooms[currentRoom];

// Get scale and origin
const scale = state.viewBoxInfo[id]["scale"];
const origin = [
  state.viewBoxInfo[id]["newOriginX"],
  state.viewBoxInfo[id]["newOriginY"]
];

// Transform coordinates
const canvasX = ((worldX + origin[0]) * scale) / dpi;
const canvasY = ((-worldY + origin[1]) * scale) / dpi;
```

### Version Update Checklist

When modifying files:

1. Make code changes
2. Update version in `wdPdf.html`:
   - `model.js?v=X.X`
   - `view.js?v=X.X`
   - `script.js?v=X.X`
   - `modal.js?v=X.X`
   - `style.css?v=X.X`
3. Hard refresh browser
4. Check console for errors
5. Verify functionality

---

## Appendix: Function Call Graph

### renderAll() Execution Flow

```
renderAll()
├─ Filter views, viewBoxInfo, dimens
├─ renderProjectInfo(projectInfo, viewsCnt)
│  └─ Creates HTML containers with canvases
├─ setTimeout(100ms)
│  ├─ filteredViews.forEach(view, id)
│  │  ├─ if (id === 0) calibrateCanvases(viewBoxInfo)
│  │  │  └─ fix_dpi() for each canvas
│  │  ├─ if (FloorPlanView)
│  │  │  └─ renderFloorPlan(view, id)
│  │  │     ├─ Draw outline (Canvas 2D)
│  │  │     └─ Add room names (Fabric, DEFERRED)
│  │  └─ else (RoomSubView)
│  │     └─ renderView(projectInfo, view, id)
│  │        ├─ renderOutline(view, id)
│  │        ├─ renderComponents(components, id)
│  │        │  └─ renderTexts(texts, id) [DEFERRED]
│  │        ├─ renderWindowDoor(view, id)
│  │        │  └─ renderTexts(texts, id) [DEFERRED]
│  │        ├─ renderViewNames(view, id) [if room_top_view]
│  │        │  └─ renderViewTexts(viewnames, id) [DEFERRED]
│  │        ├─ renderMaterialThumbnails(materials, id)
│  │        └─ renderHandleData(handles, id)
│  ├─ Initialize overlay canvases
│  │  └─ new fabric.Canvas() for each container
│  └─ state.dimens.forEach(dimensions, id)
│     └─ renderPyDimensions(dimensions, id)
│        └─ Add dimension groups to canvas
└─ setTimeout(200ms) - Deferred text executes
   ├─ renderTexts() executes
   ├─ renderViewTexts() executes
   └─ Room name rendering executes
```

---

## Glossary

**Terms**:
- **View**: A single page/drawing in the system
- **ViewBox**: Bounding box and transformation data for a view
- **Dimension (dimen)**: Measurement line with text
- **Overlay Canvas**: Fabric.js canvas for interactive elements
- **Main Canvas**: HTML5 canvas for static drawing
- **Calibration**: Setting up coordinate transformation on canvas
- **DPI**: Device Pixel Ratio for high-resolution displays
- **Deferred Rendering**: Delayed execution pattern for async operations

**Abbreviations**:
- `cx`: Canvas 2D context
- `canv`: Fabric.js canvas instance
- `dpi`: Device pixel ratio
- `tmp`, `tmp1`: Temporary variables (poor naming in legacy code)

---

## Contact & Maintenance

This documentation created: October 2025

For questions or updates to this documentation, please maintain this file with any significant changes to the rendering system.

**Critical**: Keep this documentation in sync with code changes!


// edge class
class Edge {
	pt1 = [];
	pt2 = [];
	dimen = 0;
	midPt = [];
	direction = '';
	boundRect = [[], []];
	constructor(pt1, pt2) {
		if (pt1[1] == pt2[1]) {
			if (pt1[0] > pt2[0]) {
				this.pt1 = pt2;
				this.pt2 = pt1;
			} else {
				this.pt1 = pt1;
				this.pt2 = pt2;
			}
		} else {
			if (pt1[1] > pt2[1]) {
				this.pt1 = pt2;
				this.pt2 = pt1;
			} else {
				this.pt1 = pt1;
				this.pt2 = pt2;
			}
		}
		this.dimen = Math.hypot(
			this.pt1[0] - this.pt2[0],
			this.pt1[1] - this.pt2[1]
		);
		this.midPt = [
			(this.pt1[0] + this.pt2[0]) / 2,
			(this.pt1[1] + this.pt2[1]) / 2,
		];
		this.calcDirection();
		this.calcBoundRect();
	}
	getDimen() {
		return this.dimen;
	}
	getCoords() {
		return [this.pt1, this.pt2];
	}
	getMidPt() {
		return this.midPt;
	}

	get boundRect() {
		return this.calcBoundRect();
	}

	calcBoundRect() {
		this.boundRect = [];
		switch (this.direction) {
			case 'h':
				this.boundRect = [
					[this.pt1[0], this.pt1[1] + 50],
					[this.pt2[0], this.pt2[1] - 50],
				];
				break;

			case 'v':
				this.boundRect = [
					[this.pt1[0] - 50, this.pt1[1]],
					[this.pt2[0] + 50, this.pt2[1]],
				];
				break;
		}
		return this.boundRect;
	}

	get direction() {
		return this.calcDirection();
	}

	calcDirection() {
		if (this.pt1[1] === this.pt2[1]) {
			// horizotal
			this.direction = 'h';
		} else if (this.pt1[0] === this.pt2[0]) {
			// vertical
			this.direction = 'v';
		}
		return this.direction;
	}
}

// Component class
class Component {
	constructor(id, name) {
		this.id = id;
		this.name = name;
	}
	getId() {
		return this.id;
	}
	getName() {
		return this.name;
	}
}

class Comp1 extends Component {
	constructor(id, name, comp_details = [], outline = []) {
		super(id, name);
		this.details = comp_details;
		this.outline = outline;
	}
	getID() {
		return this.id;
	}
	getName() {
		return this.name;
	}

	getDetails() {
		return this.details;
	}
	getOutline() {
		return this.outline;
	}
}

class Comp2 extends Component {
	constructor(id, name, comp_details = [], extern_pts = []) {
		super(id, name);
		this.details = comp_details;
		this.externPts = extern_pts;
	}
	getID() {
		return this.id;
	}
	getName() {
		return this.name;
	}
	getDetails() {
		return this.details;
	}

	getExternPts() {
		return this.externPts;
	}
}

class ExternComp extends Component {
	constructor(id, name, details = [], outline = []) {
		super(id, name);
		this.outline = outline;
		this.details = details;
	}

	getOutline() {
		return this.outline;
	}
}

// "comp_details" class

class CompDetails {
	constructor(width, height, depth, accessories = [], materials = []) {
		this.width = width;
		this.height = height;
		this.depth = depth;
		this.accessories = accessories;
		this.materials = materials;
	}

	getDetails() {
		return {
			accessories: this.accessories,
			width: this.width,
			height: this.height,
			depth: this.depth,
			materials: this.materials,
		};
	}
}

class ExternPts {
	constructor(
		internal,
		shutter,
		carcass,
		fillers,
		skirting,
		loft_skirting,
		cover_panels
	) {
		this.internal = internal;
		this.shutter = shutter;
		this.carcass = carcass;
		this.fillers = fillers;
		this.skirting = skirting;
		this.loftSkirting = loft_skirting;
		this.coverPanels = cover_panels;
	}

	getShutter() {
		return this.shutter;
	}

	getCarcass() {
		return this.carcass;
	}

	getInternal() {
		return this.internal;
	}

	getFillers() {
		return this.fillers;
	}

	getSkirting() {
		return this.skirting;
	}

	getSkirting() {
		return this.loftSkirting;
	}

	getCPanels() {
		return this.coverPanels;
	}
}

// "shutter" class
class Shutter {
	constructor(name, outline = [], opening = '', handle = {}) {
		this.name = name;
		this.outline = outline;
		this.opening = opening;
		this.handle = handle;
		this.calcDirection();
	}

	getName() {
		return this.name;
	}
	getOutline() {
		return this.outline;
	}
	getOpening() {
		return this.opening;
	}
	getHandle() {
		return this.handle;
	}
	calcDirection() {
		this.directions = [];
		let temp = [];
		this.outline.forEach((edge) => {
			temp = [...temp, ...edge.getCoords()];
		});
		let x = temp.map((el) => el[0]);
		let y = temp.map((el) => el[1]);
		let xmax = Math.max(...x);
		let xmin = Math.min(...x);
		let ymax = Math.max(...y);
		let ymin = Math.min(...y);
		this.outline.forEach((edge) => {
			let coords = edge.getCoords();
			if (coords[0][0] === xmax && coords[1][0] === xmax) {
				this.directions.push('l');
			} else if (coords[0][0] === xmin && coords[1][0] === xmin) {
				this.directions.push('r');
			} else if (coords[0][1] === ymax && coords[1][1] === ymax) {
				this.directions.push('u');
			} else if (coords[0][1] === ymin && coords[1][1] === ymin) {
				this.directions.push('d');
			}
		});
	}
}

class BaseView {
	constructor(id, name) {
		this.id = id;
		this.name = name;
	}
}

// image view class
class RenderView extends BaseView {
	type = 'ImageView';
	constructor(id, name, imgURL = '') {
		super(id, name);
		this.imgURL = imgURL;
	}
	getID() {
		return this.id;
	}

	getName() {
		return this.name;
	}

	getImgURL() {
		return this.imgURL;
	}

	get type() {
		return this.type;
	}
}

class View extends BaseView {
	constructor(id, name, outline) {
		super(id, name);
		this.outline = outline;
	}
}

class FloorPlanView extends View {
	type = 'FloorPlanView';
	constructor(id, name, outline, roomPositions) {
		super(id, name, outline);
		this.roomPositions = roomPositions;
	}

	getID() {
		return this.id;
	}
	getName() {
		return this.name;
	}
	getOutline() {
		return this.outline;
	}
	getRoomNamePos() {
		return this.roomPositions;
	}

	get type() {
		return this.type;
	}
}

class RoomSubView extends View {
	type = 'RoomSubView';
	constructor(
		id,
		name,
		outline,
		openings = {},
		floor_components = [],
		external = [],
		imgURL = ''
	) {
		super(id, name, outline);
		this.openings = openings;
		this.floorComponents = floor_components;
		this.external = external;
		this.imgURL = imgURL;
	}

	getID() {
		return this.id;
	}
	getName() {
		return this.name;
	}

	setName(name) {
		this.name = name;
	}

	getOutline() {
		return this.outline;
	}

	getImgURL() {
		return this.imgURL;
	}
	getComps() {
		return this.floorComponents;
	}

	getExternalItems() {
		return this.external;
	}

	getOpenings() {
		return this.openings;
	}

	get type() {
		return this.type;
	}
}

// empty view
class AdditionalView extends BaseView {
	type = 'AdditionalView';
	constructor(id, name, content = {}) {
		super(id, name);
		this.content = content;
	}

	getID() {
		return this.id;
	}

	getName() {
		return this.name;
	}

	getContent() {
		return this.content;
	}

	setContent(imgURL) {
		this.content.imgURL = imgURL;
	}

	get type() {
		return this.type;
	}
}

// components' detail tabular format view
class TableView extends BaseView {
	type = 'TableView';
	constructor(id, name, compsInfo) {
		super(id, name);
		this.compsInfo = compsInfo;
	}

	getID() {
		return this.id;
	}

	getName() {
		return this.name;
	}
	getCompsInfo() {
		return this.compsInfo;
	}
	get type() {
		return this.type;
	}
}

// dimension class
class Dimension {
	pt1 = [];
	pt2 = [];
	label = '';
	direction = '';
	boundRect = [[], []];
	flippedBoundRect = false;
	constructor(pt1, pt2, label, direction = '') {
		if (pt1[1] == pt2[1]) {
			if (pt1[0] > pt2[0]) {
				this.pt1 = pt2;
				this.pt2 = pt1;
			} else {
				this.pt1 = pt1;
				this.pt2 = pt2;
			}
		} else {
			if (pt1[1] > pt2[1]) {
				this.pt1 = pt2;
				this.pt2 = pt1;
			} else {
				this.pt1 = pt1;
				this.pt2 = pt2;
			}
		}
		this.label = label;
		if (direction === '') {
			this.calcDirection();
		} else {
			this.direction = direction;
		}

		this.calcBoundRect();
		this.flippedBoundRect = false;
	}

	get pt1() {
		return this.pt1;
	}

	get pt2() {
		return this.pt2;
	}

	get label() {
		return this.label;
	}

	get boundRect() {
		return this.calcBoundRect();
	}

	get flippedBoundRect() {
		return this.flippedBoundRect;
	}

	setFlippedBoundRect() {
		this.flippedBoundRect = true;
	}

	setBoundRect(rect) {
		this.boundRect = rect;
	}

	calcBoundRect() {
		this.boundRect = [];
		switch (this.direction) {
			case 'h':
				this.boundRect = [
					[this.pt1[0], this.pt1[1] + 260],
					[this.pt2[0], this.pt2[1] + 100],
				];
				break;

			case 'v':
				this.boundRect = [
					[this.pt1[0] - 260, this.pt1[1]],
					[this.pt2[0] - 100, this.pt2[1]],
				];
				break;
		}
		return this.boundRect;
	}

	get direction() {
		return this.calcDirection();
	}

	calcDirection() {
		if (this.pt1[1] === this.pt2[1]) {
			// horizotal
			this.direction = 'h';
		} else if (this.pt1[0] === this.pt2[0]) {
			// vertical
			this.direction = 'v';
		}
		return this.direction;
	}
}

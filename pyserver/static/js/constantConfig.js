
var APIAddress = {
    // Login User Module API
    //Test
    login: "http://3.7.252.246:3000/api/user/login",

    //Prod
    // login: "http://35.154.121.217:8080/api/user/login",
    
    // User Interface API
    readJSO: "http://localhost:4000/json",
    
    // Transaction Service API\
    //Test 
    getWdProject: "http://localhost:3000/api/project/wdProject",
    getBtnClickProject: "http://localhost:3000/api/project/wdProject",
    generatePDF: "http://localhost:3000/api/working-drawing/generate_pdf", 
    // importSaveJSON: "http://localhost:4000/static/json1.json",

    //Prod
    // getWdProject: "http://15.207.181.191:8080/api/project/wdProject",
    // getBtnClickProject: "http://15.207.181.191:8080/api/project/wdProject",
    // generatePDF: "http://15.207.181.191:8080/api/working-drawing/generate_pdf", 
}
var decorpotOrg = {
    DPLogo: 'https://naraci-test.s3.ap-south-1.amazonaws.com/decorpot/static/decorpot.png',
    DPName: 'Decorpot',
    DPAddress: 'No 17, 2nd floor, 18th Cross Rd, Sector 4, HSR Layout'
}

// PDF Generation Optimization Settings
var PDFConfig = {
    // Current active profile - set to 'optimized' for smaller files like NewWDRequirements
    activeProfile: 'optimized',
    
    // Profile definitions
    profiles: {
        // High quality profile (similar to old system) - larger files
        high: {
            canvas: { scale: 1.5, logging: false, removeContainer: true, imageTimeout: 15000 },
            image: { format: 'png', quality: 1.0, compression: false },
            pdf: { compress: false, precision: 4, margins: 10 }
        },
        
        // Optimized profile (NEW) - smaller files similar to NewWDRequirements  
        optimized: {
            canvas: { scale: 0.8, logging: false, removeContainer: true, imageTimeout: 15000 },
            image: { format: 'jpeg', quality: 0.85, compression: true },
            pdf: { compress: true, precision: 2, margins: 10 }
        },
        
        // Ultra-compressed profile - smallest files
        ultracompressed: {
            canvas: { scale: 0.6, logging: false, removeContainer: true, imageTimeout: 15000 },
            image: { format: 'jpeg', quality: 0.7, compression: true },
            pdf: { compress: true, precision: 1, margins: 15 }
        }
    },
    
    // Get current active configuration
    get canvas() { return this.profiles[this.activeProfile].canvas; },
    get image() { return this.profiles[this.activeProfile].image; },
    get pdf() { return this.profiles[this.activeProfile].pdf; }
}

// var prodAPIAddress = {
//     login: "http://15.207.19.54:8080/api/user/login",
//     readJSO: "http://65.0.215.24:4000/json",
//     getWdProject: "http://15.207.181.191:8080/api/project/wdProject",
//     getBtnClickProject: "http://15.207.181.191:8080/api/project/wdProject",
//     generatePDF: "http://15.206.209.192:8080/api/working-drawing/generate_pdf", //http://15.207.181.191:8080/api/
// }

let terminalCreated = false

function savePositionToLocalStorage(x, y){
    localStorage.setItem("position", JSON.stringify({ x:x, y:y }))
}

function getPositionFromLocalStorage(){
    const positionString = localStorage.getItem('position')
    try{
        const { x, y } = JSON.parse(positionString)

        return { x, y }
    }catch(e){
        return { x:0, y:0 }
    }
}

function getSizeFromLocalStorage(){
    const height = localStorage.getItem('height')
    const width = localStorage.getItem('width')
    return { height, width }
}



const { x, y } = getPositionFromLocalStorage()
let { height, width } = getSizeFromLocalStorage()
if(height == undefined || width == undefined){
    //default size
    height = "300px"
    width = "500px"
}



function saveSizeToLocalStorage(height, width){
    saveHeightToLocalStorage(height)
    saveWidthToLocalStorage(width)
}

function saveHeightToLocalStorage(height){
    localStorage.setItem("height",height)
}

function saveWidthToLocalStorage(width){
    localStorage.setItem("width",width)
}

const createConsole = (id) =>{
    // Set the command-line prompt to include the user's IP Address
    //$('.prompt').html('[' + codehelper_ip["IP"] + '@HTML5] # ');
    
     $('.prompt').html('[user@shell] ');
         
     // Initialize a new terminal object
     const term = new TerminalEmulator(id);
    //  const term = new TerminalEmulator(
    //      '#input-line .cmdline', 
    //      '#container output',
    //      '#terminal-window'
    //      );
     // console.log(term)
     term.init();
     terminalCreated = true
 }

function createTerminalWindow(){
    const id = spawnTerminalContainer()
    createConsole(id);
    const terminal = document.getElementById("terminal-window-"+id)
    terminal.style.visibility = "visible"
    const win = new WinBox({ 
        x:x,
        y:y,
        title: "", 
        mount: terminal,
        height: "300px",//height,
        width: "500px",//width,
        onmove: function(x, y){
            savePositionToLocalStorage(x, y)
            console.log(x, y)
        },
        onresize:(width, height)=>{
            saveSizeToLocalStorage(height, width)
            console.log(height, width)
        }
    });
    terminal.style.height = "100%"
    terminal.style.width = "100%"
    // win.removeControl("wb-close")
}

setInterval(()=>{
    const date = new Date()
    $("#clock").text(`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`)
}, 1000)
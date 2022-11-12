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

const getHeight = () =>{
    let height = localStorage.getItem("height")

    if(!height)
        return "300px"
    else
        return height
}

const getWidth = () =>{
    let width = localStorage.getItem("width")

    if(!width)
        return "500px"
    else
        return width
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
     $('.prompt').html('[user@shell] ');
         
     // Initialize a new terminal object
     const term = new TerminalEmulator(id);
     term.init();
     terminalCreated = true
 }

function createTerminalWindow(){
    const id = spawnTerminalContainer()
    createConsole(id);
    const terminal = document.getElementById("terminal-window-"+id)
    terminal.style.visibility = "visible"

    const termWindow = new WinBox({ 
        x:x,
        y:y,
        title: "", 
        mount: terminal,
        height: "300px",//getHeight(),//height,
        width: "500px",//getWidth(),//width,
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
}

setInterval(()=>{
    const date = new Date()
    $("#clock").text(`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`)
}, 1000)
const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)

function savePositionToLocalStorage(x, y){
    localStorage.setItem("position", JSON.stringify({ x:Math.floor(x), y:Math.floor(y) }))
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

const getPosition = () =>{
    const { x, y } = getPositionFromLocalStorage()
    if(vw < 1000){
        return { x:0, y:0 }
    }else{
        return { x:x,y:y }
    }
}

// const { x, y } = getPositionFromLocalStorage()
const { x, y } = getPosition()

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
 }

 const activeTerminals = []

 const spawnTerminalContainer = ()=>{
   const id = Date.now()
   const domElement = `
   <div id="terminal-window-${id}" class="terminal-window" style="">
     <div id="container-${id}" class="container">
             <output id="output-${id}" class="output">
             </output>
             <div action="#" id="input-line-${id}" class="input-line">
                 <div id="prompt-${id}" class="prompt">
                 </div>
                 <div>
                   <input id="cmdline-${id}" class="cmdline" autofocus />
                 </div>
             </div>
     </div>
   </div>
   `
   const parentNode = $("#main-container")
   parentNode.append(domElement)
   activeTerminals.push(id)
   return id
 }

function createTerminalWindow(){
    if(activeTerminals.length > 20) throw new Error('Cannot open more than 20 terminals')
    const id = spawnTerminalContainer()
    createConsole(id);
    const terminal = document.getElementById("terminal-window-"+id)
    terminal.style.visibility = "visible"

    const termWindow = new WinBox({ 
        x:50,
        y:50,
        title: "", 
        mount: terminal,
        height: "300px",//getHeight(),//height,
        width: "500px",//getWidth(),//width,
        onmove: function(x, y){
            savePositionToLocalStorage(Math.floor(x), Math.floor(y))
        },
        onresize:(width, height)=>{
            saveSizeToLocalStorage(height, width)
            console.log(height, width)
        },
        onclose:()=>{
            terminal.remove();
        }
    });
    terminal.style.height = "100%"
    terminal.style.width = "100%"
}

setInterval(()=>{
    const date = new Date()
    $("#clock").text(`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`)
}, 1000)
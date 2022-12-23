const createConsole = (id) =>{
    // Initialize a new terminal object
    const term = new Terminal(id);
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
                   <input tabindex="0" id="cmdline-${id}" class="cmdline" autofocus />
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

function createTerminalWindow(x=0, y=0, opts){
    if(activeTerminals.length > 20) throw new Error('Cannot open more than 20 terminals')
    const id = spawnTerminalContainer()
    createConsole(id);
    const terminal = document.getElementById("terminal-window-"+id)
    terminal.style.visibility = "visible"

    const termWindow = createWindow({ 
        x:x,
        y:y,
        label:"terminal-window-"+id,
        launcher:{
          name:"createTerminalWindow",
          params:[x, y, opts]
        },
        title: "", 
        mount: terminal,
        onclose:()=>{
            terminal.remove();
            terminal.style.visibility = "hidden"
        },
    });

    terminal.style.height = "100%"
    terminal.style.width = "100%"
}

const initTerminalClock = () =>{
  setInterval(()=>{
    const date = new Date()
    $("#clock").text(`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`)
  }, 1000)
}
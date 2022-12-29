//  const Terminal = require('./terminal')
 const activeTerminals = []

 const spawnTerminalContainer = ()=>{
  //Assign a new directory pointer id everytime a terminal window is created
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

async function createTerminalWindow(x=0, y=0, opts){
    if(activeTerminals.length > 20) throw new Error('Cannot open more than 20 terminals')
    
    const terminalId = spawnTerminalContainer()
    const directoryPointerId = await getNewPointerId(terminalId)
    const term = new Terminal(terminalId, directoryPointerId);
    term.init();
    

    const terminalDOM = document.getElementById("terminal-window-"+terminalId)
    terminalDOM.style.visibility = "visible"

    const termWindow = createWindow({ 
        x:x,
        y:y,
        label:"terminal-window-"+terminalId,
        launcher:{
          name:"createTerminalWindow",
          params:[x, y, opts]
        },
        title: "", 
        mount: terminalDOM,
        onclose:()=>{
            terminalDOM.remove();
            terminalDOM.style.visibility = "hidden"
            term.close()
        },
    });

    termWindow.addControl({
        index: 0,
        class: "wb-panels",
        image: "./images/icons/panels.png",
        click: function(event, winbox){
            
            // the winbox instance will be passed as 2nd parameter
            if(!winbox.isSplitscreen){
                winbox.isSplitscreen = true
                winbox.resize("50%","100%")
            }else{
                winbox.resize("50%","50%")
                winbox.isSplitscreen = false
            }
        }
    })

    terminalDOM.style.height = "100%"
    terminalDOM.style.width = "100%"

    if(location.hostname == 'localhost'){
      
    }

}

const initTerminalClock = () =>{
  setInterval(()=>{
    const date = new Date()
    $("#clock").text(`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`)
  }, 1000)
}

// module.exports = createTerminalWindow
// module.exports = initTerminalClock
//  const Terminal = require('./terminal')
 const activeTerminals = []

//  const spawnTerminalContainer = ()=>{
//   //Assign a new directory pointer id everytime a terminal window is created
//    const id = Date.now() 
//    const domElement = `
//    <div id="terminal-window-${id}" class="terminal-window" style="">
//      <div id="container-${id}" class="container">
//              <output id="output-${id}" class="output">
//              </output>
//              <div action="#" id="input-line-${id}" class="input-line">
//                  <div id="prompt-${id}" class="prompt">
//                  </div>
//                  <div>
//                    <input tabindex="0" id="cmdline-${id}" class="cmdline" autofocus />
//                  </div>
//              </div>
//      </div>
//    </div>
//    `
//    const parentNode = $("#main-container")
//    parentNode.append(domElement)
//    activeTerminals.push(id)
//    return id
//  }

// async function createTerminalWindow(x=0, y=0, opts){
//     if(activeTerminals.length > 20) throw new Error('Cannot open more than 20 terminals')
    
//     const terminalId = spawnTerminalContainer()
//     const directoryPointerId = await getNewPointerId(terminalId)
//     let term = new Terminal(terminalId, directoryPointerId);
//     term.init();
    

//     const terminalDOM = document.getElementById("terminal-window-"+terminalId)
//     terminalDOM.style.visibility = "visible"

//     const termWindow = createWindow({ 
//         x:x,
//         y:y,
//         label:"terminal-window-"+terminalId,
//         launcher:{
//           name:"createTerminalWindow",
//           params:[x, y, opts]
//         },
//         title: "", 
//         mount: terminalDOM,
//         onclose:()=>{
//             terminalDOM.remove();
//             terminalDOM.style.visibility = "hidden"
//             term = null
//         },
//     });

//     termWindow.addControl({
//         index: 0,
//         class: "wb-panels",
//         image: "./images/icons/panels.png",
//         click: function(event, winbox){
            
//             // the winbox instance will be passed as 2nd parameter
//             if(!winbox.isSplitscreen){
//                 winbox.isSplitscreen = true
//                 winbox.resize("50%","100%")
//             }else{
//                 winbox.resize("50%","50%")
//                 winbox.isSplitscreen = false
//             }
//         }
//     })

//     terminalDOM.style.height = "100%"
//     terminalDOM.style.width = "100%"

//     if(location.hostname == 'localhost'){
      
//     }

// }

// const initTerminalClock = () =>{
//   setInterval(()=>{
//     const date = new Date()
//     $("#clock").text(`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`)
//   }, 1000)
// }

class TerminalWindow{
  constructor(x=0, y=0, opts={}){
    this.x = x
    this.y = y
    this.opts = opts
    this.terminalId = Date.now()
    this.term = ""
    this.directoryPointerId = ""
    this.terminalDOM = ""
    this.init()
  }

  async init(){
    await this.injectDOM()
    this.directoryPointerId = await getNewPointerId(this.terminalId)

    this.terminalDOM = document.getElementById("terminal-window-"+this.terminalId)
    this.terminalDOM.style.visibility = "visible"

    this.term = new Terminal(this.terminalId, this.directoryPointerId);
    this.term.init();

    this.termWindow = createWindow({ 
        x:this.x,
        y:this.y,
        label:"terminal-window-"+this.terminalId,
        launcher:{
          name:"createTerminalWindow",
          params:[this.x, this.y, this.opts]
        },
        title: "", 
        mount: this.terminalDOM,
        onclose:()=>{
            this.terminalDOM.remove();
            this.terminalDOM.style.visibility = "hidden"
            this.term = null
            delete window.openWindows["terminal-window-"+this.terminalId]
        },
    });

    this.termWindow.addControl({
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

    this.terminalDOM.style.height = "100%"
    this.terminalDOM.style.width = "100%"

  }

  async injectDOM(){
    //Assign a new directory pointer id everytime a terminal window is created
    const domElement = `
    <div id="terminal-window-${this.terminalId}" class="terminal-window" style="">
      <div id="container-${this.terminalId}" class="container">
              <output id="output-${this.terminalId}" class="output">
              </output>
              <div action="#" id="input-line-${this.terminalId}" class="input-line">
                  <div id="prompt-${this.terminalId}" class="prompt">
                  </div>
                  <div>
                    <input tabindex="0" id="cmdline-${this.terminalId}" class="cmdline" autofocus />
                  </div>
              </div>
      </div>
    </div>
    `
    const parentNode = $("#main-container")
    parentNode.append(domElement)
    activeTerminals.push(this.terminalId)
    return true
  }

}

// module.exports = createTerminalWindow
// module.exports = initTerminalClock
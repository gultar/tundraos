//  const Terminal = require('./terminal')
 const activeTerminals = []
window.activeTerminals = {}


class TerminalWindow{
  constructor(opts={}){
    const { x, y } = opts
    this.x = x
    this.y = y
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

    this.termWindow = new ApplicationWindow({ 
        x:this.x,
        y:this.y,
        label:"terminal-window-"+this.terminalId,
        launcher:{
          name:"TerminalWindow",
          opts:{
            x:this.x,
            y:this.y,
          }
        },
        title: "", 
        mount: this.terminalDOM,
        onclose:()=>{
            this.terminalDOM.remove();
            this.terminalDOM.style.visibility = "hidden"
            this.term = null
            
            delete window.activeTerminals[this.terminalId]
            destroyPointer(this.directoryPointerId)
            // delete window.openWindows["terminal-window-"+this.terminalId]
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
    window.activeTerminals[this.terminalId] = this.term
    return true
  }

}

window.TerminalWindow = TerminalWindow
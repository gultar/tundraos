window.openWindows = {}
window.launchSequence = []

// const createWindow = (opts) =>{
//     if(!opts.width) opts.width = "500"
//     if(!opts.height) opts.height = "350"
//     const newWindow = new WinBox(opts)
//     newWindow.min = false
//     const name = opts.label || opts.title
//     newWindow.launcher = opts.launcher
//     window.openWindows[name] = newWindow
    
//     return newWindow
// }

class ApplicationWindow extends WinBox{
    constructor(opts){
        if(!opts.width) opts.width = "500"
        if(!opts.height) opts.height = "350"
        super(opts)
        this.min = false
        
        this.name = opts.label || opts.title
        this.launcher = opts.launcher
        
        this.onclose = (callback=()=>{}) =>{
            delete window.openWindows[this.name]
            opts.onclose(callback)
        }
        
        window.openWindows[this.name] = this

    }
    
    destroy(callback){
        delete window.openWindows[this.name]
    }
}

const minimizeAllWindows = (force=false) =>{
    for(const windowName in window.openWindows){
        const instance = window.openWindows[windowName]
        const state = (force?true:!instance.min)
        if(instance && instance.minimize) 
            instance.minimize(state)
    }
}

const revertWindowStates = () =>{

}

const saveWindowState = () =>{
    for(const windowName in window.openWindows){
        const instance = window.openWindows[windowName]
        window.launchSequence.push(instance.launcher)
    }

    localStorage.setItem("launchSequence", JSON.stringify(window.launchSequence))
}

const loadWindowState = () =>{
    const launchSequenceString = localStorage.getItem("launchSequence")
    const launchSequence = JSON.parse(launchSequenceString)
    console.log('launchSequence', launchSequence)
    for(const launcher of launchSequence){
        //
        console.log('launcher.name', window[launcher.name])
        console.log('launcher.params', ...launcher.params)
        window[launcher.name](...launcher.params)
        
    }

    window.launchSequence = []
}

const cycleThroughWindows = () =>{
    let position = 0
    let windowNames = []
    $(document).keydown(function(event) {
        if (event.ctrlKey && event.which == 9) {
            windowNames = Object.keys(window.openWindows)
            console.log(Object.keys(window.openWindows))
            minimizeAllWindows("force")
            if(windowNames.length > 0){
                console.log("Position", position)
                const windowName = windowNames[position]
                const openWindow = window.openWindows[windowName]
                console.log('Open Window', openWindow)
                if(openWindow) openWindow.minimize(false)
                position++
                if(position >= windowNames.length) position = 0
                
                
            }
        }
    });
}


window.openWindows = {}
window.launchSequence = {}

const storage = new Storage({})

class ApplicationWindow extends WinBox{
    constructor(opts){
        if(!opts.width) opts.width = "500"
        if(!opts.height) opts.height = "350"
        super(opts)
        
        this.name = opts.label || opts.title
        this.launcher = opts.launcher || {}

        saveState(this)

        this.onclose = (callback=()=>{}) =>{
            delete window.openWindows[this.name]
            delete window.launchSequence[this.name]
            if(opts.onclose) opts.onclose(callback)
        }
        
        this.onmove = (x, y) =>{
            if(this.launcher && this.launcher.opts){
                this.launcher.opts.x = x
                this.launcher.opts.y = y
                
                saveState(this)
            }
        }
        window.openWindows[this.name] = this

    }
    
    destroy(callback){
        delete window.openWindows[this.name]
    }
}

const saveState = (winbox) =>{
    window.launchSequence[winbox.name] = {
        launcher:{
            name:winbox.launcher.name,
            opts:winbox.launcher.opts
        }
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

const restoreAllWindows = () =>{
    for(const windowName in window.openWindows){
        const instance = window.openWindows[windowName]
        if(instance) 
            instance.restore(true)
    }
}

const revertWindowStates = () =>{

}

const saveWindowState = () =>{
    window.launchSequence = {}
    for(const windowLabel in window.openWindows){
        const instance = window.openWindows[windowLabel]
        saveState(instance)
    }

    storage.set("launch-sequence", window.launchSequence)
}


const loadWindowState = async () =>{
    const launchSequence = storage.get("launch-sequence")
    console.log('launchSequence', launchSequence)
    for(const windowLabel in launchSequence){
        try{
            const windowState = launchSequence[windowLabel]
            console.log('Window state', windowState)
            const { launcher, x, y } = windowState
            const { params, opts } = launcher
            
            const App = window[launcher.name]
            
            new App({ x:x, y:y, ...opts })

        }catch(e){
            console.log('Window Launcher Error', e)
        }
        
    }

}

const cycleThroughWindows = () =>{
    let position = 0
    let windowNames = []
    $(window).keydown(function(event) {
        if (event.ctrlKey && event.which == 9) { //CTRL + Tab
            windowNames = Object.keys(window.openWindows)
            console.log(Object.keys(window.openWindows))
            minimizeAllWindows("force")
            if(windowNames.length > 0){
                
                const windowName = windowNames[position]
                const openWindow = window.openWindows[windowName]
                
                if(openWindow) openWindow.minimize(false)
                position++
                if(position >= windowNames.length) position = 0
                
                
            }
        }
    });
}


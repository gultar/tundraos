window.openWindows = {}
window.launchSequence = []

const createWindow = (opts) =>{
    const newWindow = new WinBox(opts)
    const name = opts.label || opts.title
    newWindow.launcher = opts.launcher
    window.openWindows[name] = newWindow
    newWindow.onclose = ()=>{
        delete window.openWindows[name]
    }
    newWindow.onmove = (x, y) =>{
        window.openWindows[name].launcher.x = x
        window.openWindows[name].launcher.y = y

        console.log(window.openWindows[name].launcher.x, window.openWindows[name].launcher.y)
    } 
}

const minimizeAllWindows = (force=false) =>{
    for(const windowName in window.openWindows){
        const instance = window.openWindows[windowName]
        
        const state = (force?true:!instance.min)
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


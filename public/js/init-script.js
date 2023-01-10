// const { init } = require("node-wifi")
let initScriptStarted = false
const initScript = async () =>{
    if(initScriptStarted) return 'Already started'
    
    
    initScriptStarted = true
    initParticles()
    initClock()
    await getServerConfig()
    setUsernameAsGlobal()
    initDesktop()
    loadWindowState()
    startWindowStateRoutine()
    
    makeMockIpcRenderer()
    
    setTimeout(()=>{
        startHyperwatcher()
    }, 5000)
}

const makeMockIpcRenderer = () =>{
  //If it is runned from a simple http server, without Electron, make
  //a mock version based on event emitters to still enable communication to take place
  
  if(!window.ipcRenderer){
    window.ipcRenderer = {
      send:(eventType, payload)=>{
        window.sendEvent(eventType, payload)
      },
      on:(eventType, callback, ...opts)=>{
        window.addEventListener(eventType, callback, ...opts)
      }
    }
  }
}

const getServerConfig = async () =>{
    if(window.location.hostname == 'localhost'){
        const config = await $.get("http://localhost:8000/config")
        window.isElectron = config.electron
        window.MOUNT_POINT = config.mountPoint
        window.ENV = config.ENV
        console.log('Received mount point', config)
    }

    return true
}

const setUsernameAsGlobal = () =>{
    window.username = getUsername()
    console.log('Active user:',window.username)
}

const initClock = () => {
   
  const clockRoutine = setInterval(()=>{
    const date = new Date()
    $("#clock").text(`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`)
  }, 1000)

}

const startWindowStateRoutine = () =>{
  const stateRoutine =setInterval(()=>{
    saveWindowState()
  }, 1*1000)
}





// const { init } = require("node-wifi")
let initScriptStarted = false
const initScript = async () =>{
    if(initScriptStarted) return 'Already started'
    
    
    initScriptStarted = true
    await initParticles()
    await initClock()
    await getServerConfig()
    await setUsernameAsGlobal()
    await initDesktop()
    await loadWindowState()
    await startWindowStateRoutine()
    
    await monitorWifiConnectionStatus()

    await makeMockIpcRenderer()
    
   
    await watchBatteryLevel()
    
    await enableVolumeControlMenu()
    await watchVolumeControl()
    
    // await loadIconState()
    startSlowRoutine()
    setTimeout(()=>{
        toggleHyperwatch()
        drawSystemMonitor()
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

const monitorWifiConnectionStatus = async () =>{
  const wifiImage = document.querySelector("#wifi-icon-image")
  if(!wifiImage) throw new Error('Could not find wifi icon image')

  setInterval(async ()=>{
    const { result, error } = await runWifiCommand('list',{})

    if(result && result.length == 0){
      wifiImage.src = "./images/icons/no-wifi-color-medium.png"
    }else{
      wifiImage.src = "./images/icons/wifi-color-medium.png"
    }
  }, 10*1000)
}

const startWindowStateRoutine = () =>{
  const stateRoutine =setInterval(()=>{
    saveWindowState()
  }, 1*1000)
}





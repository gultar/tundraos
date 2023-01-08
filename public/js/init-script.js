// const { init } = require("node-wifi")

const initScript = async () =>{
    initParticles()
    initClock()
    await getServerConfig()
    setUsernameAsGlobal()
    initDesktop()
    loadWindowState()
    startWindowStateRoutine()
    
    
    setTimeout(()=>{
        startHyperwatcher()
    }, 5000)
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



initScript()


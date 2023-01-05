const initScript = () =>{
    initParticles()
    initClock()
    getServerConfig()
    setUsernameAsGlobal()
}

const getServerConfig = async () =>{
    if(window.location.hostname == 'localhost'){
        const config = await $.get("http://localhost:8000/config")
        window.isElectron = config.electron
        window.MOUNT_POINT = config.mountPoint
        console.log('Received mount point', config)
    }
}

const setUsernameAsGlobal = () =>{
    window.username = getUsername()
    console.log('Active user:',window.username)
}

const initClock = () => {
   
  setInterval(()=>{
    const date = new Date()
    $("#clock").text(`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`)
  }, 1000)

}



initScript()


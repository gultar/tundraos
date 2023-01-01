const initScript = () =>{
    initParticles()
    initClock()
    verifyIfElectronApp()
    setUsernameAsGlobal()
}

const verifyIfElectronApp = async () =>{
    if(window.location.hostname == 'localhost'){
        const origin = await $.get("http://localhost:8000/origin")
        window.isElectron = origin.electron
        window.MOUNT_POINT = origin.mountPoint
        console.log('Received mount point', origin)
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


const initScript = () =>{
    initParticles()
    initTerminalClock()
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


initScript()


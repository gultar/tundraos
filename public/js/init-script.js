const initScript = () =>{
    initParticles()
    setWaveEffect()
    initTerminalClock()
    determineOrigin()
    setUsernameAsGlobal()
}

const determineOrigin = async () =>{
    if(window.location.hostname == 'localhost'){
        const origin = await $.get("http://localhost:8000/origin")
        window.isElectron = origin.electron
    }
}

const setUsernameAsGlobal = () =>{
    window.username = getUsername()
    console.log(window.username)
}

initScript()


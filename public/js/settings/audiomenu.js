

const watchVolumeControl = () =>{
    const volumeControl = document.querySelector("#volume-slider")
    volumeControl.onchange = () =>{
        const level = volumeControl.value
        window.ipcRenderer.send('volume-change', level)
    }
    
}

const enableVolumeControlMenu = () =>{
    $("#audio-icon").click(e =>{
        makeAudioMenu(e.pageX, e.pageY)
    })
}


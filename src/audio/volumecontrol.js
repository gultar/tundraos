const {ipcMain} = require('electron');
const loudness = require("loudness")


const watchForVolumeChange = () =>{
    ipcMain.on('volume-change', async(event, level)=>{
        console.log('Volume level', level)
        await adjustVolume(level)
    })
}

const watchForVolumeMute = () =>{
    ipcMain.on('volume-mute', async(event, level)=>{
        await toggleMute()
    })
}

const adjustVolume = async (level) =>{
    await loudness.setVolume(level)
}

const toggleMute = async () =>{
    const mute = await loudness.getMuted()
    
    await loudness.setMuted(!mute)
}

module.exports = { 
    adjustVolume, 
    toggleMute, 
    watchForVolumeChange, 
    watchForVolumeMute 
    
}
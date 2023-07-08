'use strict';

const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const runServer = require('./server.js')
const {listenForDownloads} = require('./src/downloads/download-listener')
const contextMenu = require("electron-context-menu")
const mapLinuxFs = require("./src/filesystem/map-linux-fs")
const { watchForVolumeChange, watchForVolumeMute } = require("./src/audio/volumecontrol.js")
const { updateSystemMonitor } = require("./src/server-events/systeminfo.js")

let fullscreen = true
if(process.argv.includes("--no-full")){
  fullscreen = false
}

if(process.argv.includes("--silent-build")){
  process.silentBuild = true
}

if(process.argv.includes("--silent") || process.argv.includes("-s")){
  process.silent = true
}

if(process.argv.includes("--full-os") || process.argv.includes("-f")){
  process.fullOs = true
}


const setMountPoint = () =>{
  if(!process.fullOs)process.MOUNT_POINT = '.'
  else process.MOUNT_POINT = "/"
}



app.on('ready', async () => {
    if(process.fullOs){
      const linuxFs = await mapLinuxFs()
      global.linuxFs = linuxFs
    }

    setMountPoint()

    const config = { 
      electron:true, 
      mountPoint:process.MOUNT_POINT, 
    }

    runServer(config)
    
    const win = new BrowserWindow({
      width:(fullscreen? 1366:800),
      height:(fullscreen? 768:600),
      fullscreen:fullscreen,
      kiosk: fullscreen,
      autoHideMenuBar: true,
      frame: false,
      webPreferences: {
        nativeWindowOpen: true,
        devTools: true, // false if you want to remove dev tools access for the user
        contextIsolation: true,
        nodeIntegration:true,
        webviewTag: true, // https://www.electronjs.org/docs/api/webview-tag,
        preload: path.join(__dirname, "./public/js/preload.js"), // required for print function
      },
    });

    win.loadURL("http://localhost:8000/")
    
    watchForVolumeChange()
    watchForVolumeMute()
    updateSystemMonitor(win)
    
    listenForDownloads(win)
    
  
});

app.on("web-contents-created", (e, contents) => {
    contextMenu({
      window: contents,
      showInspectElement: true
   });
})

'use strict';

const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const runServer = require('./server.js')
const {listenForDownloads} = require('./src/downloads/download-listener')


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

process.MOUNT_POINT = "system"

app.on('ready', async () => {
    
    runServer({ electron:true, mountPoint:process.MOUNT_POINT || 'system' })
    
    const win = new BrowserWindow({
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


    console.log('Path', path.join(__dirname, "./public/js/preload.js"))
    win.loadURL("http://localhost:8000/")
    
    listenForDownloads(win)
  
});

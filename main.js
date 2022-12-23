'use strict';

const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const runServer = require('./server.js')
const buildUserspace = require('./src/filesystem/build-userspace.js')

let fullscreen = true
if(process.argv.includes("--no-full")){
  fullscreen = false
}

if(process.argv.includes("--silent-build")){
  process.silentBuild = true
}

if(process.argv.includes("--silent")){
  process.silent = true
}


console.log(process.argv)
app.on('ready', () => {
    
    runServer(null, { electron:true })

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
    
});

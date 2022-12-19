'use strict';

const {app, BrowserWindow} = require('electron');
const path = require('path');
const runServer = require('./server.js')
const buildUserspace = require('./src/filesystem/build-userspace.js')

// const FileSystem = buildUserspace("root")

app.on('ready', () => {
    runServer(null, { electron:true })

    const win = new BrowserWindow({
      fullscreen:true,
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
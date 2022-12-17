'use strict';

const {app, BrowserWindow} = require('electron');
const path = require('path');
const runServer = require('./server.js')
const buildUserspace = require('./src/filesystem/build-userspace.js')

const FileSystem = buildUserspace("root")

app.on('ready', () => {
    runServer(FileSystem)

    const win = new BrowserWindow({
      width: 768,
      height: 1024,
      webPreferences: {
        nativeWindowOpen: true,
        devTools: true, // false if you want to remove dev tools access for the user
        contextIsolation: true,
        webviewTag: true, // https://www.electronjs.org/docs/api/webview-tag,
        // preload: path.join(__dirname, "../preload.js"), // required for print function
      },
    });
    win.loadURL('file://' + path.join(__dirname, 'public/index.html'))
});
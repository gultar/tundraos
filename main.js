'use strict';

const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const runServer = require('./server.js')
const download = require('./src/downloads/downloader')

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

app.on('ready', () => {
    
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

    win.webContents.session.on('will-download', async (event, item, webContents) => {
      // Set the save path, making Electron not to prompt a save dialog.
      // item.setSavePath('/tmp/save.pdf')
      // console.log('Download Event',event)
      // console.log('Download Item', item.getURL())
      event.preventDefault()
      const { success, result, error } = await download(item.getURL(), __dirname+"/public/userspaces/guest/")
      if(success){
        console.log('Success', success)
      }

      if(result){
        console.log('Result', result)
      }

      if(error){
        console.log('Error', error)
      }
      // item.on('updated', (event, state) => {
      //   if (state === 'interrupted') {
      //     console.log('Download is interrupted but can be resumed')
      //   } else if (state === 'progressing') {
      //     if (item.isPaused()) {
      //       console.log('Download is paused')
      //     } else {
      //       console.log(`Received bytes: ${item.getReceivedBytes()}`)
      //     }
      //   }
      // })
      // item.once('done', (event, state) => {
      //   if (state === 'completed') {
      //     console.log('Download successfully')
      //   } else {
      //     console.log(`Download failed: ${state}`)
      //   }
      // })
    })
    console.log('Path', path.join(__dirname, "./public/js/preload.js"))
    win.loadURL("http://localhost:8000/")
    
});

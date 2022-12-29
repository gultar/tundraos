const {download, downloadWorker} = require('./downloader')
const {ipcMain} = require('electron');
const fs = require('fs').promises


let browserWin = ''

const listenForDownloads = (win) =>{

    browserWin = win
    win.webContents.session.on('will-download', async (event, item, webContents) => {
        let mountPoint = process.MOUNT_POINT || 'system'
        let activeUser = global.activeUser
    
        let downloadPath = `./public/userspaces/${activeUser}/home/downloads`
        let virtualDownloadPath = `/${mountPoint}/${activeUser == 'root'?'public/userspaces/root/home/downloads':'home/downloads'}`
        
        const url = item.getURL()
        const presaveFilename = item.getFilename()  

        event.preventDefault()
        
        const { path, filename, cancelled } = await seekDownloadPath(virtualDownloadPath, presaveFilename)
        if(cancelled) return false

        if(path){
            const convertedPath = global.FileSystem.persistance.resolvePath(path)
            downloadPath = convertedPath
            virtualDownloadPath = path
        }
            
        const { success, error } = await downloadWorker(url, downloadPath, win.webContents)
        if(error){
            win.webContents.send('download-complete',{ error:error })
            
        }else{
            win.webContents.send('download-complete',{ success:success })
            
            const filePath = success.filePath
            const filePathArray = filePath.split("/")
            const savedFilename = filePathArray.pop()
            
            await global.FileSystem.createVirtualFile(virtualDownloadPath+"/"+savedFilename)
        }
        
      })
}

const seekConfirmation = () =>{
    return new Promise((resolve)=>{
      ipcMain.on('download-confirmed', (event, isConfirmed)=>{
        resolve(isConfirmed)
      })
      browserWin.webContents.send('confirm-download', 'rockets')
    })
}

const seekDownloadPath = (startingPath, filename) =>{
    return new Promise((resolve)=>{
        ipcMain.on('download-path-selected', (event, message)=>{
            console.log('Received', message)
            const { selected, cancelled } = message
            if(cancelled) resolve({ cancelled:cancelled })
            else resolve({ path:selected.path, filename:selected.filename })
        })
        browserWin.webContents.send('select-download-path',startingPath)
    })
}

module.exports = { listenForDownloads }
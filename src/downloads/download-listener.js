const {download, downloadWorker} = require('./downloader')
const {ipcMain} = require('electron');
const fs = require('fs').promises
const Https = require('https')


let browserWin = ''

const listenForDownloads = async (win) =>{

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
        if(path){
            const convertedPath = global.FileSystem.persistance.resolvePath(path)
            downloadPath = convertedPath
            virtualDownloadPath = path
        }
        
        let success = false
        let error = false  
        if(cancelled) return false

        if(url.includes("http")){
            const result = await downloadWorker(url, downloadPath, win.webContents)
            success = result.success
            error = result.error
        }else if(url.includes('data:')){
            
            let base64File = url.split(';base64,').pop();
            // console.log('Path', downloadPath)
            // console.log('Filename', filename)
            // console.log('downloadPath+filename',downloadPath+filename)
            const saved = await global.FileSystem.persistance.saveBase64File(base64File, downloadPath+"/"+filename)
            if(saved.error) error = saved.error
            else success = {
                filePath:downloadPath+"/"+filename,
            }
        }
        
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
        ipcMain.once('download-path-selected', (event, message)=>{
            console.log('Received', message)
            const { selected, cancelled } = message
            if(cancelled) resolve({ cancelled:cancelled })
            else resolve({ path:selected.path, filename:selected.filename })
        })
        browserWin.webContents.send('select-download-path',startingPath)
    })
}

module.exports = { listenForDownloads }
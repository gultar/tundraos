const { ipcMain } = require('electron')

const listenerForPointerEvents = (win) =>{

    ipcMain.on('destroy-pointer', (id)=>{
        if(!id) win.webContents.send("destroy-pointer-error", { error:"Need to provide id of pointer to destroy" })
        else{
            FileSystem.deletePointer(id)
            win.webContents.send("pointer-destroyed", { destroyed:id })
        }
    })
    
    ipcMain.on('destroy-all-pointers', ()=>{
        FileSystem.deleteAllPointers()
        win.webContents.send("pointer-destroy", { destroyed:"all" })
    })

    ipcMain.on('make-pointer', (instanceId)=>{
        if(!instanceId){
            win.webContents.send("make-pointer-error", { error:"Need to provide id of calling process to make pointer" })
        }else{
            const { id } = FileSystem.createPointer(instanceId)
            win.webContents.send("pointer-created", { id:id })
        }
        
    })
}


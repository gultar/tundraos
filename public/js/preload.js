const { ipcRenderer, contextBridge } = require('electron')

contextBridge.exposeInMainWorld('ipcRenderer',{
  send:(...args)=>ipcRenderer.send(...args),
  on:(...args)=>ipcRenderer.on(...args)
})


window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }

    window.addEventListener('isDownloading', (event)=>{
      ipcRenderer.send('isDownloading', event)
    })
    
    for (const dependency of ['chrome', 'node', 'electron']) {
      replaceText(`${dependency}-version`, process.versions[dependency])
    }
})

//test
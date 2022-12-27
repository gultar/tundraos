const { ipcRenderer, contextBridge } = require('electron')

ipcRenderer.on('asynchronous-reply', (_event, arg) => {
  console.log(arg) // affiche "pong" dans la console DevTools

  setTimeout(()=>{
    ipcRenderer.send('asynchronous-message', 'ping')
  }, 5000)
})

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

// window.isElectron = { electron:'electron' }
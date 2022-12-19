const launchBrowser = (url='https://www.google.com/webhp?igu=1') =>{
    const browserView = document.getElementById("browser-view")
    
    if(window.isElectron){
        browserView.innerHTML = `
        <webview id="webview" src="${url}" autosize="on" style="min-width:900px; min-height:1200px">
        </webview>
        `
    }
    else{
        browserView.innerHTML = `<iframe id="webview" src="${url}" autosize="on" style="min-width:900px; min-height:1200px"></iframe>`
    }
    const webview = document.getElementById("webview")
    
    browserView.style.visibility = 'visible'
    const browserWindow = new WinBox({ title:"Browser", mount:browserView, onclose:()=>{
        browserView.style.visibility = 'hidden'
        browserView.innerHTML = ""
        
      } 
    })
    
}
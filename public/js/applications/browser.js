const launchBrowser = (url='https://www.google.com/webhp?igu=1') =>{
    const browserView = document.getElementById("browser-view")
    let browserDOM = ""
    let menuDOM = `
    <link rel="stylesheet" href="./css/browser.css">  
    <div id="browser-menu">
        <div id="navigation-buttons">
            <span class="button"><a id="back-button" onclick="back();return false;"></a></span>
             | 
            <span class="button" ><a id="forward-button" onclick="forward();return false;"></a></span>
        </div>
        <div id="url-container">
            <input id="url-bar" type="text" placeholder="http://google.com" value="${url}">
            <button class="button" onclick="addNewURL(document.getElementById('url-bar').value)">GO</button>
        </div>
        <span class="button" id="settings-button"><a onclick="console.log('settings')"><img src="./images/icons/settings.png"></a></span>
    </div>
    `

    if(window.isElectron){
        browserDOM = `
        <webview class="responsive-webview" id="webview" src="${url}" autosize="on" style="min-width:900px; min-height:1200px">
        </webview>
        `
        
    }
    else{
        browserDOM = `<iframe class="responsive-webview" id="webview" src="${url}" autosize="on" style="min-width:900px; min-height:1200px"></iframe>`
    }
    
    browserView.innerHTML = menuDOM + browserDOM
    const webview = document.getElementById("webview")
    
    browserView.style.visibility = 'visible'
    const browserWindow = new WinBox({
        height:"100%",
        width:"100%", 
        title:"Browser", 
        mount:browserView, 
        onclose:()=>{
            browserView.style.visibility = 'hidden'
            browserView.innerHTML = ""
            
        } 
    })

    // startPageWatcher()
    
}
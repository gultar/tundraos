let activeWebviews = {}
const launchBrowser = (url) =>{
    if(!url){
        if(window.isElectron) url = "https://google.com"
        else url = 'https://www.google.com/webhp?igu=1'
    }

    let browserNumber = Object.keys(activeWebviews)+1

    const browserView = document.getElementById("browser-view")
    let browserDOM = ""
    let menuDOM = `
    <link rel="stylesheet" href="./css/browser.css">  
    <div id="browser-menu" style="min-width:125%;">
        <div id="navigation-buttons">
            <span class="button"><a id="back-button" onclick="back();return false;"></a></span>
                | 
            <span class="button" ><a id="forward-button" onclick="forward();return false;"></a></span>
        </div>
        <div id="url-container">
            <input id="url-bar" type="text" placeholder="http://google.com" value="${url}">
            <button id="url-button" onclick="addNewURL(document.getElementById('url-bar').value)"> -GO- </button>
        </div>
        <span class="button" id="settings-button"><a onclick="console.log('settings')"><img src="./images/icons/settings.png"></a></span>
    </div>
    `

    if(window.isElectron){
        browserDOM = `
        <webview class="responsive-webview" id="webview" src="${url}" autosize="on" style="display:flex; min-width:125%; min-height:118%" >
        </webview>
        `
    }
    else{
        browserDOM = `<iframe class="responsive-webview" id="webview" src="${url}" autosize="on"></iframe>`
    }
    
    browserView.innerHTML = menuDOM + browserDOM

    const pressEnterSubmit = (e)=>{
        if(e.key == "Enter"){
            addNewURL(document.getElementById('url-bar').value)
        }
    }

    browserView.addEventListener("keypress", pressEnterSubmit)
    
    browserView.style.visibility = 'visible'
    const browserWindow = new WinBox({
        height:"80%",
        width:"80%", 
        title:"Browser", 
        mount:browserView, 
        onclose:()=>{
            browserView.style.visibility = 'hidden'
            browserView.innerHTML = ""
            browserView.removeEventListener("keypress", pressEnterSubmit)
        } 
    })

    let history = []
    let backStack = []
    let forwardStack = []
    let current = ""
    let isBackEvent = false;
    let isForwardEvent = false;
    let webview = document.getElementById("webview")

    const startPageWatcher = () =>{

        const addUrlToHistory = (url) =>{

            history.push(url)
            if(!isBackEvent && !isForwardEvent){
                backStack.push(url)
                forwardStack = []
            }else{
                isBackEvent = false
                isForwardEvent = false
            }

        }
        
        webview = document.getElementById("webview")
        if(window.isElectron){
            //webview tag
            webview.addEventListener('did-finish-load', (e) => {
                const url = webview.getURL()
                addUrlToHistory(url)
                setURL(url)
            })

            webview.addEventListener('did-start-loading', (e) => {
                const url = webview.getURL()
                setURL(url)
            })

        }else{
            //iframe tag
            webview.onload = () =>{
                url = webview.src
                
                addUrlToHistory(url)
                setURL(url)
            }
        }
        
    }

    const setURL = (url) => {
        console.log('Setting URL', url)
        document.getElementById('url-bar').value = url.trim()
    }

    const visit = (url, index="none") =>{
        
        if(window.isElectron){
            webview.loadURL(url)
        }else{
            webview.src = url
        }

        
    }

    const addNewURL = (url) =>{
        isGoogleSearch(url)
        return true
    }


    const forward = () =>{
        let next = forwardStack.pop()
        if(next) backStack.push(next)
        const url = backStack[backStack.length - 1]
        isForwardEvent = true

        visit(url)
    }

    const back = () =>{
        let last = backStack.pop()
        forwardStack.push(last)
        const url = backStack[backStack.length - 1]
        isBackEvent = true
        
        visit(url)
    }

    const isURL = (string) =>{
        const urlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/
        return urlRegex.test(string)
    }

    const isValidDomain = (string) =>{
        const domainRegex = new RegExp(/^(?!-)[A-Za-z0-9-]+([\-\.]{1}[a-z0-9]+)*\.[A-Za-z]{2,6}$/)

        return domainRegex.test(string)
    }

    const isGoogleSearch = (question) =>{
        if(question.slice(0, 4) == "http"){
            visit(question)
        }else if(isValidDomain(question)){
            visit("https://"+question)
        }else{
            searchOnGoogle(question)
        }
    }

    const searchOnGoogle = (question) =>{
        visit(`https://www.google.com/search?q=${question}`)
    }

    startPageWatcher()
    
}

window.launchBrowser = launchBrowser
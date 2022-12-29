let activeWebviews = {}
const launchBrowser = (url) =>{
    if(!url){
        if(window.isElectron) url = "https://google.com"
        else url = 'https://www.google.com/webhp?igu=1'
    }

    let browserNumber = Date.now()

    const browserView = document.getElementById("browser-view")
    let browserDOM = ""

    if(window.isElectron){
        browserDOM = `
        <webview 
            class="responsive-webview" 
            id="webview-${browserNumber}" 
            src="${url}" 
            autosize="on" 
            style="display:flex; 
            min-width:100%; 
            min-height:95%" >
        </webview>
        `
    }
    else{
        browserDOM = `<iframe class="responsive-webview" id="webview-${browserNumber}" src="${url}" autosize="on"></iframe>`
    }

    let menuDOM = `
    <link rel="stylesheet" href="./css/browser.css">  
    <div id="browser-container-${browserNumber}" class="browser-container">
        <div class="browser-menu" style="min-width:100%;">
            <div class="navigation-buttons">
                <span class="button"><a class="back-button" onclick="window.postMessage({ back:'browser-${browserNumber}' });return false"></a></span>
                    | 
                <span class="button" ><a class="forward-button" onclick="window.postMessage({ forward:'browser-${browserNumber}' });return false"></a></span>
                <span class="button" ><a class="refresh-button" onclick="window.postMessage({ refresh:'browser-${browserNumber}' });return false"><img src="./images/icons/refresh.png"/></a></span>
            </div>
            <div class="url-container">
                <input id="url-bar-${browserNumber}" class="url-bar" type="text" placeholder="http://google.com" value="${url}">
                <button 
                id="url-button" 
                class="url-button"
                onclick="
                    window.postMessage({ 
                        visitURL:{ 
                            url:document.getElementById('url-bar-${browserNumber}').value, 
                            targetBrowser:'${browserNumber}' 
                        } })"> 
                         GO  
                </button>
            </div>
            <span class="button" class="settings-button"><a onclick="console.log('settings')"><img src="./images/icons/settings.png"></a></span>
        </div>
        ${browserDOM}
    </div>
    `
    let oldState = browserView.innerHTML
    browserView.innerHTML = oldState + menuDOM
    
    const browserContainer = document.querySelector(`#browser-container-${browserNumber}`)

    const getURLValue = () =>{
        return document.getElementById('url-bar-'+browserNumber).value
    }

    const pressEnterSubmit = (e)=>{
        if(e.key == "Enter"){
            addNewURL(getURLValue())
        }
    }

    browserContainer.addEventListener("keypress", pressEnterSubmit)
    
    window.addEventListener("message", (event)=>{
        console.log('Message', event)
        const message = event.data
        if(message.back){
            
            if(message.back == `browser-${browserNumber}`){
                webview.goBack()
            }
        }else if(message.forward){
            
            if(message.forward == `browser-${browserNumber}`){
                webview.goForward()
            }
            
        }else if(message.refresh){
            
            if(message.refresh == `browser-${browserNumber}`){
                webview.reload()
            }
            
        }else if(message.visitURL){
            const { url, targetBrowser } = message.visitURL
            addNewURL(url)
        }
    })

    let history = []
    let backStack = []
    let forwardStack = []
    
    let isBackEvent = false;
    let isForwardEvent = false;
    let webview = document.getElementById("webview-"+browserNumber)

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

            // webview.getWebContents().session.on('will-download', (evt, item) => {
            //     console.log('Webview event', evt)
            //     console.log('Webview download item', item)
            // })

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
        document.getElementById('url-bar-'+browserNumber).value = url.trim()
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

    const browserWindow = new WinBox({
        height:"80%",
        width:"80%", 
        title:"Browser", 
        mount:browserContainer, 
        launcher:{
            //enables start at boot
            name:"launcherBrowser",
            params:[url]
        },
        onclose:()=>{
            browserView.innerHTML = oldState
            browserContainer.removeEventListener("keypress", pressEnterSubmit)
        } 
    })

    activeWebviews[browserNumber] = browserWindow
    startPageWatcher()

    const downloadCompleteHandler = (event, message)=>{
        const { success, error } = message
        if(success) popup(`Success: ${JSON.stringify(success, null, 2)}`)
        else if(error) popup(`Error: ${JSON.stringify(error, null, 2)}`)
    }

    const confirmDownloadHandler = (url)=>{
        confirmation({
            message:"Are you sure you want to download this file?",
            yes:()=>{
                window.ipcRenderer.send('download-confirmed', true)
            },
            no:()=>{
                window.ipcRenderer.send('download-confirmed', false)
            }
        })
    }

    const selectDownloadPathHandler = (event, message)=>{
        const startingPath = message

        new SaveAsDialog({
            startingPath:startingPath,
            filename:""
        })

    }

    window.ipcRenderer.on('confirm-download', confirmDownloadHandler)
    window.ipcRenderer.on('select-download-path', selectDownloadPathHandler)
    window.ipcRenderer.on('download-complete', downloadCompleteHandler)
    window.addEventListener('message', (event)=>{
        const message = event.data
        if(message.dialogSave){
            window.ipcRenderer.send('download-path-selected',{ selected:message.dialogSave })
        }else if(message.dialogCancel){
            window.ipcRenderer.send('download-path-selected',{ cancelled:true })
        }
    })
    
}

window.launchBrowser = launchBrowser
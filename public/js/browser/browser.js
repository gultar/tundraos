activeWebviews = {}



class Browser{
    constructor(opts={}){
        let { url, attach, browsersContainer } = opts
        if(!url){
            if(window.isElectron) url = "https://google.com"
            else url = 'https://www.google.com/webhp?igu=1'
        }

        this.url = url
        this.browserNumber = Date.now()
        this.browsersContainer = browsersContainer || document.getElementById("browsers-container")
        this.webviewDOM = ""
        this.webview = ""
        this.id = `browser-container-${this.browserNumber}`
        this.listenerController = new AbortController()
        //By attaching 
        this.attach = attach
        if(!this.attach){
            this.init()
        }
    }
    
    async init(){
        const { signal } = this.listenerController
        this.injectDOM()
        this.browser = document.querySelector(`#browser-container-${this.browserNumber}`)
        this.webview = document.querySelector("#webview-"+this.browserNumber)
        this.urlBar = document.getElementById('url-bar-'+this.browserNumber)
        
        this.webview.focus()
        
        if(!this.attach) this.openWindow()
        
        this.webview.addEventListener('dom-ready', (event)=>{
            let id = event.target.id
            if(id === `webview-${this.browserNumber}`){
                this.startEventListeners(signal)
            }else{
                console.log('WebView Dom Ready Event Id is not matching')
                console.log(event.target)
            }
        }, { signal })

        return this.browser
    }

    getId(){
        return this.browserNumber
    }
    
    async openWindow(){
        this.browserWindow = new ApplicationWindow({
            height:"80%",
            width:"80%", 
            title:"Browser",
            label:`browser-${this.browserNumber}`,
            mount:this.browser, 
            launcher:{
                //enables reopening of the same window upon page reload
                name:"Browser",
                opts:{
                    url:this.url
                }
            },
            onclose:()=>{
                this.close()
            } 
        })
    
        activeWebviews[this.browserNumber] = this.browserWindow
        this.watchURLChange()
    }

    startEventListeners(signal){
        window.addEventListener(`message`, (event)=>{
            const message = event.data
            if(message.dialogSave){
                window.ipcRenderer.send('download-path-selected',{ selected:message.dialogSave })
            }else if(message.dialogCancel){
                window.ipcRenderer.send('download-path-selected',{ cancelled:true })
            }
        }, { signal })
        
        
        this.urlBar.addEventListener("visit-url", (e)=>this.visitURLHandler(e), { signal })
        window.addEventListener("browser-navigation", (e)=>this.browserNavigationHandler(e), { signal })
        window.ipcRenderer.on('confirm-download', this.confirmDownloadHandler)
        window.ipcRenderer.on('select-download-path', this.selectDownloadPathHandler)
        window.ipcRenderer.on('download-complete', this.downloadCompleteHandler)
        this.browser.addEventListener("keypress", (e)=>this.pressEnterSubmit(e), { signal })
    }

    hide(){
        this.browser.style.display = "none"
    }

    show(){
        this.browser.style.display = ""
    }
    
    async close(){
        this.listenerController.abort()
        window.removeEventListener("visit-url", (e)=>this.visitURLHandler(e))
        window.removeEventListener("browser-navigation", (e)=>this.browserNavigationHandler(e))
        this.browser.removeEventListener("keypress", (e)=>this.pressEnterSubmit(e))
        this.browser.remove()
        // delete window.openWindows[`browser-${this.browserNumber}`]
        
    }
    
    visitURLHandler(event){
        console.log('Event from URL bar', event)
        const message = event.detail
        const { url, targetBrowser } = message.visitURL
        if(targetBrowser == `browser-${this.browserNumber}`) 
            this.addNewURL(url)
        
        
    }
    
    browserNavigationHandler(event){
        const message = event.detail
        if(message.back == `browser-${this.browserNumber}`){
                return this.webview.goBack()
        }else if(message.forward == `browser-${this.browserNumber}`){
                return this.webview.goForward()
        }if(message.refresh == `browser-${this.browserNumber}`){
                return this.webview.reload()
        }
    }
    
    downloadCompleteHandler(event, message){
        const { success, error } = message
        if(success) popup(`Success: ${JSON.stringify(success, null, 2)}`)
        else if(error) popup(`Error: ${JSON.stringify(error, null, 2)}`)
    }

    confirmDownloadHandler(url){
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

    selectDownloadPathHandler(event, message){
        const startingPath = message
        
        if(window.saveDialogOpened) return true
        
        new SaveAsDialog({
                startingPath:startingPath,
                filename:""
        })

    }
    
    watchURLChange(){
        if(window.isElectron){
            const { signal } = this.listenerController
           this.webview.addEventListener("dom-ready", (event)=>{
                //webview tag
                this.webview.addEventListener('did-finish-load', (e) => {
                    const url = this.webview.getURL()
                    this.setURL(url)
                    this.updateLauncherState(url)
                }, { signal })

                this.webview.addEventListener('did-start-loading', (e) => {
                    const url = this.webview.getURL()
                    this.setURL(url)
                    this.updateLauncherState(url)
                }, { signal })

           }, { signal })

        }else{
            //iframe tag
            this.webview.onload = () =>{
                const url = this.webview.src
                this.setURL(url)
            }
        }
    }
    
    getURLValue(){
        return this.urlBar.value
    }
    
    setURL(url){
        console.log('Setting URL', url)
        this.urlBar.value = url.trim()
        
    }

    visit(url){
        const {signal} = this.listenerController
        if(window.isElectron){
            this.webview.loadURL(url)
            this.updateLauncherState(url)
        }else{
            this.webview.src = url
        }
    }

    updateLauncherState(url){
        try{
            this.browserWindow.launcher.opts.url = url
        }catch(e){
            console.log(e)
        }
    }

    addNewURL(url){
        this.isGoogleSearch(url)
        return true
    }
    
    isURL(string){
        const urlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/
        return urlRegex.test(string)
    }

    isValidDomain(string){
        const domainRegex = new RegExp(/^(?!-)[A-Za-z0-9-]+([\-\.]{1}[a-z0-9]+)*\.[A-Za-z]{2,6}$/)

        return domainRegex.test(string)
    }

    isGoogleSearch(question){
        if(question.slice(0, 4) == "http"){
            this.visit(question)
        }else if(this.isValidDomain(question)){
            this.visit("https://"+question)
        }else if(question.slice(0, 5) == "data:"){
            this.visit(question) //
        }else if(question == "about:blank"){
            this.visit(question) //
        }else{
            this.searchOnGoogle(question)
        }
    }
    
    preFormatURL(url){
        if(url.slice(0, 4) == "http"){
            return url
        }else if(this.isValidDomain(url)){
            return "https://"+url
        }else if(url.slice(0, 5) == "data:"){
            return url
        }else if(url == "about:blank"){
            return url
        }else{
            return `https://www.google.com/search?q=${url}`
        }
    }
    
    searchOnGoogle(question){
        this.visit(`https://www.google.com/search?q=${question}`)
    }


    pressEnterSubmit(e){
        const target = e.target
        const id = target.id
        if(e.key === 'Enter') console.log("Wtf", e)
        if(e.key == "Enter" && id === this.urlBar.id){
            console.log('All good')
            this.addNewURL(this.urlBar.value)
        }else if(id !== this.urlBar.id){
            console.log('Not good', target)
            console.log('Source', e.srcElement)
        }
    }

    makeWebviewDOM(){
        if(window.isElectron){
            return `
            <webview 
                class="responsive-webview" 
                id="webview-${this.browserNumber}" 
                src="${this.preFormatURL(this.url)}" 
                autosize="on" 
                style="display:flex; 
                min-width:100%; 
                min-height:95%" >
            </webview>
            `
        }
        else{
            return`<iframe 
                            class="responsive-webview" 
                            id="webview-${this.browserNumber}" 
                            src="${this.url}" 
                            autosize="on">
                          </iframe>`
        }
    }

    makeBrowserPageDOM(webviewDOM){
        return `
        <div id="browser-container-${this.browserNumber}" class="browser-container">
            <div id="browser-menu-${this.browserNumber}" class="browser-menu" style="min-width:100%;">
                <div class="navigation-buttons">
                    <span class="button"><a class="back-button" onclick="sendEvent('browser-navigation', { back:'browser-${this.browserNumber}' });return false"></a></span>
                        | 
                    <span class="button" ><a class="forward-button" onclick="sendEvent('browser-navigation', { forward:'browser-${this.browserNumber}' });return false"></a></span>
                    <span class="button" ><a class="refresh-button" onclick="sendEvent('browser-navigation', { refresh:'browser-${this.browserNumber}' });return false"><img src="./images/icons/refresh.png"/></a></span>
                </div>
                <div class="url-container">
                    <input id="url-bar-${this.browserNumber}" class="url-bar" type="text" placeholder="http://google.com" value="${this.url}">
                    <button 
                    id="url-button" 
                    class="url-button"
                    onclick="
                        sendEvent('visit-url',{ 
                            visitURL:{ 
                                url:document.getElementById('url-bar-${this.browserNumber}').value, 
                                targetBrowser:'browser-${this.browserNumber}' 
                            } })"> 
                             GO  
                    </button>
                     
                    <button 
                    id="url-button" 
                    class="url-button"
                    onclick="new Browser({ url:document.getElementById('url-bar-${this.browserNumber}').value })"> 
                             New Window  
                    </button>
                </div>
                <span class="button" class="settings-button"><a onclick="console.log('settings')"><img src="./images/icons/settings.png"></a></span>
            </div>
            ${webviewDOM}
        </div>
        `
    }
    
    injectDOM(){

        this.webviewDOM = this.makeWebviewDOM()
        this.browserDOM = this.makeBrowserPageDOM(this.webviewDOM)


        this.otherBrowsers = this.browsersContainer.innerHTML
        this.browsersContainer.innerHTML = this.browserDOM + this.otherBrowsers 
    }

}

window.Browser = Browser
activeWebviews = {}

class Browser{
    constructor(url){
        if(!url){
            if(window.isElectron) url = "https://google.com"
            else url = 'https://www.google.com/webhp?igu=1'
        }
        this.url = url
        
        this.browserNumber = Date.now()

        this.browsersContainer = document.getElementById("browsers-container")
        this.webviewDOM = ""
        this.webview = ""
        this.init()
    }
    
    async init(){
        this.injectDOM()
        this.browser = document.querySelector(`#browser-container-${this.browserNumber}`)
        this.webview = document.querySelector("#webview-"+this.browserNumber)
        this.urlBar = document.getElementById('url-bar-'+this.browserNumber)
        this.webview.addEventListener("keypress",(event, message)=>{
            console.log("Webview keypress", event, message)
        })
        this.openWindow()
        
        window.addEventListener("message", (event)=>{
            console.log('Message', event)
            const message = event.data
            if(message.back){
                
                if(message.back == `browser-${this.browserNumber}`){
                    this.webview.goBack()
                }
            }else if(message.forward){
                
                if(message.forward == `browser-${this.browserNumber}`){
                    this.webview.goForward()
                }
                
            }else if(message.refresh){
                
                if(message.refresh == `browser-${this.browserNumber}`){
                    this.webview.reload()
                }
                
            }else if(message.visitURL){
                const { url, targetBrowser } = message.visitURL
                this.addNewURL(url)
            }else if(message.dialogSave){
                window.ipcRenderer.send('download-path-selected',{ selected:message.dialogSave })
            }else if(message.dialogCancel){
                window.ipcRenderer.send('download-path-selected',{ cancelled:true })
            }
        })
        
        
        window.addEventListener("visit-url", (e)=>this.visitURLHandler(e))
        
        window.addEventListener("browser-navigation", (e)=>this.browserNavigationHandler(e))
        window.ipcRenderer.on('confirm-download', this.confirmDownloadHandler)
        window.ipcRenderer.on('select-download-path', this.selectDownloadPathHandler)
        window.ipcRenderer.on('download-complete', this.downloadCompleteHandler)
        this.browser.addEventListener("keypress", (e)=>this.pressEnterSubmit(e))
        

    }
    
    async openWindow(){
        this.browserWindow = new ApplicationWindow({
            height:"80%",
            width:"80%", 
            title:"Browser",
            label:`browser-${this.browserNumber}`,
            mount:this.browser, 
            launcher:{
                //enables start at boot
                name:"new Browser",
                params:[this.url]
            },
            onclose:()=>{
                // this.browsersContainer.innerHTML = this.otherBrowsers
                this.close()
                // this.browserWindow.destroy()
            } 
        })
    
        activeWebviews[this.browserNumber] = this.browserWindow
        this.watchURLChange()
    }
    
    async close(){
        window.removeEventListener("visit-url", (e)=>this.visitURLHandler(e))
        window.removeEventListener("browser-navigation", (e)=>this.browserNavigationHandler(e))
        this.browser.removeEventListener("keypress", (e)=>this.pressEnterSubmit(e))
        this.browser.remove()
        // delete window.openWindows[`browser-${this.browserNumber}`]
    }
    
    visitURLHandler(event){
        const message = event.detail
        const { url, targetBrowser } = message.visitURL
        if(targetBrowser == `browser-${this.browserNumber}`) 
            console.log('Is same browser')
        
        this.addNewURL(url)
    }
    
    browserNavigationHandler(event){
        const message = event.detail
        if(message.back == `browser-${this.browserNumber}`){
                this.webview.goBack()
        }else if(message.forward == `browser-${this.browserNumber}`){
                this.webview.goForward()
        }if(message.refresh == `browser-${this.browserNumber}`){
                this.webview.reload()
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

        new SaveAsDialog({
            startingPath:startingPath,
            filename:""
        })

    }
    
    watchURLChange(){
        if(window.isElectron){
            //webview tag
            this.webview.addEventListener('did-finish-load', (e) => {
                // const url = webview.getURL()
                // addUrlToHistory(url)
                // setURL(url)
            })

            this.webview.addEventListener('did-start-loading', (e) => {
                const url = this.webview.getURL()
                this.setURL(url)
            })

        }else{
            //iframe tag
            this.webview.onload = () =>{
                url = this.webview.src

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
        
        if(window.isElectron){
            this.webview.loadURL(url)
        }else{
            this.webview.src = url
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
        }else{
            this.searchOnGoogle(question)
        }
    }
    
    searchOnGoogle(question){
        this.visit(`https://www.google.com/search?q=${question}`)
    }


    pressEnterSubmit(e){
        if(e.key == "Enter"){
            this.addNewURL(this.urlBar.value)
        }
    }
    
    injectDOM(){
        if(window.isElectron){
            this.webviewDOM = `
            <webview 
                class="responsive-webview" 
                id="webview-${this.browserNumber}" 
                src="${this.url}" 
                autosize="on" 
                style="display:flex; 
                min-width:100%; 
                min-height:95%" >
            </webview>
            `
        }
        else{
            this.webviewDOM = `<iframe 
                            class="responsive-webview" 
                            id="webview-${this.browserNumber}" 
                            src="${this.url}" 
                            autosize="on">
                          </iframe>`
        }
        
        this.browserDOM = `
          
        <div id="browser-container-${this.browserNumber}" class="browser-container">
            <div class="browser-menu" style="min-width:100%;">
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
                </div>
                <span class="button" class="settings-button"><a onclick="console.log('settings')"><img src="./images/icons/settings.png"></a></span>
            </div>
            ${this.webviewDOM}
        </div>
        `
        this.otherBrowsers = this.browsersContainer.innerHTML
        this.browsersContainer.innerHTML = this.otherBrowsers + this.browserDOM
    }
}
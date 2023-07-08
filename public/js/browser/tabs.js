class BrowserTabs{
    constructor(opts={}){
        let { url, urls } = opts
        const startPage = new Browser({ url:url, attach:true })
        
        this.startPage = startPage
        this.browsers = {
            [startPage.getId()]:startPage
        }

        this.browserTabsId = Date.now()
        this.listenerController = new AbortController()
        
        this.init()
    }

    async init(){
        const { signal } = this.listenerController
        
        window.addEventListener('add-tab', async(e)=>await this.addNewTab(e), { signal } )
        window.addEventListener('change-tab', async(e)=>await this.changeTab(e), { signal } )
        window.addEventListener('close-tab', async(e)=>await this.closeTab(e), { signal } )
        
        this.tabsDOM = this.makeTabs({
            instanceId:this.browserTabsId,
            firstLabel:"Google",
        })

        this.startPage.init()
        this.browserTabs = document.getElementById("browser-tabs")
        this.browserTabs.style.overflow = "hidden"
        this.browsersContainer = document.getElementById("browsers-container")
        this.browserTabs.innerHTML = this.tabsDOM
        setTimeout(()=>{
            this.browserTabs.append(this.browsersContainer)
            this.openWindow()
            
        }, 200)
    }

    async close(){
        for(const id in this.browsers){
            const browser = this.browsers[id]
            browser.close()
        }
        const tabs = $('.tabs > .tab-element');
        tabs.off('click')
        this.listenerController.abort()
    }

    async readyTabs(){
        const tabs = $('.tabs > .tab-element');
        tabs.on("click", function(){
            
            tabs.removeClass('active');
            $(this).addClass('active')
            
            // window.sendEvent("change-tab", $(this).attr('id'))
        });
    }

    async addNewTab(event){
        const { tabsContainer, id } = event.detail

        console.log('Tabs Container', this.browsersContainer)
        console.log('ID', id)

        const browserPage = await this.addNewBrowserPage()
        tabsContainer.innerHTML = this.makeSingleTab("New Tab", browserPage.getId(),'active') + tabsContainer.innerHTML
        this.selectBrowserPage(browserPage.id)
        this.readyTabs()
    }

    async changeTab(event){
        const tabId = event.detail
        
        const browserId = tabId.replace("tab-","browser-container-")
        this.selectBrowserPage(browserId)
    }

    selectBrowserPage(id){
        const browserPageElements = this.browsersContainer.children
        for(const element of browserPageElements){
            if(element.id !== id){
                element.style.display = 'none'
            }else{
                element.style.display = 'block'
            }
        }
    }

    closeTab(event){
        const tab = event.detail
        const nextTab = tab.nextElementSibling
        const previousTab = tab.previousElementSibling
        let otherTab = ""
        let tabLink = ""
        if(nextTab && !nextTab.id.includes("new-tab")){
            otherTab = nextTab
            tabLink = document.querySelector(`#${nextTab.dataset.linkid}`)
        }else if(previousTab && !previousTab.id.includes("new-tab")){
            otherTab = previousTab
            tabLink = document.querySelector(`#${previousTab.dataset.linkid}`)
        }else{
            return this.winbox.close()
        }
        const tabId = tab.id

        const browserNumber = tabId.replace("tab-","")
        const browserId = tabId.replace("tab-","browser-container-")

        const browser = this.browsers[browserNumber]
        
        if(tabLink) tabLink.click()
        browser.close()
        tab.remove()
    }

    hideAllBrowser(except=false){
        for(const id in this.browsers){
            const browser = this.browsers[id]
            browser.hide()

            console.log('Display',browser.browser.style.display)
            console.log('Style',browser.browser.style)
        }
    }

    async addNewBrowserPage(url){
        const page = new Browser({ url:url, attach:true })
        await page.init()
        this.browsers[page.getId()] = page
        return page
    }

    openWindow(){
        this.winbox = new ApplicationWindow({
            height:"80%",
            width:"80%", 
            title:"Browser",
            label:`tab-${this.browserTabsId}`,
            mount:this.browserTabs, 
            launcher:{
                //enables start at boot
                name:"BrowserTabs",
                params:{
                    url:this.url
                }
            },
            onclose:()=>{
                this.close()
                
            } 
        })
    }

    makeTabs({ instanceId, firstLabel,  }){
        return `
        <div id="tabs-container-${instanceId}" class="tab-container">
            <ul id="tab-list-${instanceId}" class="tabs clearfix" >
                
                ${this.makeSingleTab(firstLabel, this.browserTabsId ,'active')}
                <li id="new-tab-${instanceId}">
                    <a class="new-tab" onclick="window.sendEvent('add-tab', { tabsContainer:this.parentNode.parentNode, id:'${instanceId}' } )">  + +   </a> 
                </li>
            </ul>
        </div>
        `
    }

    makeSingleTab(label="New Tab", tabId="", active=false){
        return `
        <li id="tab-${tabId}" data-linkid="tab-link-${tabId}" class="tab-element ${active? "active":""}" style="">
            <a id="tab-link-${tabId}" class="tab-link" onclick="window.sendEvent('change-tab', 'tab-${tabId}')">${label}</a>
            <a class="tab-close tab-link" style="" onclick="window.sendEvent('close-tab', this.parentNode)">X</a>
        </li>
        `
    }
}

window.BrowserTabs = BrowserTabs

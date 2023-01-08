

class CollapsibleBar{
    constructor({ startingPath="/", activeDirectory, mountDOM, hostId, listenerController }){
        if(!mountDOM) throw new Error('Collapsible bar needs a mount point in the DOM')
        if(!hostId) throw new Error("Collapsible bar needs id of host element")
        if(!listenerController) throw new Error("Collapsible bar needs listener controller to remove active listeners")
        this.collapsibleId = Date.now()
        this.barDOM = `
        <div class="collapsible-container">
            <link rel="stylesheet" href="./css/collapsible.css">
            <ul data-level="1" data-name="${startingPath}" id="${this.collapsibleId}-bar-container" class="parent">
            
            </ul>
        </div>
        `
        this.activeDirectory = activeDirectory
        this.startingPath = startingPath
        this.mountDOM = mountDOM
        this.mountDOM.innerHTML = this.barDOM
        this.hostId = hostId
        this.workingDir = startingPath 
        this.root = ""
        this.homePath = ""
        this.pointerId = ""
        this.listenerController = listenerController
    }

    async init(){
        const {signal} = this.listenerController
        this.pointerId = await getNewPointerId(this.collapsibleId)
        const contents = await this.exec('ls',[this.workingDir])
        const barDOM = document.getElementById(`${this.collapsibleId}-bar-container`)
        
        this.buildDOM(contents, barDOM)

        

        window.addEventListener(`message-${this.hostId}`, (event)=>{
            const message = event.detail
            if(message.expandDir){
                const path = message.expandDir
                const ulElement = document.querySelector(`#${message.ulElementId}`)
                this.openDirectory(path, ulElement)
                
            }
        }, { signal })

        this.createCollapsibleFileMenu()
        this.createCollapsibleDirectoryMenu()

        setTimeout(()=>{
            this.openAtDirectory(this.activeDirectory)
        }, 200)
    }
    
    destroy(){
        $.contextMenu("destroy",`.file-element-${this.collapsibleId}`)
        $.contextMenu("destroy",`.directory-element-${this.collapsibleId}`)
        destroyPointer(this.pointerId)
        clearInterval(this.clickEvents)
    }
    
    async openAtDirectory(path){
        
        const pathArray = path.split("/").filter(e => e != "")
        let segmentedPath = ""
        let clickCounter = 0
        

        this.clickEvents = setInterval(()=>{
            
            if(clickCounter === pathArray.length){
                clearInterval(this.clickEvents)
                return true
            }
            let dirname = pathArray[clickCounter]
            segmentedPath = segmentedPath + "/" + dirname
            
            let element = document.getElementById(`${this.stripName(dirname)}-${this.collapsibleId}-summary`)
            element.click()
            clickCounter++
        }, 80)
    }

    async openDirectory(path, element){
        this.workingDir = path
        
        const contents = await this.exec('ls',[path])
        
        await this.buildDOM(contents, element)
    }

    async buildDOM(contents, element){
        let level = parseInt(element.dataset.level)
        let domToInject = ""
        for await(let item of contents){
            if(item.includes("/")){
                domToInject = domToInject + this.makeDirectoryDOM(item, this.workingDir+item, level+1)
            }else if(item !== '..'){
                
                domToInject = domToInject + this.makeFileDOM(item, this.workingDir+item)
            }
            
        }

        element.innerHTML = domToInject
    }


    async exec(cmd, args){
        return await exec(cmd, args, this.pointerId)
    }

    stripName(name){
        name = name.replace("@","")
        name = name.replace("/","")
        name = name.replace(".","")
        return name
    }

    makeDirectoryDOM(name, path, level=1){
        
        return `
        <li class="directory-element collapse-element directory-element-${this.collapsibleId}"
            id="${this.stripName(name)}-${this.collapsibleId}" 
            class="directory-line"
            data-path="${path}"
            data-name="${this.stripName(name)}"
            data-summaryid="${this.stripName(name)}-${this.collapsibleId}-summary">
            <details>
                <summary id="${this.stripName(name)}-${this.collapsibleId}-summary" onclick="sendEvent('message-${this.hostId}',{ expandDir:'${path}', ulElementId:'${this.stripName(name)}-${level}-${this.collapsibleId}-content' })">
                <img src="./images/icons/folder-color-large.png" height="8px" width="8px"> ${name} </summary>
                <ul 
                    class="directory-content" 
                    data-level="${level}" 
                    id="${this.stripName(name)}-${level}-${this.collapsibleId}-content"
                    data-name="${name}">
                    
                </ul
            </details>
        </li>
        `
    }

    makeFileDOM(name, path){
        return `
        <li class="file-element collapse-element file-element-${this.collapsibleId}"
            id="${name.replace(".","")}-${this.collapsibleId}" 
            class="directory-line"
            data-path="${path}"
            data-name="${name}"
            onclick="select(this, (()=>sendEvent('message-${this.hostId}',{ collapseFileOpen:'${path}' })))">
            <img src="./images/icons/file-color-large.png" height="8px" width="8px"> ${name}
        </li>`
    }
    
    createCollapsibleFileMenu(){
        const hostId = this.hostId
        return $.contextMenu({
            selector: `.file-element-${this.collapsibleId}`, 
            callback: function(key, options){
                if(key == 'Open file') sendEvent(`collapsible-file-open-${hostId}`, { path:this.context.dataset.path, id:hostId })
                else if(key == 'Open in Editor') new Editor({ pathToFile:this.context.dataset.path })
                else if(key == 'Delete') sendEvent(`collapsible-file-delete-${hostId}`, { path:this.context.dataset.path, id:hostId })
                else if(key == 'Get info') popup(this.context.dataset.path)
            },   
            items: {
                "Open file": {name: "Open file", icon: 'fa-edit'},
                "Open in Editor": {name: "Open in Editor", icon: "fa-regular fa-window"},
                'Delete': {name: "Delete", icon: "fa-delete"},
                'Get info': {name: "Get info", icon: "fa-delete"},
            }
        });
    }
    
    createCollapsibleDirectoryMenu(){
        const hostId = this.hostId
        return $.contextMenu({
            selector: `.directory-element-${this.collapsibleId}`, 
            callback: function(key, options) {
                if(key == 'Open') sendEvent(`collapsible-directory-open-${hostId}`, { path:this.context.dataset.path, id:hostId })
                else if(key == 'Open in Explorer') new FileExplorer({ workingDir:this.context.dataset.path })
                else if(key == 'Delete') sendEvent(`collapsible-directory-delete-${hostId}`, { path:this.context.dataset.path, id:hostId })
                else if(key == 'Get info') popup(this.context.dataset.path)
            },   
            items: {
                "Open": {name: "Open", icon: 'fa-edit'},
                "Open in Explorer": {name: "Open in Explorer", icon: 'fa-edit'},
                'Delete': {name: "Delete", icon: "fa-delete"},
                'Get info': {name: "Get info", icon: "fa-delete"},
            }
        });
    }
}

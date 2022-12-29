

class CollapsibleBar{
    constructor({ startingPath="/", mountDOM }){
        if(!mountDOM) throw new Error('Collapsible bar needs a mount point in the DOM')
        this.collapsibleId = Date.now()
        this.barDOM = `
        <div class="collapsible-container">
            <link rel="stylesheet" href="./css/collapsible.css">
            <ul data-level="1" id="${this.collapsibleId}-bar-container" class="parent">
            
            </ul>
        </div>
        `
        this.mountDOM = mountDOM
        this.mountDOM.innerHTML = this.barDOM
        this.workingDir = startingPath 
        this.root = ""
        this.homePath = ""
        this.pointerId = ""
    }

    async init(){
        this.pointerId = await getNewPointerId(this.collapsibleId)
        const contents = await this.exec('ls',[this.workingDir])
        const barDOM = document.getElementById(`${this.collapsibleId}-bar-container`)
        
        this.buildDOM(contents, barDOM)

        window.addEventListener('message', (event)=>{
            const message = event.data
            if(message.expandDir && message.id == this.collapsibleId){
                const path = message.expandDir
                const ulElement = document.querySelector(`#${message.ulElementId}`)
                this.openDirectory(path, ulElement)
            }
        })
    }

    async openDirectory(path, element){
        this.workingDir = path
        const contents = await this.exec('ls',[path])
        await this.buildDOM(contents, element)
    }

    async buildDOM(contents, element){
        let level = parseInt(element.dataset.level)
        let domToInject = ""
        for await(const item of contents){
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

    makeDirectoryDOM(name, path, level=1){
        name = name.replace("/","")
        return `
        <li class="directory-element collapse-element"
            id="${name}-${this.collapsibleId}" 
            class="directory-line"
            data-path="${path}">
            <details>
                <summary  onclick="window.postMessage({ expandDir:'${path}', id:'${this.collapsibleId}', ulElementId:'${name}-${level}-${this.collapsibleId}-content' })">
                <img src="./images/icons/folder-color-large.png" height="8px" width="8px"> ${name} </summary>
                <ul class="directory-content" data-level="${level}" id="${name}-${level}-${this.collapsibleId}-content">
                    
                </ul
            </details>
        </li>
        `
    }

    makeFileDOM(name, path){
        return `
        <li class="file-element collapse-element"
            id="${name}-${this.collapsibleId}" 
            class="directory-line"
            data-path="${path}"
            onclick="select(this, (()=>window.postMessage({ collapseFileOpen:'${path}', id:'${this.collapsibleId}' })))">
            <img src="./images/icons/file-color-large.png" height="8px" width="8px"> ${name}
        </li>`
    }

}
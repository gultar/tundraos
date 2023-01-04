

class MarkdownEditor{
    constructor(pathToFile="", content=""){
        this.mdEditorId = Date.now()
        this.mdEditorDOMId = `text-editor-${this.mdEditorId}`
        this.dirPointerId = ""
        this.pathToFile = pathToFile
        this.filename = this.extractFilename(this.pathToFile)
        this.content = content
        this.saved = false
        this.editorDOM = ""
        this.editor = ""
        this.winbox = ""
        this.listenerController = new AbortController()
        this.editorDOMString = `
        <div id="editor-wrapper-${this.mdEditorId}" 
                style="background-color:white;color:black;height:100%">
            <link rel="stylesheet" href="./css/topnav.css">
            <div style="display:block">
                <nav class="file-menu" role="navigation">
                    <ul class="menu-item-list">
                        <li class="menu-item"><a href="#">File</a>
                        <ul class="dropdown">
                            <li onclick="sendEvent('message-${this.mdEditorId}',{ newFileEditor:'${this.mdEditorId}' })" class="dropdown-item hoverable"><a>New</a></li>
                            <li onclick="sendEvent('message-${this.mdEditorId}',{ openFileEditor:'${this.mdEditorId}' })" class="dropdown-item hoverable"><a>Open</a></li>
                            <li onclick="sendEvent('message-${this.mdEditorId}',{ saveEditor:'${this.mdEditorId}' })" class="dropdown-item hoverable"><a>Save</a></li>
                            <li onclick="sendEvent('message-${this.mdEditorId}',{ saveAsEditor:'${this.mdEditorId}' })" class="dropdown-item hoverable"><a>Save As</a></li>
                            <li class="dropdown-item hoverable"><a>Exit</a></li>
                        </ul>
                        </li>
                        
                    </ul>
                </nav>
            </div>
            <div id="toolbar-${this.mdEditorId}" style="margin-top:30px"></div>
            
            <textarea id="${this.mdEditorDOMId}">
                ${this.content}
            </textarea>
        </div>
        
        `
        
        this.init()
    }
    
    async init(){
        this.dirPointerId = await getNewPointerId(this.mdEditorId)
        await this.exec('cd',["/"])
        
        const container = document.querySelector("#text-editor-container")
        container.style.visibility = 'hidden'
        container.style.display = 'none'
        this.injectDOM()
        
        
         
        setTimeout(async ()=>{
            const { signal } = this.listenerController
            
            console.log('this.editorDOM',this.editorDOM)
            this.editor = new SimpleMDE({ element: this.editorDOM });
            
            this.winbox = new ApplicationWindow({ 
                title: "Markdown Editor",
                label:`markdown-editor-${this.mdEditorId}`,
                height:"95%", 
                width:"80%",
                mount:this.editorWrapperDOM,
                onclose:()=>{
                    this.destroy()
                    this.listenerController.abort()
                    // this.winbox.destroy()
                }
            })
            
            await this.exec("cd",["/"])
            
            
            this.editorMessageHandler = (event)=>{
                
                const message = event.detail
                if(message.newFileEditor && message.newFileEditor == this.mdEditorId){
                    this.newFile()
                }else if(message.openFileEditor && message.openFileEditor == this.mdEditorId){
                    this.openFile()
                }else if(message.saveEditor && message.saveEditor == this.mdEditorId){
                    this.save()
                }else if(message.saveAsEditor && message.saveAsEditor == this.mdEditorId){
                    this.saveAs()
                }
            }
            container.style.visibility = 'visible'
            container.style.display = ''
            window.addEventListener(`message-${this.mdEditorId}`, this.editorMessageHandler, { signal })
        },200)
        
    }
    
    async save(){
        await this.exec("cd",["/"])
        
        const fileExists = await this.exec("getFile", [this.pathToFile])
        if(fileExists && fileExists.error) return popup(`Save Error: ${fileExists.error}`)
        
        if(!fileExists || this.pathToFile == ""){
            return await this.saveAs()
        }else{
            const content = this.editor.value()
            this.saved = true
            const saved =  await this.exec("editFile", [this.pathToFile, content])
            if(saved && saved.error) popup(`Save Error: ${saved.error}`)
            else if(!saved) popup(`A saving error occured`)
            else popup(`Saved file ${this.filename} successfully`)
            return saved
        }
    }
    
    async saveAs(){
        await this.exec("cd",["/"])
        
        const content = this.editor.value()
        
        const selection = await this.selectSavePath(this.filename, "select")
        
        if(!selection) return false

        this.filename = selection.saved.filename
        this.pathToFile = selection.saved.path + this.filename

        const fileExists = await this.exec("getFile", [this.pathToFile])
        
        if(fileExists && !fileExists.error){
            const overwritten = await this.overwrite(this.pathToFile, content)
            this.saved = true
            
            if(overwritten && overwritten.error) popup(`Overwrite Error: ${saved.error}`)
            else if(!overwritten) popup(`An overwriting error occured`)
            else popup(`Overwritten file ${this.filename} successfully`)
            
            if(!overwritten) return false
            else return { saved:overwritten }
        }else{
            const saved = await this.exec('touch',[this.pathToFile, content])
            this.saved = true
            
            if(saved && saved.error) popup(`Save Error: ${saved.error}`)
            else if(!saved) popup(`A saving error occured`)
            else popup(`Saved file ${this.filename} successfully`)
            
            if(!saved || saved.error) return { cancelled:true, error:saved }
            
            return { saved:saved }
        }

    }
    
    async overwrite(path, filecontent){
        confirmation({
            message:`Are you sure you want to overwrite file ${path}?`,
            yes:async ()=> await this.exec("editFile", [path, filecontent]),
            no:()=>false
        })
    }
    
    async openFile(){
        const selection = await this.selectSavePath("", "select")
        
        if(!selection) return false

        this.filename = selection.saved.filename
        this.pathToFile = selection.saved.path + this.filename
        let content = await this.exec("getFileContent", [this.pathToFile])
        if(content && content.error) return popup(`Save Error: ${fileExists.error}`)
        
        this.content = content
        
        this.editor.value(this.content)
        
        return true
    }
    
    async newFile(){
        this.editor.value("")
        this.pathToFile = ""
        this.filename = ""
    }
    
    async selectSavePath(filename, mode="save"){
        return new Promise((resolve)=>{
            
            const dialog = new SaveAsDialog({ filename:filename, mode:mode })
            
            window.addEventListener("dialog-save", (event)=>{
                const selection = event.detail
                if(selection.cancelled){
                    resolve(false)
                }else{
                    resolve({ saved:selection })
                }
            }, { once:true })

        })
    }
    
    
    extractFilename(path){
        const pathArray = path.split("/")
        return pathArray[pathArray.length - 1]
    }

    extractPath(path){
        const pathArray = path.split("/")
        pathArray.pop()
        return pathArray.join("/")
    }

    async exec(cmd, args){
        return await exec(cmd, args, this.dirPointerId)
    }
    
    injectDOM(){
        const editorsContainer = document.querySelector("#text-editor-container")
        
        editorsContainer.innerHTML = editorsContainer.innerHTML + this.editorDOMString
        
        this.editorDOM = document.querySelector(`#${this.mdEditorDOMId}`)
        this.editorWrapperDOM = document.querySelector(`#editor-wrapper-${this.mdEditorId}`)
        
    }
    
    destroy(){
        this.editorWrapperDOM.remove()
        this.editorDOM.remove()
        this.editor = null
        destroyPointer(this.dirPointerId)
        // delete window.openWindows[`markdown-editor-${this.mdEditorId}`]
    }
}
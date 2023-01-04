

class RichTextEditor{
    constructor(pathToFile="", content=""){
        this.textEditorId = Date.now()
        this.textEditorDOMId = `text-editor-${this.textEditorId}`
        this.dirPointerId = ""
        this.pathToFile = pathToFile
        this.filename = this.extractFilename(this.pathToFile)
        this.content = content
        this.saved = false
        this.editorDOM = ""
        this.editor = ""
        this.winbox = ""
        this.editorDOMString = `
        <div id="editor-wrapper-${this.textEditorId}" 
                style="background-color:white;color:black;height:100%">
            <link rel="stylesheet" href="./css/topnav.css">
            <div style="display:block">
                <nav class="file-menu" role="navigation">
                    <ul class="menu-item-list">
                        <li class="menu-item"><a href="#">File</a>
                        <ul class="dropdown">
                            <li onclick="window.postMessage({ newFileEditor:'${this.textEditorId}' })" class="dropdown-item hoverable"><a>New</a></li>
                            <li onclick="window.postMessage({ openFileEditor:'${this.textEditorId}' })" class="dropdown-item hoverable"><a>Open</a></li>
                            <li onclick="window.postMessage({ saveEditor:'${this.textEditorId}' })" class="dropdown-item hoverable"><a>Save</a></li>
                            <li onclick="window.postMessage({ saveAsEditor:'${this.textEditorId}' })" class="dropdown-item hoverable"><a>Save As</a></li>
                            <li class="dropdown-item hoverable"><a>Exit</a></li>
                        </ul>
                        </li>
                        
                    </ul>
                </nav>
            </div>
            <div id="toolbar-${this.textEditorId}" style="margin-top:30px"></div>
            
            <div id="${this.textEditorDOMId}">
                
            </div>
        </div>
        
        `
        
        this.init()
    }
    
    async init(){
        this.dirPointerId = await getNewPointerId(this.textEditorId)
        await this.exec('cd',["/"])
        
        const container = document.querySelector("#text-editor-container")
        container.style.visibility = 'hidden'
        container.style.display = 'none'
        this.injectDOM()
        
        
         
        setTimeout(async ()=>{
        
            
            let toolbarOptions = [
              ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
              ['blockquote', 'code-block'],
            
              [{ 'header': 1 }, { 'header': 2 }],               // custom button values
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
              [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
              [{ 'direction': 'rtl' }],                         // text direction
            
              [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
              [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            
              [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
              [{ 'font': [] }],
              [{ 'align': [] }],
            
              ['clean']                                         // remove formatting button
            ];
                
            this.editor = new Quill(`#${this.textEditorDOMId}`, {
                theme: 'snow',
                modules: {
                    toolbar:toolbarOptions, //`#toolbar-${this.textEditorId}`
                }
            });
            
            this.winbox = new ApplicationWindow({ 
                title: "Quill Editor",
                label:`text-editor-${this.textEditorId}`,
                height:"95%", 
                width:"80%",
                mount:this.editorWrapperDOM,
                onclose:()=>{
                    this.destroy()
                    // this.winbox.destroy()
                }
            })
            
            await this.exec("cd",["/"])
            
            if(this.content){
                this.setValueString(this.content)
            }
            
            
            this.editorMessageHandler = (event)=>{
                
                const message = event.data
                if(message.newFileEditor && message.newFileEditor == this.textEditorId){
                    this.newFile()
                }else if(message.openFileEditor && message.openFileEditor == this.textEditorId){
                    this.openFile()
                }else if(message.saveEditor && message.saveEditor == this.textEditorId){
                    this.save()
                }else if(message.saveAsEditor && message.saveAsEditor == this.textEditorId){
                    this.saveAs()
                }
            }
            container.style.visibility = 'visible'
            container.style.display = ''
            window.addEventListener('message', this.editorMessageHandler)
        },200)
        
    }
    
    async save(){
        await this.exec("cd",["/"])
        
        const fileExists = await this.exec("getFile", [this.pathToFile])
        if(fileExists && fileExists.error) return popup(`Save Error: ${fileExists.error}`)
        
        if(!fileExists || this.pathToFile == ""){
            return await this.saveAs()
        }else{
            const content = JSON.stringify(this.editor.getContents())
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
        
        const content = JSON.stringify(this.editor.getContents())
        
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
        
        try{
            this.content = JSON.parse(content)
        }catch(e){
            popup(`ERROR: Could not open file ${this.filename}`)
            this.filename = ""
            this.pathToFile = ""
            return false
        }
        
        
        this.editor.setContents(this.content)
        
        return true
    }
    
    setValueString(contentString){
        try{
            this.content = JSON.parse(contentString)
        }catch(e){
            popup(`ERROR: Could not open file ${this.filename}`)
            this.filename = ""
            this.pathToFile = ""
            return false
        }
        
        
        this.editor.setContents(this.content)
    }
    
    async newFile(){
        this.editor.setContents("\n")
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
        
        this.editorDOM = document.querySelector(`#${this.textEditorDOMId}`)
        this.editorWrapperDOM = document.querySelector(`#editor-wrapper-${this.textEditorId}`)
        
    }
    
    destroy(){
        this.editorWrapperDOM.remove()
        this.editorDOM.remove()
        this.editor = null
        destroyPointer(this.dirPointerId)
        // delete window.openWindows[`text-editor-${this.textEditorId}`]
    }
}


class Editor{
    constructor(opts={}){
        const { pathToFile="", content="" } = opts
        this.editorId = Date.now()
        this.pathToFile = pathToFile
        this.filename = this.extractFilename(this.pathToFile)
        this.dirname = this.extractPath(pathToFile)
        this.filenameDisplay = ""
        this.filepathDisplay = ""
        this.content = content
        this.dirPointerId = ""
        this.editorContainer = ""
        this.editorDOM = ""
        this.editor = ""
        this.collapsible = ""
        this.saved = (pathToFile === '')
        this.listenerController = new AbortController();
        this.init()

    }

    async startEditor(filename, content=""){
        let mode = false
        let theme = false
        
        if(filename && !filename.error){
            const [ name, ...extensions ] = filename.split(".")
            const lastExtension = extensions[extensions.length - 1]
            mode = getNameFromExtension(lastExtension)
            theme = 'cobalt' //Read config file/json
        }

        if(!mode) mode = 'text'
        if(!theme) theme = "cobalt"

        mode = mode.toLowerCase()
        let editor = ace.edit(`editor-${this.editorId}`);
        editor.setTheme(`ace/theme/${theme}`);
        editor.session.setMode(`ace/mode/${mode}`);
        editor.commands.addCommand({
            name: 'save',
            bindKey: {win: 'Ctrl-S',  mac: 'Command-M'},
            exec: async (editor) => {
                let saved = await this.save(editor.getValue(), this.pathToFile)
                if(typeof saved === 'object') saved = JSON.stringify(saved)
                popup(`Saved file ${this.pathToFile}: ${saved}`)
                this.saved = true
                
            },
        });
        if(content && !content.error) editor.setValue(content);
        window.editorInstance = editor
        
        return editor
    }

    setMode(mode="text"){
        this.editor.session.setMode(`ace/mode/${mode.toLowerCase()}`);
    }

    readModeFromExtension(filename){
        const [ name, ...extensions ] = filename.split(".")
        const lastExtension = extensions[extensions.length - 1]
        return getNameFromExtension(lastExtension)
    }

    setTheme(theme="monokai"){
        this.editor.setTheme(`ace/theme/${theme}`);
    }

    async init(){
        this.dirPointerId = await getNewPointerId(this.editorId)
       
        const { signal } = this.listenerController 
        this.editorDOM = this.injectDOM()
        this.editorWrapper = document.querySelector(`#editor-wrapper-${this.editorId}`)
        this.folderView = document.querySelector(`#folder-view-${this.editorId}`)
        this.filenameDisplay = document.querySelector(`#filename-display-${this.editorId}`)
        this.filepathDisplay = document.querySelector(`#filepath-display-${this.editorId}`)
        

        if(this.pathToFile !== ''){
            this.content = await this.exec('getFileContent',[this.pathToFile])
            
            if(this.content.error){
                popup(`File Open Error: ${JSON.stringify(this.content)}`)
                this.content = ""
            }
        }
        
        this.winbox = new ApplicationWindow({
            title:"Code Editor",
            label: `editor-${this.editorId}`, 
            height:"95%", 
            width:"80%",
            mount:this.editorWrapper,
            launcher:{
                name:"Editor",
                opts:{
                  x:this.x,
                  y:this.y,
                  pathToFile:this.pathToFile,
                  content:this.content,
                }
            },
            onclose:()=>{
                this.close()
                // this.winbox.destroy()
            }
        })

        this.winbox.addControl({
            index: 0,
            class: "wb-panels",
            image: "./images/icons/panels.png",
            click: function(event, winbox){
                
                // the winbox instance will be passed as 2nd parameter
                if(!winbox.isSplitscreen){
                    winbox.isSplitscreen = true
                    winbox.resize("50%","100%")
                }else{
                    winbox.resize("50%","50%")
                    winbox.isSplitscreen = false
                }
            }
        })

        this.editor = await this.startEditor(this.filename, this.content)

        this.editor.session.on('change', function(delta) {
           
            //watch for change to enable prompt for saving file upon closing window
            this.saved = false
        });
        
        this.editor.commands.on('afterExec', eventData => {
            if (eventData.command.name === 'insertstring') {
                // console.log('User typed a character: ' + eventData.args);
                this.saved = false
            }
        });
        

        this.makeFolderView()
        
        this.editorMessageHandler = async (event)=>{
            const message = event.detail
            if(message.newFileEditor){
                this.newFile()
            }else if(message.openFileEditor){
                this.openFile()
            }else if(message.saveEditor){
                this.save()
            }else if(message.saveAsEditor){
                this.saveAs()
            }else if(message.collapseFileOpen){
                this.changeFile(message.collapseFileOpen)
            }else if(message.openSettings){
                this.editor.execCommand("showSettingsMenu")
            }
        }

        window.addEventListener(`message-${this.editorId}`, this.editorMessageHandler, { signal })
        window.addEventListener("collapsible-directory-delete-"+this.editorId, (payload)=>this.collapsibleDirectoryDeleteHandler(payload), {signal})
        window.addEventListener("collapsible-file-open-"+this.editorId, (payload)=>this.collapsibleFileOpenHandler(payload), {signal})
        window.addEventListener("collapsible-file-delete-"+this.editorId, (payload)=>this.collapsibleFileDeleteHandler(payload), {signal})
        window.addEventListener("beforeunload", (event)=>{
            this.close("force")
            event.preventDefault()
            
        })
        
        
        this.saved = true
    }
    
    
    collapsibleDirectoryDeleteHandler(payload){
        const { path } = payload.detail
        confirmation({
                message:`Are you sure you want to delete directory ${path}?`,
                yes:async()=>{
                    const deleted = await this.exec("rmdir",[path])
                    if(deleted && deleted.error) popup(deleted.error)
                    else if(deleted && !deleted.error) popup(`Successfully deleted directory ${path}`)
                },
                no:()=>{}
        })
    }
    
    collapsibleFileOpenHandler(payload, that){
        
        const { path, id } = payload.detail
        
        if(id !== this.editorId) return false
        
        if(!this.saved){
            
            confirmation({
                message:'Do you want to save before exiting?',
                yes:async()=>{
                    
                    const saved = await this.save(this.content, this.pathToFile)
                    if(saved && saved.error) popup(JSON.stringify(saved))
                    
                    return this.selectFile(path)
                },
                no:()=>{}
            })
        }
        
        return this.selectFile(path)   
        
        
    }
    
    collapsibleFileDeleteHandler(payload){
        const { path } = payload.detail
        if(id == this.editorId){
            confirmation({
                message:`Are you sure you want to delete file ${path}?`,
                yes:async()=>{
                    const deleted = await this.exec("rm",[path])
                    if(deleted && deleted.error) popup(deleted.error)
                    else if(deleted && !deleted.error) popup(`Successfully deleted file ${path}`)
                },
                no:()=>{}
            })
        }
        
    }

    close(force=false){
        this.editorWrapper.remove()
        const filecontent = this.editor.getValue()
        const path = this.pathToFile
        this.editorWrapper.style.display = 'none'
        this.listenerController.abort()
        this.collapsible.destroy()
        
        if(force) return this.destroy()
        
        if(this.saved === false){
            confirmation({
                message:'Do you want to save before exiting?',
                yes:async()=>{
                    
                    const saved = await this.save(filecontent, path)
                    if(saved && saved.error) popup(JSON.stringify(saved))
                    
                    this.destroy()
                },
                no:()=>this.destroy()
            })
            
        }else{
            this.destroy()
        }
        
        
        
        
    }

    destroy(){
        
        this.editor.destroy()
        this.editor.container.remove()
        destroyPointer(this.dirPointerId)
        // delete window.openWindows[`editor-${this.editorId}`]
    }

    makeFolderView(){
        const folderView = document.querySelector(`#folder-view-${this.editorId}`)
        this.collapsible = new CollapsibleBar({
            activeDirectory:this.dirname,
            mountDOM:folderView, 
            hostId:this.editorId, 
            listenerController:this.listenerController 
        })
        this.collapsible.init()
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

    async newFile(){
        this.pathToFile = ""
        this.filename = ""
        this.content = ""
        this.editor.setValue("")
    }

    async openFile(){
        const selection = await this.selectSavePath("", "select")
        if(!selection) return false

        this.filename = selection.saved.filename
        this.pathToFile = selection.saved.path + this.filename
        this.content = await this.exec("getFileContent", [this.pathToFile])
        this.editor.setValue(this.content)
        let mode = this.readModeFromExtension(this.filename)
        this.setMode(mode)
        this.filenameDisplay.innerText = this.filename
        this.filepathDisplay.innerText = this.pathToFile
        this.saveEditorWindowState()
    }

    async selectFile(path, filename=""){
        this.pathToFile = path
        this.filename = filename || this.extractFilename(path)
        this.content = await this.exec("getFileContent", [this.pathToFile])
        this.editor.setValue(this.content)
        let mode = this.readModeFromExtension(this.filename)
        this.setMode(mode)
        this.filenameDisplay.innerText = this.filename
        this.filepathDisplay.innerText = this.pathToFile
        
        this.saveEditorWindowState()
    }

    saveEditorWindowState(){
        try{
            this.winbox.launcher.opts.pathToFile = this.pathToFile
            this.winbox.launcher.opts.content = this.content
        }catch(e){
            console.log(e)
        }
    }

    async changeFile(path){
        const willChange = await prompt({
            message:`Do you want to change editor file to ${path}`
        })
        if(!willChange) return false

        if(this.filename !== ''){
            const willSave = await prompt({
                message:'Do you want to save before exiting?'
            })

            if(willSave){
                const saved = await this.save()
                if(saved && saved.error) popup(JSON.stringify(saved))
            }
        }
 

        this.selectFile(path)
    }

    async save(content, path){
        console.log('Editor Save Path', path)
        if(!path) path = this.pathToFile 
        this.saveEditorWindowState()
        const fileExists = await this.exec("getFile", [path])
        if(!fileExists || path == ""){
            return await this.saveAs()
        }else{
            if(!content) content = this.editor.getValue()
            this.saved = true
            return await this.exec("editFile", [path, content])
        }
    }
    
    async saveAs(){
        const content = this.editor.getValue()
        const selection = await this.selectSavePath(this.filename, "select")
       
        if(!selection) return false

        this.filename = selection.saved.filename
        this.path = selection.saved.path + this.filename

         const fileExists = await this.exec("getFile", [this.path])
        
        if(fileExists && !fileExists.error){
            const overwritten = await this.overwrite(this.path, content)
            this.saved = true
            if(!overwritten) return false
            else return { saved:overwritten }
        }else{
            const saved = await this.exec('touch',[this.path,content])
            this.saved = true
            if(!saved || saved.error) return { cancelled:true, error:saved }

            return { saved:saved }
        }

    }

    async selectSavePath(filename, mode="save"){
        return new Promise((resolve)=>{
            new SaveAsDialog({ filename:filename, mode:mode })

            window.addEventListener('dialog-save', async function(event){
                const selection = event.detail
                if(selection.cancelled){
                    resolve(false)
                }else{
                    resolve({ saved:selection })
                }
            }, { once:true })
            
        })
    }

    async overwrite(filename, filecontent){
        confirmation({
            message:`Are you sure you want to overwrite file ${filename}?`,
            yes:async ()=> await this.exec("editFile", [filename, filecontent]),
            no:()=>false
        })
    }

    injectDOM(){
        this.editorContainer = document.querySelector("#editor-container")
        const editorDOMString = this.buildEditorDOM()
        this.editorContainer.insertAdjacentHTML("beforeend", editorDOMString);
        // this.editorContainer.innerHTML = this.editorContainer.innerHTML + editorDOMString
        const editorDOM = document.querySelector(`#editor-${this.editorId}`)
        return editorDOM
    }

    buildEditorDOM(){
        return `
        
        <div id="editor-wrapper-${this.editorId}" class="editor-wrapper" >
            <link rel="stylesheet" href="./css/topnav.css">
            <div style="display:block">
                <nav class="file-menu" role="navigation">
                    <ul class="menu-item-list editor-nav">
                        <li class="menu-item"><a>File</a>
                        <ul class="dropdown">
                            <li onclick="sendEvent('message-${this.editorId}',{ newFileEditor:'${this.editorId}' })" class="dropdown-item hoverable"><a>New</a></li>
                            <li onclick="sendEvent('message-${this.editorId}',{ openFileEditor:'${this.editorId}' })" class="dropdown-item hoverable"><a>Open</a></li>
                            <li onclick="sendEvent('message-${this.editorId}',{ saveEditor:'${this.editorId}' })" class="dropdown-item hoverable"><a>Save</a></li>
                            <li onclick="sendEvent('message-${this.editorId}',{ saveAsEditor:'${this.editorId}' })" class="dropdown-item hoverable"><a>Save As</a></li>
                            <li onclick="sendEvent('message-${this.editorId}',{ openSettings:'${this.editorId}' })" class="dropdown-item hoverable"><a>Settings</a></li>
                            <li class="dropdown-item hoverable"><a>Exit</a></li>
                        </ul>
                        </li>
                        <li id="info-display-block-${this.editorId}" class="info-display">
                            <span>Filename: </span>
                            <span id="filename-display-${this.editorId}">${this.filename}</span>
                              |  
                            <span>Path: </span>
                            <span id="filepath-display-${this.editorId}">${this.pathToFile}</span>
                        </li>
                    </ul>
                </nav>
            </div>
            <div style="display:block">
                
            </div>
            <div id="folder-view-${this.editorId}" class="folder-view-editor"></div>
            <div id="editor-${this.editorId}" class="editor" style="margin-top:10px;"></div>
            <script>
                $("#folder-view-${this.editorId}").resizable()
            </script>
        </div>
        `
    }
}

window.Editor = Editor


class Notepad{
    constructor(pathToFile="", content=""){
        
        this.editorId = Date.now()
        this.pathToFile = pathToFile
        this.filename = this.extractFilename(this.pathToFile)
        this.content = content
        this.dirPointerId = ""
        this.editorContainer = ""
        this.editorDOM = ""
        this.editor = ""
        this.saved = (pathToFile === '')
        this.listenerController = new AbortController();
        this.init()
    }

    async startEditor(content=" "){
       
        let editor = ace.edit(`editor-${this.editorId}`);
        editor.session.setMode(`ace/mode/text`);
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
        editor.setValue(content);
        window.editorInstance = editor
        return editor
    }

    async init(){
        const { signal } = this.listenerController 
        this.editorDOM = this.injectDOM()
        this.editorWrapper = document.querySelector(`#editor-wrapper-${this.editorId}`)
        
        this.dirPointerId = await getNewPointerId(this.editorId)
        await this.exec('cd',["/"])

        if(this.pathToFile !== ''){
            this.content = await this.exec('getFileContent',[this.pathToFile])
        }

        this.editor = await this.startEditor(this.content)

        this.editor.session.on('change', function(delta) {
            //watch for change to enable prompt for saving file upon closing window
            this.saved = false
        });
        
        this.winbox = new ApplicationWindow({ 
            title: "Notepad",
            label:`notepad-${this.editorId}`,
            height:"95%", 
            width:"80%",
            mount:this.editorWrapper,
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
       
    }
    
    
    close(){
        const filecontent = this.editor.getValue()
        this.editorWrapper.style.visibility = 'hidden'
        this.listenerController.abort()
        if(!this.saved){
            confirmation({
                message:'Do you want to save before exiting?',
                yes:async()=>{
                    
                    const saved = await this.save(filecontent, this.pathToFile)
                    if(saved && saved.error) popup(JSON.stringify(saved))
                    
                },
                no:()=>{}
            })

        }
        
        this.destroy()
    }

    destroy(){
        
        this.editor.destroy()
        this.editorWrapper.remove()
        this.editor.container.remove()
        // delete window.openWindows[`notepad-${this.notepadId}`]
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
    }

    async selectFile(path, filename=""){
        this.pathToFile = path
        this.filename = filename || this.extractFilename(path)
        this.content = await this.exec("getFileContent", [this.pathToFile])
        this.editor.setValue(this.content)
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
                const saved = await this.save(filecontent, this.pathToFile)
                if(saved && saved.error) popup(JSON.stringify(saved))
            }
        }

        this.selectFile(path)
    }

    async save(){
        const fileExists = await this.exec("getFile", [this.pathToFile])
        if(!fileExists || this.pathToFile == ""){
            return await this.saveAs()
        }else{
            const content = this.editor.getValue()
            this.saved = true
            return await this.exec("editFile", [this.pathToFile, content])
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
        this.editorContainer.innerHTML = this.editorContainer.innerHTML + editorDOMString
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
                    </ul>
                </nav>
            </div>
            
            <div id="editor-${this.editorId}" class="editor" style="margin-top:10px;">
                
            </div>
        </div>
        `
    }
}


class Editor{
    constructor(pathToFile="", content=""){
        
        this.editorId = Date.now()
        this.pathToFile = pathToFile
        this.filename = this.extractFilename(this.pathToFile)
        this.content = content
        this.dirPointerId = ""
        this.editorContainer = ""
        this.editorDOM = ""
        this.editor = ""
        this.collapsible = ""
        this.saved = (pathToFile === '')
        this.init()
    }

    async startEditor(filename, content){
        const [ name, ...extensions ] = filename.split(".")
        const lastExtension = extensions[extensions.length - 1]
        let mode = getNameFromExtension(lastExtension)
        let theme = 'monokai' //Read config file/json

        if(!mode) mode = 'text'
        if(!theme) theme = "monokai"

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
        editor.setValue(content);
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
        this.editorDOM = this.injectDOM()
        this.editorWrapper = document.querySelector(`#editor-wrapper-${this.editorId}`)
        this.folderView = document.querySelector(`#folder-view-${this.editorId}`)
        
        
        
        this.dirPointerId = await getNewPointerId(this.editorId)
        await this.exec('cd',["/"])

        if(this.pathToFile !== ''){
            this.content = await this.exec('getFileContent',[this.pathToFile])
        }

        this.editor = await this.startEditor(this.filename, this.content)

        this.editor.session.on('change', function(delta) {
            this.saved = false
        });
        
        this.winbox = new WinBox({ 
            title: "Editor", 
            height:"95%", 
            width:"80%",
            mount:this.editorWrapper,
            onclose:()=>{
                this.close()
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

        this.makeFolderView()

        window.addEventListener('message', async (event)=>{
            const message = event.data
            if(message.newFileEditor && message.newFileEditor == this.editorId){
                this.newFile()
            }else if(message.openFileEditor && message.openFileEditor == this.editorId){
                this.openFile()
            }else if(message.saveEditor && message.saveEditor == this.editorId){
                this.save()
            }else if(message.saveAsEditor && message.saveAsEditor == this.editorId){
                this.saveAs()
            }else if(message.collapseFileOpen && message.id == this.collapsible.collapsibleId){
                this.changeFile(message.collapseFileOpen)
            }
        })
    }

    close(){
        const filecontent = this.editor.getValue()
        this.editorWrapper.style.visibility = 'hidden'
        
        if(!this.saved){
            confirmation({
                message:'Do you want to save before exiting?',
                yes:async()=>{
                    
                    const saved = await this.save(filecontent, this.pathToFile)
                    if(saved && saved.error) popup(JSON.stringify(saved))
                    this.destroy()
                },
                no:()=>{
                    this.destroy()
                }
            })

        }else{
            this.destroy()
        }
        
    }

    destroy(){
        
        this.editor.destroy()
        this.editorWrapper.remove()
        this.editor.container.remove()
    }

    makeFolderView(){
        const folderView = document.querySelector(`#folder-view-${this.editorId}`)
        this.collapsible = new CollapsibleBar({ mountDOM:folderView })
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
        const selection = await this.selectSavePath()
        if(!selection) return false

        this.filename = selection.saved.filename
        this.pathToFile = selection.saved.path + this.filename
        this.content = await this.exec("getFileContent", [this.pathToFile])
        this.editor.setValue(this.content)
        let mode = this.readModeFromExtension(this.filename)
        this.setMode(mode)
    }

    async selectFile(path){
        this.pathToFile = path
        this.filename = this.extractFilename(path)
        this.content = await this.exec("getFileContent", [this.pathToFile])
        this.editor.setValue(this.content)
        let mode = this.readModeFromExtension(this.filename)
        this.setMode(mode)
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
        const selection = await this.selectSavePath(this.filename)
        console.log('Selection', selection)
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

    async selectSavePath(filename){
        return new Promise((resolve)=>{
            console.log('Save as dialog initial filename', filename)
            console.log('Path ', this.path)
            new SaveAsDialog({ filename:filename })

            window.addEventListener('message', async (event)=>{
                const message = event.data
                if(message.dialogSave){
                    resolve({ saved:message.dialogSave })
                }else if(message.dialogCancel){
                    resolve(false)
                }
            })
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
                    <ul class="menu-item-list">
                        <li class="menu-item"><a href="#">File</a>
                        <ul class="dropdown">
                            <li onclick="window.postMessage({ newFileEditor:'${this.editorId}' })" class="dropdown-item hoverable"><a>New</a></li>
                            <li onclick="window.postMessage({ openFileEditor:'${this.editorId}' })" class="dropdown-item hoverable"><a>Open</a></li>
                            <li onclick="window.postMessage({ saveEditor:'${this.editorId}' })" class="dropdown-item hoverable"><a>Save</a></li>
                            <li onclick="window.postMessage({ saveAsEditor:'${this.editorId}' })" class="dropdown-item hoverable"><a>Save As</a></li>
                            <li class="dropdown-item hoverable"><a>Exit</a></li>
                        </ul>
                        </li>
                        
                    </ul>
                </nav>
            </div>
            <div id="folder-view-${this.editorId}" class="folder-view-editor"></div>
            <div id="editor-${this.editorId}" class="editor" style="margin-top:10px;">
                
            </div>
            <script>
                $("#folder-view-${this.editorId}").resizable()
            </script>
        </div>
        `
    }
}
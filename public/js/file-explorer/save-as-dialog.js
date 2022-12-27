class SaveAsDialog{
    constructor(x=0, y=0, opts={}){
        this.x = x
        this.y = y
        this.width = opts.width || '70%'
        this.height = opts.height || '60%'
        this.dialogWindow = ""
        this.explorerId = Date.now()
        this.pointerId = false
        this.currentDirContents = []
        this.fullPaths = []
        this.workingDir = ""
        this.dialogDOM = ""
        this.homePath = (
            window.username == 'root' ? 
                mountPoint+"/public/userspaces/root/home/" 
                : 
                mountPoint+"/home/"
            )
        this.init()
        this.listener = ""
        this.opts = opts
    }

    async exec(cmd, args){
        return await exec(cmd, args, this.pointerId)
    }

    async init(){
        this.pointerId = await getNewPointerId(this.explorerId)
        this.createDOM()
        this.launchWindow()
        await this.refreshExplorer()
        this.makeExplorerMenu()
        this.listener = window.addEventListener("message", (e)=>{
            this.handleExplorerMessage(e)
        }, true);
    }

    createDOM(){
        this.dialogDOM = `
        <link rel="stylesheet" href="./css/save-as-dialog.css">
        <div id="dialog-window-wrapper">
            <div id="dialog-window">
                <span id="save-as-label">Save file to:</span>
                <div id="input-line">
                    <input id="path-viewer-input" type="text" readonly value="/system/home/downloads" />
                    <button onclick="" id="select-path">Select</button>
                </div>
                <div id="dialog-explorer-box">

                </div>
                <div id="filename-input-line">
                    <span id="filename-label">File name: </span>
                    <input type="text" id="save-file-as" />
                </div>
                <div id="filetype-list-line">
                    <label for="file-type-list">File Type:</label>
                    <select id="file-type-list" name="file-type-list">
                    <option value="html">HTML (*.html)</option>
                    <option value="CSS">CSS (*.css)</option>
                    <option value="JS">Javascript (*.js)</option>
                    </select>
                </div>
                <div id="button-line">
                    <button onclick="window.postMessage({ saveDialog:true })" id="save-as-button">
                        Save
                    </button>
                    <button onclick="window.postMessage({ cancelDialog:true })" id="cancel-button">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
        `


    }

    close(){
        window.removeEventListener("message", this.handleExplorerMessage, true)
        this.currentDirContents = []
        this.fullPaths = []
        this.workingDir = ""
    }

    launchWindow(){
        this.dialogWindow = createWindow({ 
            title: "File Explorer",
            width:'71%',
            height:'80%',
            modal:true,
            html:this.dialogDOM,
            onclose:()=>{
                this.close()
            }
        })
    }

    handleExplorerMessage(event, that){
        const message = event.data
        
        if(message.explorerId && message.explorerId != this.explorerId){
            //skip messages sent from other explorer windows
            return false
        }

        if(message.changeDir){
            this.changeDirectory(message.changeDir)
        }else if(message.setDir){
            this.setWorkingDir(message.setDir)
        }else if(message.newDir){
            this.createNewDirectory()
        }else if(message.newFile){
            this.createNewFile()
        }else if(message.openFile){
            this.openFile(message.openFile)
        }else if(message.cancelDialog){
            this.cancel()
        }else if(message.saveDialog){
            this.save()
        }

        this.refreshExplorer(this.explorerId)
    }

    async cancel(){
        this.dialogWindow.close()
        window.postMessage({ dialogCancel:true })
    }

    async save(){
        const path = document.getElementById("path-viewer-input").value
        const filename = document.getElementById("save-file-as").value

        window.postMessage({ dialogSave:{ path:path, filename:filename } })
        this.dialogWindow.close()
    }

    async refreshExplorer(){
        this.setCurrentDirContents(this.workingDir)
        document.querySelector(`#path-viewer-input`).value = this.workingDir
        return true
    }

    async createNewDirectory(newDirNumber = 1){
        try{ 
            const newDirname = `newdirectory${newDirNumber}/`
            
            const path = (this.workingDir === "/" ? this.workingDir + newDirname : this.workingDir + "/" + newDirname)
            const contents = await this.exec("ls",[this.workingDir])

            if(!contents.error && !contents.includes(newDirname)){

                const created = await this.exec('mkdir', [path])
                this.refreshExplorer()
                newDirNumber = 0
                return created

            }else{
                return await this.createNewDirectory(newDirNumber + 1)
            }
        }catch(e){
            console.log(e)
            return e
        }
    }

    async createNewFile(newFileNumber = 1){
        //    if(newFileNumber > maxNewElementNumber) throw new Error('Cannot create more new files')
           try{ 
               const newFilename = `newfile${newFileNumber}`
               const path = (workingDir === "/" ? this.workingDir + newFilename : this.workingDir + "/" + newFilename)
               const contents = await this.exec("ls",[this.workingDir])
    
               if(!contents.error && !contents.includes(newFilename)){
    
                   const created = await this.exec('touch', [path])
                   this.refreshExplorer()
                   newFileNumber = 0
                   return created
    
               }else{
                   return await this.createNewFile(newFileNumber + 1)
               }
    
           }catch(e){
               console.log(e)
               return e
           }
    }

    async rename(element){
        $(element).attr('contentEditable', false);
        const previousName = $(element).attr("data-name").replace("/","")
        const newName = $(element).html().replace("/","")

        const previousPath = `${this.workingDir}${$(element).attr("data-name").replace("/","")}`
        const newPath = `${this.workingDir}${$(element).html().replace("/","")}`

        const nameValidator = /^(\w+\.?)*\w+$/
        
        if(nameValidator.test(newName) === false){
            popup("Directory name can only contain alphanumerical characters")
            $(element).html(previousName)
            return false
        }else{
            const workd = await this.exec("mv",[previousPath,newPath])
            console.log(workd)
        }
        
    }

    deleteElement(element, type="file"){
        confirmation({
            message:`Are you sure you want to delete this ${type}?`,
            yes:async ()=>{
                const path = `${this.workingDir}${element.dataset.name}`
                console.log('Delete path', path)
                if(type == "directory"){
                    const deleted = await this.exec("rmdir",[path])
                    if(deleted.error) popup(deleted.error)
                }else{
                    const deleted = await this.exec("rm",[path])
                    if(deleted.error) popup(deleted.error)
                }
                this.refreshExplorer()
            },
            no:()=>{}
        })
        
    }

    async openFile(path){
        const file = await this.exec("getFile", [path])
    
        const fileExtension = this.handleExtension(file.name)
        if(fileExtension == "png" || fileExtension == 'jpg' || fileExtension == "gif"){
            
            this.viewImage(file)
        }else{
            window.launchEditor(path, file.content, this.pointerId)
        }
        
    }

    viewImage(file){
        const imagePath = file.path.replace("/public", "")
        
        const imageViewer = new WinBox({ title:"Viewer", html:`
        <img src="${imagePath}" style="height:100%;width:100%;" />
            ` })
    }
    

    handleExtension(filename){
        const [ name, ...extensions ] = filename.split(".")
    
        return extensions[extensions.length - 1]
    }

    createDialogElement(element, path){
        if(path === "/") path = ""
        
        let elementDOM = ``
        if(element.includes("/") || element == ".."){
            elementDOM = `
            <div class="dialog-item-wrapper hoverable">
                <div class="dialog-item">
                    <a  data-path="/${path}${element}" 
                        data-workingdir="/${path}"
                        data-name="${element}" onclick="window.postMessage({ 
                            changeDir:this.dataset.name,
                            explorerId:'${this.explorerId}'
                        })"
                        class="dialog-item-link link directory">
                        <img 
                            id="${element}-${this.explorerId}" 
                            class="explorer-icon draggable" 
                            src="./images/icons/folder-medium.png"
                        />
                        <span class="element-name" data-name="${element}" onclick="">${element}</span>
                    </a>
                </div>
            </div>
            `
            /**                         
                        
                                                <img id="${element}-${this.explorerId}" class="explorer-icon draggable" 
                            src="./images/icons/file-medium.png"
                        />*/
        }else{
            elementDOM = `
            <div class="dialog-item-wrapper hoverable">
                <div class="dialog-item">
                    <a  data-path="/${path}${element}" 
                        data-workingdir="/${path}"
                        data-name="${element}" onclick=""
                        class="dialog-item-link link file">
                        <img 
                            id="${element}-${this.explorerId}" 
                            class="explorer-icon draggable" 
                            src="./images/icons/file-medium.png"
                        />
                        <span class="element-name" data-name="${element}" onclick="">${element}</span>
                    </a>
                </div>
               
            </div>
            `
        }
        
        return elementDOM
     }

     async setCurrentDirContents(){
       
        const explorerElement = document.getElementById(`dialog-explorer-box`)
        
        const contents = await this.exec("ls",[this.workingDir])
        if(Array.isArray(contents)){
             this.currentDirContents = contents
             this.fullPaths = []
        }
        
        if(this.currentDirContents.error) throw new Error(this.currentDirContents.error)
 
        let domToAdd = ""
 
        for await(const element of this.currentDirContents){
             this.fullPaths.push(`${this.workingDir}${element}`)
             domToAdd = domToAdd + this.createDialogElement(element, this.workingDir)
        }
        
        explorerElement.innerHTML = domToAdd
 
        const directories = document.getElementsByClassName("directory")
        
        for(const directory of directories){
            this.makeDirectoryMenu(directory)
        }
 
        $('.element-name').bind('dblclick', function() {
             $(this).attr('contentEditable', true);
         }).blur(function() {
             this.rename(this)
         });
 
        const files = document.getElementsByClassName("file")
        for(const file of files){
             this.makeFileMenu(file)
        }
        
        
        return domToAdd
      }

      async changeDirectory(targetDir){
        this.workingDir = this.workingDir.replace("//","/")
        targetDir = targetDir.replace("//","/")

        console.log('TargetDir', targetDir)

        if(targetDir == '..' && this.workingDir !== "/"){

            let pathArray = this.workingDir.split("/").filter(entry => entry != "")
            pathArray.pop()
            this.workingDir = pathArray.join("/")
            if(this.workingDir[this.workingDir.length - 1] != "/") this.workingDir = this.workingDir + "/"

        }if(targetDir == '..' && this.workingDir === "/"){
            
            this.workingDir = "/"

        }else{

            const hasDirectory = await this.exec("exists",[this.workingDir+targetDir])
            
            if(hasDirectory){
                if(this.workingDir === "/" && targetDir === "..")
                    this.workingDir = "/"
                else if(this.workingDir == mountPoint+"/..")
                    this.workingDir = "/"
                else if(this.workingDir !== "/" && targetDir === "..")
                    targetDir = targetDir + "/"   
                else
                    this.workingDir = this.workingDir + targetDir
            }

        }

        this.refreshExplorer()
     }

     setWorkingDir(path){
        if(path === "/"){
            this.workingDir = "/"
            return this.refreshExplorer()
        }

        const pathArray = path.split("/").filter(e => e !== "")
        let target = pathArray.pop()
        const pathToTarget = pathArray.join("/")
        
        this.workingDir = (pathToTarget[pathToTarget - 1] === "/"? pathToTarget : pathToTarget + "/")
        if(target[target.length] !== "/") target = target + "/"
        this.changeDirectory(target)
     }

     makeExplorerMenu(opts={}){
        new VanillaContextMenu({
            scope: document.querySelector(`#dialog-window`),
            menuItems: [
                { 
                    label: 'Create new directory',
                    iconHTML: `<img src="./images/icons/folder.png" height="20px" width="20px"></i>`,
                    callback: () => {
                        this.createNewDirectory()
                    }},
                { 
                    label: 'Create new file',
                    iconHTML: `<img src="./images/icons/file.png" height="20px" width="20px"></i>`,
                    callback: () => {
                        this.createNewFile()
                    }
                },
                { 
                    label: 'Get info', 
                    iconHTML: `<img src="./images/icons/file-explorer.png" height="20px" width="20px"></i>`,
                    callback: ()=>{
                        
                    }, 
                },
            ],
        })
    }

    makeDirectoryMenu(element){
        
        new VanillaContextMenu({
            scope: element,
            menuItems: [{ 
                  label: 'Open',
                  iconHTML: `<img src="./images/icons/folder.png" height="20px" width="20px">`,
                  callback: () => this.changeDirectory(element.dataset.name)
                },{ 
                    label: 'Remove',
                    iconHTML: `<img src="./images/icons/file.png" height="20px" width="20px">`,
                    callback: (e) => this.deleteElement(element, 'directory')
                },{ 
                    label: 'Get info', 
                    iconHTML: `<img src="./images/icons/file-explorer.png" height="20px" width="20px">`,
                    callback: ()=>{
                        popup(...element.dataset)
                    }, 
                }],
        })
    }

    makeFileMenu(element){
        
        new VanillaContextMenu({
            scope: element,
            menuItems: [{ 
                  label: 'Open',
                  iconHTML: `<img src="./images/icons/folder.png" height="20px" width="20px"></i>`,
                  callback: () => this.openFile(element.dataset.name)
                },{ 
                    label: 'Remove',
                    iconHTML: `<img src="./images/icons/file.png" height="20px" width="20px"></i>`,
                    callback: (e) => this.deleteElement(element, 'file')
                },{ 
                    label: 'Get info', 
                    iconHTML: `<img src="./images/icons/file-explorer.png" height="20px" width="20px"></i>`,
                    callback: ()=>{
                        popup(...element.dataset)
                    }, 
                }],
        })
    }
    
}

let mountPoint = window.MOUNT_POINT || "system"

class FileExplorer{
    constructor(x=0, y=0, opts){
        this.x = x
        this.y = y
        this.explorerId = Date.now()
        this.pointerId = false
        this.currentDirContents = []
        this.fullPaths = []
        this.workingDir = ""
        this.explorerDOM = ""
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
        this.explorerDOM = `

        <div id="file-explorer-wrapper-${this.explorerId}" class="file-explorer-wrapper">
            <link rel="stylesheet" href="./css/explorer.css">
            <script src="./js/external/jquery-2.1.1.min.js"></script>
            <script src="./js/external/jquery-ui.min.js"></script>
            <script src="./js/external/boxicons.js"></script>

            <nav class="file-menu" role="navigation">
                <ul class="menu-item-list">
                    <li class="menu-item"><a href="#">File</a>
                    <ul class="dropdown">
                        <li onclick="window.postMessage({ newFile:true })" class="dropdown-item hoverable"><a href="#">New File</a></li>
                        <li onclick="window.postMessage({ newDir:true })" class="dropdown-item hoverable"><a href="#">New Directory</a></li>
                        <li class="dropdown-item hoverable"><a href="#">Settings</a></li>
                        <li class="dropdown-item hoverable"><a href="#">Exit</a></li>
                    </ul>
                    </li>
                </ul>
            </nav>
            <div id="explorer-window-container-${this.explorerId}" class="explorer-window-container">
                <div id="navigation-bar-container-${this.explorerId}" class="navigation-bar-container">
                    <input id="navigation-bar-${this.explorerId}" class="navigation-bar">
                    <button onclick="window.postMessage({ setDir:this.parentElement.children[0].value, explorerId:'${this.explorerId}' })" class="">Go</button>
                </div>
                <div id="explorer-window-${this.explorerId}" class="explorer-window">

                    <div id="side-bar-${this.explorerId}" class="side-bar">
                        <div id="quick-access-${this.explorerId}" class="quick-access">
                            <span id="quick-access-title-${this.explorerId}" class="quick-access-title"><b>Quick Access</b></span>
                            <ul>
                                <li>
                                    <span>
                                        <a class="dir-link" onclick="window.postMessage({ setDir:'/', explorerId:'${this.explorerId}' })">Root</a>
                                    </span>
                                </li>
                                <li>
                                    <span>
                                        <a class="dir-link" onclick="window.postMessage({ setDir:'/${this.homePath}', explorerId:'${this.explorerId}' })">Home</a>
                                    </span>
                                </li>
                                <li>
                                    <span>
                                        <a class="dir-link" onclick="window.postMessage({ setDir:'/${this.homePath}desktop/', explorerId:'${this.explorerId}' })">Desktop</a>
                                    </span>
                                </li>
                                
                            </ul>
                        </div>
                        <hr>
                    </div>
                    <div id="explorer-${this.explorerId}" class="explorer">

                    </div>
                </div>

            </div>

        </div>`
    }

    close(){
        window.removeEventListener("message", this.handleExplorerMessage, true)
        this.currentDirContents = []
        this.fullPaths = []
        this.workingDir = ""
    }

    launchWindow(){
        createWindow({ 
            title: "File Explorer", 
            height:"60%", 
            width:"70%", 
            x:this.x,
            y:this.y,
            launcher:{
                //enables start at boot
                name:"makeFileExplorer",
                params:[this.x, this.y, this.opts]
            },
            html:this.explorerDOM,
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
        }

        this.refreshExplorer(this.explorerId)
    }

    async refreshExplorer(){
        this.setCurrentDirContents(this.workingDir)
        document.querySelector(`#navigation-bar-${this.explorerId}`).value = this.workingDir
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

    createElement(element, path){
        if(path === "/") path = ""

        let elementDOM = ""
        if(element.includes("/") || element == ".."){
            elementDOM = `
            <div class="explorer-item-wrapper ">
                <div class="explorer-item">
                    <a  data-path="/${path}${element}" 
                        data-workingdir="/${path}"
                        data-name="${element}" onclick="window.postMessage({ 
                            changeDir:this.dataset.name, 
                            explorerId:'${this.explorerId}' 
                        })"
                        class="link directory">
                        <img id="${element}-${this.explorerId}" class="explorer-icon draggable droppable" src="./images/icons/folder-medium.png" />
                        
                    </a>
                    <span class="element-name" data-name="${element}" onclick="">${element}</span>
                </div>
            </div>`
        }else{
            elementDOM = `
            <div class="explorer-item-wrapper ">
                <div class="explorer-item">
                    <a  data-path="/${path}${element}" 
                            data-workingdir="/${path}"
                            data-name="${element}" onclick="window.postMessage({ 
                                openFile:this.dataset.path,
                                explorerId:'${this.explorerId}'
                            })"
                            class="explorer-item link file">
                            <img id="${element}-${this.explorerId}" class="explorer-icon draggable" 
                                src="./images/icons/file-medium.png"
                            />
                            
                    </a>
                    <span class="element-name" data-name="${element}" onclick="">${element}</span>
                </div>
            </div>`
        }
        
        return elementDOM
        
     }

     async setCurrentDirContents(){
       
        const explorerElement = document.getElementById(`explorer-${this.explorerId}`)
        
        const contents = await this.exec("ls",[this.workingDir])
        if(Array.isArray(contents)){
             this.currentDirContents = contents
             this.fullPaths = []
        }
        
        if(this.currentDirContents.error) throw new Error(this.currentDirContents.error)
 
        let domToAdd = ""
 
        for await(const element of this.currentDirContents){
             this.fullPaths.push(`${this.workingDir}${element}`)
             domToAdd = domToAdd + this.createElement(element, this.workingDir)
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
        console.log('Targetdir', targetDir)
        if(targetDir == '..' && this.workingDir !== "/"){

            let pathArray = this.workingDir.split("/").filter(entry => entry != "")
            pathArray.pop()
            this.workingDir = pathArray.join("/")
            if(this.workingDir[this.workingDir.length - 1] != "/") this.workingDir = this.workingDir + "/"

        }if(targetDir == '..' && this.workingDir === "/"){
            console.log('WD is not root')
            this.workingDir = "/"

        }else{

            const hasDirectory = await this.exec("exists",[this.workingDir+targetDir])
            console.log('Has',hasDirectory)
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
            scope: document.querySelector(`#explorer-window-${this.explorerId}`),
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

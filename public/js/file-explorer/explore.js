
const makeFileExplorer = async (x=0, y=0, opts) =>{
    let currentDirContents = []
    let fullPaths = []
    let workingDir = ""
    
    let homePath = (window.username == 'root' ? "system/public/userspaces/root/home/" : "system/home/")
    
    const explorerHTML = `

    <div id="file-explorer-wrapper">
        <link rel="stylesheet" href="./css/explorer.css">
        <link rel="stylesheet" href="./css/external/jquery-ui.min.js">
        <link rel="stylesheet" href="./css/external/jquery-ui.structure.min.css">
        <link rel="stylesheet" href="./css/external/jquery-ui.theme.min.css">
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
        <div id="explorer-window-container">
            <div id="navigation-bar-container">
                <input id="navigation-bar">
                <button onclick="window.postMessage({ setDir:this.parentElement.children[0].value })" class="">Go</button>
            </div>
            <div id="explorer-window">

                <div id="side-bar">
                    <div id="quick-access">
                        <span id="quick-access-title"><b>Quick Access</b></span>
                        <ul>
                            <li>
                                <span>
                                    <a class="dir-link" onclick="window.postMessage({ setDir:'/' })">Root</a>
                                </span>
                            </li>
                            <li>
                                <span>
                                    <a class="dir-link" onclick="window.postMessage({ setDir:'/${homePath}' })">Home</a>
                                </span>
                            </li>
                            <li>
                                <span>
                                    <a class="dir-link" onclick="window.postMessage({ setDir:'/${homePath}desktop/' })">Desktop</a>
                                </span>
                            </li>
                            
                        </ul>
                    </div>
                    <hr>
                </div>
                <div id="explorer">

                </div>
            </div>

        </div>

    </div>`

    
    const fileExplorer = createWindow({ 
        title: "File Explorer", 
        height:"95%", 
        width:"80%", 
        x:x,
        y:y,
        launcher:{
            //enables start at boot
            name:"makeFileExplorer",
            params:[x, y, opts]
        },
        html:explorerHTML,
        onclose:()=>{
            window.removeEventListener("message", handleExplorerMessage, true)
            currentDirContents = []
            fullPaths = []
            workingDir = ""
        }
    })

    const handleExplorerMessage = (event) => {
        
        const message = event.data
        if(message.changeDir){
            const targetDir = message.changeDir
            changeDirectory(targetDir)
        }else if(message.setDir){
            const path = message.setDir
            setWorkingDir(path)
        }else if(message.newDir){
            createNewDirectory()
        }else if(message.newFile){
            createNewFile()
        }else if(message.refreshExplorer){
            refreshExplorer()
        }else if(message.openFile){
            
            openFile(message.openFile)
        }

        refreshExplorer()
    }

      

    const refreshExplorer = async () =>{
        setCurrentDirContents(workingDir)
        document.querySelector("#navigation-bar").value = workingDir
        return true
    }
      
     await exec("cd", ["/"])
     listener = window.addEventListener("message", handleExplorerMessage, true);

    //  let maxNewElementNumber = 500

     const createNewDirectory = async (newDirNumber = 1) =>{
    //    if(newDirNumber > maxNewElementNumber) throw new Error('Cannot create more new directories')
       try{ 
           const newDirname = `New_directory${newDirNumber}/`
           
           const path = (workingDir === "/" ? workingDir + newDirname : workingDir + "/" + newDirname)
           const contents = await exec("ls",[workingDir])

           if(!contents.error && !contents.includes(newDirname)){

               const created = await exec('mkdir', [path])
               refreshExplorer()
               newDirNumber = 0
               return created

           }else{
               return await createNewDirectory(newDirNumber + 1)
           }
       }catch(e){
           console.log(e)
           return e
       }
     }

     const createNewFile = async (newFileNumber = 1) =>{
    //    if(newFileNumber > maxNewElementNumber) throw new Error('Cannot create more new files')
       try{ 
           const newFilename = `New_file${newFileNumber}`
           const path = (workingDir === "/" ? workingDir + newFilename : workingDir + "/" + newFilename)
           const contents = await exec("ls",[workingDir])

           if(!contents.error && !contents.includes(newFilename)){

               const created = await exec('touch', [path])
               refreshExplorer()
               newFileNumber = 0
               return created

           }else{
               return await createNewFile(newFileNumber + 1)
           }

       }catch(e){
           console.log(e)
           return e
       }
     }

    const rename = async (element) =>{
        $(element).attr('contentEditable', false);
        const previousName = $(element).attr("data-name").replace("/","")
        const newName = $(element).html().replace("/","")

        const previousPath = `${workingDir}${$(element).attr("data-name").replace("/","")}`
        const newPath = `${workingDir}${$(element).html().replace("/","")}`

        const nameValidator = /^(\w+\.?)*\w+$/
        console.log('Is valid name?',nameValidator.test(newPath))
        if(nameValidator.test(newName) === false){
            popup("Directory name can only contain alphanumerical characters")
            $(element).html(previousName)
            return false
        }else{
            const workd = await exec("mv",[previousPath,newPath])
            console.log(workd)
        }
        
    }

    const deleteElement = (element, type="file") =>{
        confirmation({
            message:`Are you sure you want to delete this ${type}?`,
            yes:async ()=>{
                const path = `${workingDir}${element.dataset.name}`
                if(type == "directory"){
                    const deleted = await exec("rmdir",[path])
                    if(deleted.error) popup(deleted.error)
                }else{
                    const deleted = await exec("rm",[path])
                    if(deleted.error) popup(deleted.error)
                }
                refreshExplorer()
            },
            no:()=>{}
        })
        
    }

    

     const createElement = (element, path) =>{
        if(path === "/") path = ""

        let elementDOM = ""
        if(element.includes("/") || element == ".."){
            elementDOM = `
            <div class="explorer-item-wrapper ">
                <div class="explorer-item">
                    <a  data-path="${path}${element}" 
                        data-workingdir="/${path}"
                        data-name="${element}" onclick="window.postMessage({ changeDir:this.dataset.name })"
                        class="link directory">
                        <img id="${element}" class="explorer-icon draggable droppable" src="./images/icons/folder-medium.png" />
                        
                    </a>
                    <span class="element-name" data-name="${element}" onclick="">${element}</span>
                </div>
            </div>`
        }else{
            elementDOM = `
            <div class="explorer-item-wrapper ">
                <div class="explorer-item">
                    <a  data-path="${path}${element}" 
                            data-workingdir="/${path}"
                            data-name="${element}" onclick="window.postMessage({ openFile:this.dataset.name })"
                            class="explorer-item link file">
                            <img id="${element}" class="explorer-icon draggable" 
                                src="./images/icons/file-medium.png"
                            />
                            
                    </a>
                    <span class="element-name" data-name="${element}" onclick="">${element}</span>
                </div>
            </div>`
        }
        
        return elementDOM
        
     }

     const setCurrentDirContents = async (workingDir) =>{
       
       const explorerElement = document.getElementById("explorer")
       
       const contents = await exec("ls",[workingDir])
       if(Array.isArray(contents)){
            currentDirContents = contents
            fullPaths = []
       }
       
       if(currentDirContents.error) throw new Error(currentDirContents.error)

       let domToAdd = ""

       for await(const element of currentDirContents){
            fullPaths.push(`${workingDir}${element}`)
            domToAdd = domToAdd + createElement(element, workingDir)
       }
       
       explorerElement.innerHTML = domToAdd

       const directories = document.getElementsByClassName("directory")
       
       for(const directory of directories){
           makeDirectoryMenu(directory)
       }

       $('.element-name').bind('dblclick', function() {
            $(this).attr('contentEditable', true);
        }).blur(function() {
            rename(this)
        });

       const files = document.getElementsByClassName("file")
       for(const file of files){
            makeFileMenu(file)
       }
       
       
       return domToAdd
     }

     const changeDirectory = async (targetDir) =>{
        console.log('Workdir', workingDir)
        console.log('Target', targetDir)
        if(targetDir == '..' && workingDir !== "/"){

            let pathArray = workingDir.split("/").filter(entry => entry != "")
            pathArray.pop()
            workingDir = pathArray.join("/")
            if(workingDir[workingDir.length - 1] != "/") workingDir = workingDir + "/"

        }if(targetDir == '..' && workingDir === "/"){

            workingDir = "/"

        }else{

            const hasDirectory = await exec("exists",[workingDir+targetDir])
            
            if(hasDirectory){
                if(workingDir === "/" && targetDir === "..")
                    workingDir = "/"
                else if(workingDir == "system/..")
                    workingDir = "/"
                else if(workingDir !== "/" && targetDir === "..")
                    targetDir = targetDir + "/"   
                else
                    workingDir = workingDir + targetDir
            }

        }

        refreshExplorer()
     }


     const setWorkingDir = (path) =>{
        const pathArray = path.split("/").filter(e => e !== "")
        let target = pathArray.pop()
        const pathToTarget = pathArray.join("/")
        
        workingDir = (pathToTarget[pathToTarget - 1] === "/"? pathToTarget : pathToTarget + "/")
        if(target[target.length] !== "/") target = target + "/"
        changeDirectory(target)
     }

     const makeExplorerMenu = (opts={}) =>{
        new VanillaContextMenu({
            scope: document.querySelector('#explorer-window'),
            menuItems: [
                { 
                  label: 'Create new directory',
                  iconHTML: `<img src="./images/icons/folder.png" height="20px" width="20px"></i>`,
                  callback: () => {
                    createNewDirectory()
                  }},
                { 
                    label: 'Create new file',
                    iconHTML: `<img src="./images/icons/file.png" height="20px" width="20px"></i>`,
                    callback: (e) => {
                        createNewFile()
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

    const makeDirectoryMenu = (element) =>{
        
        new VanillaContextMenu({
            scope: element,
            menuItems: [{ 
                  label: 'Open',
                  iconHTML: `<img src="./images/icons/folder.png" height="20px" width="20px"></i>`,
                  callback: () => changeDirectory(element.dataset.name)
                },{ 
                    label: 'Remove',
                    iconHTML: `<img src="./images/icons/file.png" height="20px" width="20px"></i>`,
                    callback: (e) => deleteElement(element, 'directory')
                },{ 
                    label: 'Get info', 
                    iconHTML: `<img src="./images/icons/file-explorer.png" height="20px" width="20px"></i>`,
                    callback: ()=>{
                        popup(...element.dataset)
                    }, 
                }],
        })
    }

    const makeFileMenu = (element) =>{
        
        new VanillaContextMenu({
            scope: element,
            menuItems: [{ 
                  label: 'Open',
                  iconHTML: `<img src="./images/icons/folder.png" height="20px" width="20px"></i>`,
                  callback: () => openFile(element.dataset.name)
                },{ 
                    label: 'Remove',
                    iconHTML: `<img src="./images/icons/file.png" height="20px" width="20px"></i>`,
                    callback: (e) => deleteElement(element, 'file')
                },{ 
                    label: 'Get info', 
                    iconHTML: `<img src="./images/icons/file-explorer.png" height="20px" width="20px"></i>`,
                    callback: ()=>{
                        popup(...element.dataset)
                    }, 
                }],
        })
    }
     
    refreshExplorer()
    .then(()=>{
        makeExplorerMenu()
    })
    
    // makeDirectoryMenu()
    
}

window.makeFileExplorer = makeFileExplorer
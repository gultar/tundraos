
const makeFileExplorer = async () =>{
    let currentDirContents = []
    let workingDir = ""
    
    let homePath = (window.username == 'root' ? "system/userspaces/root/home/" : "system/home/")
    console.log('Home path', homePath)
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
                                <a class="dir-link" onclick="window.postMessage({ setDir:'${homePath}' })">Home</a>
                            </span>
                        </li>
                        <li>
                            <span>
                                <a class="dir-link" onclick="window.postMessage({ setDir:'${homePath}desktop/' })">Desktop</a>
                            </span>
                        </li>
                        
                    </ul>
                </div>
                <hr>
            </div>
            <div id="explorer">

            </div>
        </div>
    </div>`

    
    const fileExplorer = new WinBox({ 
        title: "File Explorer", 
        height:"95%", 
        width:"80%", 
        html:explorerHTML,
        onclose:()=>{
            window.removeEventListener("message", handleExplorerMessage, true)
            currentDirContents = []
            workingDir = ""
        }
    })

    const handleExplorerMessage = async (event) => {
        
        const message = event.data
        if(message.changeDir){
            const targetDir = message.changeDir
            console.log('TargetDir', targetDir)
            changeDirectory(targetDir)
        }else if(message.setDir){
            console.log('SET SIR', message.setDir)
            workingDir = message.setDir
            refreshExplorer()
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

      

    const refreshExplorer = () =>{
        setCurrentDirContents(workingDir)
    }
      
     await exec("cd", ["/"])
     listener = window.addEventListener("message", handleExplorerMessage, true);

     let maxNewElementNumber = 500
     const createNewDirectory = async (newDirNumber = 1) =>{
       if(newDirNumber > maxNewElementNumber) throw new Error('Cannot create more new directories')
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
       if(newFileNumber > maxNewElementNumber) throw new Error('Cannot create more new files')
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

     const createNewElement = (element) =>{
       return `<div class="explorer-item-wrapper">  
       <a onclick="window.postMessage({ ${(
           element.includes("/") || element === ".." ? 
           "changeDir:this.children[1].innerHTML" : 
           "openFile:this.children[1].innerHTML"
           )} })" class="explorer-item link">
           <img class="explorer-icon" src="./images/icons/${(element.includes("/") || element === ".." ? "folder":"file")}-medium.png" />
           <span class="element-name" onclick="">${element}</span>
       </a>
       </div>`
     }

    //  const setSideBarContent = (contents) =>{
    //     let dom = "<ul>"
    //     for(const element of contents){
    //         dom = dom + `
    //         <li>
    //             <span>
    //                 <a style="display:inline-block;cursor:pointer;margin:0;" onclick="window.postMessage({ ${(
    //                     element.includes("/") || element === ".." ? 
    //                     "openDir:this.innerText" : 
    //                     "openFile:this.innerText"
    //                     )} })">
    //                     ${element}
    //                 </a>
    //             </span>
    //         </li>`
    //     }

    //     dom = dom + "</ul>"
    //     const sideBar = document.getElementById("side-bar")
    //     sideBar.innerHTML = dom
    //  }

     const setCurrentDirContents = async (workingDir) =>{
       
       const explorerElement = document.getElementById("explorer")
       
       const contents = await exec("ls",[workingDir])
       if(Array.isArray(contents)){
            currentDirContents = contents
       }
       
       if(currentDirContents.error) throw new Error(currentDirContents.error)

       let domToAdd = ""

       for await(const element of currentDirContents){
           domToAdd = domToAdd + createNewElement(element)
       }
    //    setSideBarContent(contents)
       explorerElement.innerHTML = domToAdd
       return domToAdd
     }

     const changeDirectory = async (targetDir) =>{
        if(targetDir == '..' && workingDir !== "/"){

            let pathArray = workingDir.split("/").filter(entry => entry != "")
            pathArray.pop()
            workingDir = pathArray.join("/")
            if(workingDir[workingDir.length - 1] != "/") workingDir = workingDir + "/"

        }else{
            
            const exists = await exec("exists", [ workingDir + targetDir ])
            console.log('Exists', workingDir + targetDir, exists)
            if(exists){
                workingDir = workingDir + targetDir
            }
        }
     }
     
     
     refreshExplorer()

}
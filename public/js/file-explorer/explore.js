
const makeFileExplorer = async () =>{
    let currentDirContents = []
    let workingDir = ""
    let listener = false

    const explorerHTML = `<link rel="stylesheet" href="./js/file-explorer/style.css">
    <div id="file-explorer-wrapper">
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
        <div id="side-bar">
        </div>
        <div id="explorer">

        </div>
        <script src="./js/external/boxicons.js"></script>
    </div>`

    
    const fileExplorer = new WinBox({ 
        title: "File Explorer", 
        height:"95%", 
        width:"80%", 
        html:explorerHTML,
        onclose:()=>{
            window.removeEventListener("message", handleExplorerMessage, true)
            console.log('Removed')
            currentDirContents = []
            workingDir = ""
        }
    })

    const handleExplorerMessage = async (event) => {
        console.log('Message', event)
        const message = event.data
        if(message.changeDir){
            
            const targetDir = message.changeDir
            if(targetDir == '..' && workingDir !== "/"){

                let pathArray = workingDir.split("/").filter(entry => entry != "")
                pathArray.pop()
                workingDir = pathArray.join("/")
                if(workingDir[workingDir.length - 1] != "/") workingDir = workingDir + "/"

            }else{
                console.log('-------test----------')
                console.log('targetDir', targetDir)
                console.log('workingDir', workingDir)
                console.log('await exec("pwd")',await exec('pwd'))
                console.log('await exec("whereis", [targetDir])',await exec("whereis", [targetDir]))
                console.log('-------test----------')
                const exists = await exec("whereis", [targetDir])
                if(exists){
                    workingDir = await exec("whereis", [targetDir])
                    console.log('Set working dir', workingDir)
                }else{
                    console.log('NOT FOUND')
                    console.log('targetDir', targetDir)
                    console.log('workingDir', workingDir)
                    console.log('await exec("pwd")',await exec('pwd'))
                    console.log('await exec("whereis", [targetDir])',await exec("whereis", [targetDir]))
                    console.log('NOT FOUND')
                }
            }

        }else if(message.newDir){
            createNewDirectory()
        }else if(message.newFile){
            createNewFile()
        }else if(message.refreshExplorer){
            refreshExplorer()
        }else if(message.openFile){
            const filename = message.openFile
            
            const path = await exec('whereis', [filename])
            const file = await exec("getFile", [path])
            let fileExists = false
            
            if(file){
                fileExists = true
            }
            
            window.launchNotepad(filename, file.content, fileExists)
        }

        refreshExplorer()
        
      }

      
      await exec("cd", ["/"])

      const refreshExplorer = () =>{
       setCurrentDirContents(workingDir)
      }
     
     listener = window.addEventListener("message", handleExplorerMessage, true);

   //   let maxNewElementNumber = 500
   //   const createNewDirectory = async (newDirNumber = 1) =>{
   //     if(newDirNumber > maxNewElementNumber) throw new Error('Cannot create more new directories')
   //     try{ 
   //         const newDirname = `New_directory${newDirNumber}`
   //         const path = (workingDir === "/" ? workingDir + newDirname : workingDir + "/" + newDirname)
   //         const hasDir = await exec("find", [path])
           
   //         if(!hasDir){
   //             const created = await exec('mkdir', [path])
   //             refreshExplorer()
   //             newDirNumber = 0
   //             return created
   //         }else{
   //             return await createNewDirectory(newDirNumber + 1)
   //         }
   //     }catch(e){
   //         console.log(e)
   //         return e
   //     }
   //   }

   //   const createNewFile = async (newFileNumber = 1) =>{
   //     if(newFileNumber > maxNewElementNumber) throw new Error('Cannot create more new files')
   //     try{ 
   //         const newFilename = `New_file${newFileNumber}`
   //         const hasFile = await exec("getFile", [newFilename])
           
   //         if(!hasFile){
   //             const created = await exec('touch', [newFilename])
   //             refreshExplorer()
   //             newFileNumber = 0
   //             return created
   //         }else{
   //             return await createNewFile(newFileNumber + 1)
   //         }
   //     }catch(e){
   //         console.log(e)
   //         return e
   //     }
   //   }

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

     const setCurrentDirContents = async (workingDir) =>{
       
       const explorerElement = document.getElementById("explorer")
       console.log('Working', workingDir)
       const contents = await exec("ls",[workingDir])
       console.log('Contents', contents)
       if(Array.isArray(contents)){
        currentDirContents = contents
       }
       console.log('currentDirContents',currentDirContents)
       if(currentDirContents.error){
           console.log('Working', workingDir)
           throw new Error(currentDirContents.error)
       }

       let domToAdd = ""

       for await(const element of currentDirContents){
           domToAdd = domToAdd + createNewElement(element)
       }
       
       explorerElement.innerHTML = domToAdd
       return domToAdd
     }
     
     
     refreshExplorer()

}
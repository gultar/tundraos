
const makeFileExplorer = () =>{
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
    const fileExplorer = new WinBox({ title: "File Explorer", height:"95%", width:"80%", html:explorerHTML  });
    // 
    (()=>{
        let currentDirContents = []

       const refreshExplorer = async () =>{
        let wd = await exec("pwd")
        setCurrentDirContents(wd)
       }
      
      window.addEventListener("message", async (event) => {
        const message = event.data
        if(message.changeDir){
            const targetDir = message.changeDir
            const changed = await exec("cd", [targetDir])
            
        }else if(message.newDir){
            createNewDirectory()
        }else if(message.newFile){
            createNewFile()
        }else if(message.refreshExplorer){
            refreshExplorer()
        }else if(message.openFile){
            const filename = message.openFile
            const file = await exec("getFile", [filename])
            launchEditor(file.content, filename)
        }

        refreshExplorer()
        
      }, false);

      let maxNewElementNumber = 500
      const createNewDirectory = async (newDirNumber = 1) =>{
        if(newDirNumber > maxNewElementNumber) throw new Error('Cannot create more new directories')
        try{ 
            const newDirname = `New_directory${newDirNumber}`
            const hasDir = await exec("getDir", [newDirname])
            
            if(!hasDir){
                const created = await exec('mkdir', [newDirname])
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
            const hasFile = await exec("getFile", [newFilename])
            
            if(!hasFile){
                const created = await exec('touch', [newFilename])
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

      const setCurrentDirContents = async (path) =>{
        
        const explorerElement = document.getElementById("explorer")
        currentDirContents = await exec("ls",[])
        console.log(await exec("ls",["","full"]))
        let domToAdd = ""
        for await(const element of currentDirContents){
            domToAdd = domToAdd + createNewElement(element)
        }
        
        explorerElement.innerHTML = domToAdd
        return domToAdd
      }
      window.setCurrentDirContents = setCurrentDirContents
      
      refreshExplorer()

    })()

}
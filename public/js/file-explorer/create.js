
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

    <div id="explorer">

    </div>
    <script src="./js/external/boxicons.js"></script>
</div>`
    const fileExplorer = new WinBox({ title: "File Explorer", height:"95%", width:"80%", html:explorerHTML  });
    // 
    (async ()=>{
        let currentDirContents = []

       const refreshExplorer = async () =>{
        let wd = await exec("pwd")
        setCurrentDirContents(wd)
       }
      let currentDir = await exec("pwd")
      let newDirectoryCounter = 0
      let newFileCounter = 0
      /**parent.changeContents('${element}') */
      window.addEventListener("message", async (event) => {
        const message = event.data
        if(message.changeDir){
            const targetDir = message.changeDir
            const changed = await exec("cd", [targetDir])
            // setCurrentDirContents(targetDir)
        }else if(message.newDir){
            newDirectoryCounter++
            const newDirname = `Newdirectory${newDirectoryCounter}`
            const createdDir = await exec("mkdir", [newDirname])
        }else if(message.newFile){
            newFileCounter++
            const newFile = `Newfile${newFileCounter}`
            const createdFile = await exec("touch", [newFile])
        }else if(message.refreshExplorer){
            refreshExplorer()
        }

        refreshExplorer()
        
      }, false);

      const createNewElement = (element, linebreak=false) =>{
        return `<div class="explorer-item-wrapper">  
        <a onclick="window.postMessage({ changeDir:this.children[1].innerHTML })" class="explorer-item link">
            <img class="explorer-icon" src="./images/icons/${(element.includes("/") || element === ".." ? "folder":"file")}-medium.png" />
            <span class="element-name" onclick="">${element}</span>
        </a>
        </div>`
      }

      const setCurrentDirContents = async (path) =>{
        
        const explorerElement = document.getElementById("explorer")
        currentDirContents = await exec("ls",[])
        
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
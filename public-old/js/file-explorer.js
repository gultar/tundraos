
const makeFileExplorer = () =>{

    const style = `<style>
       .file-menu {
        display: block;
        transition-duration: 0.5s;
        background: transparent !important;
        
       }

       .hoverable:hover {
         cursor: pointer;
       }
       
       dropdown {
         visibility: hidden;
         opacity: 0;
         position: absolute;
         transition: all 0.5s ease;
         margin-top: 1rem;
         left: 0;
         display: none;
       }

       menu-item {

       }
       
       menu-item:hover {
         visibility: visible;
         opacity: 1;
         display: block;
       }

       .explorer-item:hover{
        cursor:pointer;
        color:blue;
       }
       
       dropdown-item {
         clear: both;
         
       }

       .file-menu{
        display:block;
       }

       #explorer {
         display:block;
         margin:10vh 5vh;
       }
    </style>`
    const explorerDOM = `
    ${style}
    <div id="file-explorer-wrapper">
        <nav class="file-menu" role="navigation">
            <ul class="menu-item-list">
                <li class="menu-item"><a href="#">File</a>
                <ul class="dropdown">
                    <li class="dropdown-item hoverable"><a href="#">New File</a></li>
                    <li class="dropdown-item hoverable"><a href="#">New Directory</a></li>
                    <li class="dropdown-item hoverable"><a href="#">Settings</a></li>
                    <li class="dropdown-item hoverable"><a href="#">Exit</a></li>
                </ul>
                </li>
            </ul>
        </nav>

    <div id="explorer">

    </div>
</div>
    `
    const fileExplorer = new WinBox({ title: "File Explorer", height:"95%", width:"80%", html:explorerDOM  });
    
    (async ()=>{
      let currentDir = await exec("pwd")
      /**parent.changeContents('${element}') */
      window.addEventListener("message", async (event) => {
        const targetDir = event.data
        const changed = await exec("cd", [targetDir])
        setCurrentDirContents(targetDir)
        
      }, false);

      const setCurrentDirContents = async (path) =>{
        
        const explorerElement = document.getElementById("explorer")
        const currentDirContents = await exec("ls",[])
        
        let domToAdd = ""
        for await(const element of currentDirContents){
            domToAdd = domToAdd + `<p><a onclick="window.postMessage(this.innerHTML)" class="explorer-item">${element}</a></p>`          
        }
        
        explorerElement.innerHTML = domToAdd
        return domToAdd
      }
      window.setCurrentDirContents = setCurrentDirContents
      
      setCurrentDirContents(currentDir)

    })()

}
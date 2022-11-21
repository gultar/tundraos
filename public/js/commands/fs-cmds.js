let FileSystem;
const fsBackupStr = localStorage.getItem("temp-fs")

let fsBackup = undefined;
if(fsBackupStr != undefined){
  try{
    fsBackup = JSON.parse(fsBackupStr)
    
  }catch(e){
    console.log(e)
  }
}
  

FileSystem = new VirtualFileSystem("temp") //ADD FSBACKUP
FileSystem.import(fsBackup)
const runFileSystemCommand = (cmd, args=[]) =>{
  try{
    console.log(cmd, args)
    const commandResult = FileSystem[cmd](...args)
    
    return commandResult
  }catch(e){
    console.log(e)
    return { error:e.message }
  }
}

const runFileManager = () =>{
  const anchor = document.getElementById("filemanager")
  const temp = anchor.insertAdjacentHTML('beforeEnd', `
  <iframe src="./js-fileexplorer/demo.html"></iframe>
  `)
  new WinBox({ title: "Window Title", height:"100%", width:"100%", mount:temp });
}

const saveState = () =>{
  const exported = FileSystem.export()
  
  return localStorage.setItem("temp-fs", exported)
}

document.addEventListener('visibilitychange', function() {
    saveState()
});

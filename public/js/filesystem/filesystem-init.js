const saveState = () =>{
  const exported = FileSystem.export()
  console.log('Exported', exported)
  return localStorage.setItem("filesystem", exported)
}

const init = () =>{
  let fsBackupStr = localStorage.getItem("filesystem")

  let fsBackup = undefined;
  if(fsBackupStr != undefined){
    try{
      fsBackup = JSON.parse(fsBackupStr)
      
    }catch(e){
      console.log(e)
      fsBackup = {}
    }
  }
  
  const VirtualFileSystem = require('./virtualfilesystem')
  const persistance = require('./localstorage-persistance')
  FileSystem = new VirtualFileSystem("guest",persistance) //ADD FSBACKUP
  FileSystem.import(fsBackup)
  window.Filesystem = FileSystem

  document.addEventListener('visibilitychange', function() {
      saveState()
  });
}

window.addEventListener("load", (event) => {
  console.log("page is fully loaded");
  init()
});

window.saveState = saveState
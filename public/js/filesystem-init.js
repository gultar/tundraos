let FileSystem;
let fsBackupStr = localStorage.getItem("temp-fs")

let fsBackup = undefined;
if(fsBackupStr != undefined){
  try{
    fsBackup = JSON.parse(fsBackupStr)
    
  }catch(e){
    console.log(e)
  }
}

const saveState = () =>{
  const exported = FileSystem.export()
  
  return localStorage.setItem("temp-fs", exported)
}

const refreshState = () =>{
  try{
    console.time('Refreshing FS')
    // FileSystem = new VirtualFileSystem("temp")
    const structure = FileSystem.export()
    const reimported = FileSystem.import(structure)
    console.timeEnd('Refreshing FS')
  }catch(e){
    console.log(e)
  }
}

const init = () =>{
  
  FileSystem = new VirtualFileSystem("temp") //ADD FSBACKUP
  FileSystem.import(fsBackup)
  window.Filesystem = FileSystem

  refresher()
  document.addEventListener('visibilitychange', function() {
      saveState()
  });
}

const refresher = () =>{
  setInterval(()=>{
    refreshState()
  }, 5000)
}

init()
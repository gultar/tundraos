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

FileSystem = new VirtualFileSystem("temp") //ADD FSBACKUP
FileSystem.import(fsBackup)

document.addEventListener('visibilitychange', function() {
    saveState()
});
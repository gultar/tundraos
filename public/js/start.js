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

const socket = new io("http://localhost:3333")
socket.on('connect', ()=>{
    console.log('Shell linked established')
})

socket.on('error', (err)=>{
    console.log(err)
})

const execRemoteCommand = (cmd, args=[]) =>{
  return new Promise((resolve, reject)=>{
    try{
      const commandString = `${cmd} ${args.join(" ")}`
      socket.once("shell-result", (result)=>{
        resolve(result)
      })
      console.log('Shell command', commandString)
      socket.emit("shell-command", commandString)
    }catch(e){
      reject(e)
    }
  })

}
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

const exec = async (cmd, args=[]) =>{
  if(socket.connected){
    return await execRemoteCommand(cmd, args)
  }else{
    return runFileSystemCommand(cmd, args)
  }
}




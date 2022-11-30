let socket = new io("http://localhost:8000")
let connections = 0
let connectionLimit = 5
socket.on('connect', ()=>{
    console.log('Shell linked established')
})

socket.on('connect_error', ()=>{
  console.log('connect attempt')
  if(connections > connectionLimit){
    socket.close()
  }else{
    connections++
  }
})

socket.on('reconnection', ()=>{
  reconnections = 0
})

socket.on('reconnect_attempt', ()=>{
  console.log('reconnect attempt')
  if(connections > connectionLimit){
    socket.close()
  }else{
    connections++
  }
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
      socket.emit("shell-command", commandString)
    }catch(e){
      reject(e)
    }
  })
}

const runFileSystemCommand = (cmd, args=[]) =>{
  try{
    const commandResult = FileSystem[cmd](...args)
    
    return commandResult
  }catch(e){
    console.log(e)
    return { error:e.message }
  }
}

const exec = async (cmd, args=[]) =>{
  if(socket.connected){
    return await execRemoteCommand(cmd, [...args])
  }else{
    return runFileSystemCommand(cmd, [...args])
  }
}






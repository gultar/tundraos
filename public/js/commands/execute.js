let directoryPointers = {}

const execServerCommand = async (cmd, args=[], instanceId) =>{
  if(!instanceId) throw new Error('Need to provide instance id to run command '+cmd)

  const directoryPointerid = await getPointer(instanceId)
  const {error, result} = await Promise.resolve($.post("http://localhost:8000/execute", {
      cmd:cmd,
      args:args,
      pointerId:directoryPointerid
    })
  )

  if(error) return { error:error }

  return result
}

const getPointer = async (instanceId) =>{
  let id = false
  if(directoryPointers[instanceId]){
    id = directoryPointers[instanceId]
  }else{
    id = await getNewPointerId(instanceId)
  }
  return id
}

const getNewPointerId = async (instanceId) =>{
  let id = false
  if(location.hostname == 'localhost'){
    const { pointerId } = await Promise.resolve($.get("http://localhost:8000/makepointer"))
    id = pointerId
  }else{
    id = Date.now() //If local file without server, make unique id from timestamp
  }
  directoryPointers[instanceId] = id
  return id
}

const destroyPointer = (id) =>{

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

const runRootCommand = async (commandStr) =>{
  const {error, result} = await Promise.resolve($.post("http://localhost:8000/rootcmd", {
        command:commandStr
  }));

  if(error) return error
  else return result
}

const exec = async (cmd, args=[], pointerId) =>{
  if(window.location.hostname == "localhost" || window.isElectron){
    if(cmd === "#"){
      return await runRootCommand(args[0])
    }
    else
    return await execServerCommand(cmd, [...args], pointerId)
  }else{
    return runFileSystemCommand(cmd, [...args])
  }
}





const execServerCommand = async (cmd, args=[]) =>{
  const {error, result} = await Promise.resolve($.post("http://localhost:8000/command", {
      cmd:cmd,
      args:args
    })
  );

  if(error) return { error:error }

  return result
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
  if(window.location.hostname == "localhost" || window.isElectron){
    return await execServerCommand(cmd, [...args])//execRemoteCommand(cmd, [...args])
  }else{
    return runFileSystemCommand(cmd, [...args])
  }
}





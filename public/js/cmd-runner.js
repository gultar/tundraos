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

const runRootCommand = async (commandStr) =>{
  const {error, result} = await Promise.resolve($.post("http://localhost:8000/rootcmd", {
        command:commandStr
  }));

  if(error) return error
  else return result
}

const exec = async (cmd, args=[]) =>{
  if(window.location.hostname == "localhost" || window.isElectron){
    if(cmd === "#"){
      return await runRootCommand(args[0])
    }
    else
    return await execServerCommand(cmd, [...args])
  }else{
    return runFileSystemCommand(cmd, [...args])
  }
}





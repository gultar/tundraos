const { exec } = require('node:child_process')
const VirtualFileSystem = require('./public/js/virtualfilesystem.js')
const runServer = require('./server.js')
const Termit = require("termit");
const { NodeVM } = require('vm2')
const fs = require('fs')
const ReadLine = require('readline')

let input = []
let readline = {}

const help = (cmd)=>{
  if(cmd){
    return helpMessages[cmd]
  }else{
    let fullMessage = ""
    for(const cmdName in helpMessages){
      fullMessage += cmdName +": "+ helpMessages[cmdName] + "\n"
    }
    return fullMessage
  }
}

const echo = (...args)=>{
  const hasPipeOperator = args.includes("|")
  if(hasPipeOperator === false){
    console.log(args.join(" "))
  }else{
    const indexOfPipeOp = args.indexOf("|")
    let echoMessage = args.slice(0, indexOfPipeOp).join(" ")
    const newCommand = args.slice(indexOfPipeOp+1)
    const [ cmd, ...newArgs ] = newCommand
    const path = newArgs[0]
    console.log(runFileSystemCommand(cmd, [path, echoMessage]))
  }
}

const clear = () =>{
  console.log('\033[2J');
  console.clear()
}

const date = () =>{
  return new Date()
}

const node = (args) =>{
  /** Execute the content of a js file within virtual FS */
  const vm = new NodeVM({
      require: {
          external: true,
          root: FileSystem.root().name
      }
  });
  vm.run(`
    function test(){
      console.log('This is a test')
    }
    test()
`, 'vm.js');
}

const edit = (filename) =>{
  const file = FileSystem.wd().getFile(filename)
  console.log(file.content)
  try{
    let options = {
        disableOpen: true,
        disableSaveAs: true
    }
    let term = new Termit(options);
    readline.pause()
    term.init(file.content)
    
  }catch(e){
    console.log(e)
    return false
  }
}


const FileSystem = new VirtualFileSystem('fs')
let commands = FileSystem.exposeCommands()

FileSystem.help = help
FileSystem.echo = echo
FileSystem.clear = clear
FileSystem.date = date
FileSystem.node = node
FileSystem.edit = edit


const helpMessages = {
  "help":"Displays this message",
  "clear":"Clears the console",
  "date":"Displays the current date",
  "ls":'Lists information about the FILEs. Usage: ls directory/',
  "rm":'Removes specified file, directory or link.',
  "cd":"Change the working directory of the current shell execution environment",
  "pwd":"Print the name of current working directory",
  "cat":"Concatenate FILE(s) to standard output.",
  "mkdir":"Create the DIRECTORY, if it does not already exist.",
  "touch":"Creates an empty file if it does not already exist.",
  "rmdir":"Remove the DIRECTORY, if it is empty."
}

let autoComplete = function completer(line) {
  const [ cmd, ...args ] = line.split(" ")
  const commandNames = Object.keys(commands)
  const cmdIsComplete = commandNames.includes(cmd)

  let completions = FileSystem.wd().getContentNames()
  if(cmdIsComplete){
    let parentDirname = ""
    let partial = args[0]
    //complete path
    if(line.includes("/") ){
      const argStr = args.join(" ")
      let subPath = argStr.split("/")
      partial = subPath[subPath.length - 1]
      parentDirname = subPath[subPath.length - 2]
      if(partial == ""){
        partial = subPath[subPath.length - 2]
        parentDirname = subPath[subPath.length - 3]
      }
      
      const parentDirectory = FileSystem.find(parentDirname)
      completions = parentDirectory.getContentNames()
    }
    
    let hits = []
    completions.map((path) => {
        if(path.startsWith(partial)){
          hits.push(path)
        }
    });
    
    if(hits.length == 1){
      parentDirname = (parentDirname ? parentDirname + "/" : "")
      hits[0] = `${cmd} ${parentDirname + hits[0]}`
    }
    
    return [hits.length <= 1 ? hits : completions, line];
  }else{
    completions = commandNames
    const hits = completions.filter((c) => c.startsWith(cmd));
    return [hits.length ? hits : completions, line];
  }

}


readline = ReadLine.createInterface({
  input: process.stdin,
  output: process.stdout,
  completer: autoComplete
})


const runFileSystemCommand = (cmd, args=[]) =>{
  try{
    const commandResult = FileSystem[cmd](...args)
    return commandResult
  }catch(e){
    console.log('ERROR:',e)
    return { error:e.message }
  }
}

const importBackup = () =>{
  const bckStr = fs.readFileSync("./public/data/backup.json").toString()
  const backup = JSON.parse(bckStr)
  FileSystem.import(backup)
}
let stopped = false
const run = () =>{
  if(!stopped){
    importBackup()
    readline.question("fs:>", (cmdString) => {
      input = cmdString.split(" ");
      const [ cmd, ...args ] = input
  
      if(FileSystem[cmd]){
        console.log(runFileSystemCommand(cmd, args));
      }else if(cmd == 'server'){
        runServer(FileSystem)
        readline.close()
        stopped = true;
      }else if(cmd == 'electron'){
        exec("npm run electron")
      }else{
        console.log(`ERROR: command ${cmd} unknown`);
      }
  
      run();
    })
  }
  
}

run()
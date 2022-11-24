const path = require('path');
const express = require('express')
const helmet = require('helmet')
const cors = require('cors');
const bodyParser = require('body-parser')
// const { spawn } = require('node:child_process')
const { createServer } = require("http");
const { Server } = require("socket.io");
// const VirtualFileSystem = require('./public/js/virtualfilesystem.js')

const runServer = (FileSystem) =>{
  
  const runCommand = async (commandString, socket) =>{
    try{
      let [ cmd, ...args ] = commandString.split(" ")
      if(!args) args = []
      const availableCommands = FileSystem.exposeCommands()
      if(availableCommands[cmd]){
        const result = await FileSystem[cmd](...args)
        return result
      }else{
        return `Command ${cmd} unavailable`
      }
    }catch(e){
      console.log(e)
      return e.message
    }
  }
  
  const runRealCommand = async (commandString) =>{
    try {
      const exec = require('util').promisify(require('child_process').exec);

      return await exec(commandString).catch(e => e);

    }catch (err){
      console.error(err);
    }
  }


  const app = express();
  const httpServer = createServer(app)
  const port = process.env.PORT || 8000;
  const ioPort = 5000
  app.use(express.static(__dirname + '/public'));
  app.use(cors())
  app.use(helmet.frameguard())
  app.use(bodyParser.json());       // to support JSON-encoded bodies
  app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
  })); 
  app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/public/index.html'));
  });
  const io = new Server(httpServer);
  io.on("connection", (socket)=>{
    socket.on("shell-command", async (commandString)=>{

      //Implement an arg parser
      const result = await runCommand(commandString)
      socket.emit('shell-result', result)

      
    })
  })
  
  httpServer.listen(port, ()=>{
    console.log('HTTP Server listening on '+port)
  });
    
}
module.exports = runServer 
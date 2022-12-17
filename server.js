const path = require('path');
const express = require('express')
const helmet = require('helmet')
const cors = require('cors');
const bodyParser = require('body-parser')
const { createServer } = require("http")
const { Server } = require("socket.io")

const runServer = (FileSystem) =>{
  
  const runCommand = async (cmd, args) =>{
    try{
      
      if(!args) args = []

      const availableCommands = FileSystem.exposeCommands()
      if(availableCommands[cmd]){
        const result = await FileSystem[cmd](...args)
        
        return result
      }else{
        return { error:`Command ${cmd} unavailable` }
      }

    }catch(e){
      console.log(e)
      return { error:e.message }
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
    res.sendFile(path.join(__dirname, '/index.html'));
  });

  const io = new Server(httpServer);
  io.on("connection", (socket)=>{
    socket.on("shell-command", async (cmd, args)=>{
      const result = await runCommand(cmd, args)
      if(result && result.error){
        socket.emit('shell-result', { error:result.error })
      }else{
        socket.emit('shell-result', { cmd:cmd, args:args, result:result })
      }
    })

  })
  
  httpServer.listen(port, ()=>{
    console.log('HTTP Server listening on '+port)
  });
    
}
module.exports = runServer 
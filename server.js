const path = require('path');
const express = require('express')
const {NodeSSH} = require('node-ssh')
const fs = require("fs");
const https = require("https");
const cors = require('cors');
const spawn = require('child_process').spawn;

const { Server } = require("socket.io");
let virtualCWD = 'C:\\Users\\sacha\\Desktop\\Dev Portfolio\\'//process.cwd().toString()

const run = (cmdStr, socket) =>{
  const { exec } = require('node:child_process');
  const [ cmd, ...args ] = cmdStr.split(" ")
  const isChangeDirectory = cmd === "cd"
  
  exec(cmdStr,{ cwd:virtualCWD, maxBuffer: 1024 ** 6 },(error, stdout, stderr) => {
    console.log('CWD',process.cwd())
    console.log('Virtual', virtualCWD)
    
    if (error) {
      console.error(error.toString())
      socket.emit("stdout", error.toString())
      return;
    }

    
    console.log(stdout.split("\n"))
    socket.emit("stdout", stdout)
    // socket.emit("stdout", JSON.stringify(stdout.split("\n"), null, 2))
    if(isChangeDirectory){
      virtualCWD = cmdStr.replace(cmd, '')
      console.log('Is change directory', virtualCWD)
      console.log('Args', args)
    }
  });
  // const [ cmd, ...args ] = cmdStr.split(" ")
  
  // const ls = spawn(cmd, args, { cwd:virtualCWD, env: process.env });

  // const isCD = cmd === "cd"

  // ls.stdout.on('data', function (data) {
  //   if(isCD){
  //     virtualCWD = args[0]
  //   }
  //   socket.emit("stdout", data.toString())
  // });

  // ls.stderr.on('data', function (data) {
  //   console.log('Is err')
  //   socket.emit("stdout", data.toString())
  // });

  // ls.on('exit', function (data) {
  //   // socket.emit("stdout", data.toString())
  // });
}

const app = express();
const port = process.env.PORT || 8000;

app.use(express.static(__dirname + '/public'));
app.use(cors())
// sendFile will go here
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

const server = https
  .createServer({
      key: fs.readFileSync("server.key"),
      cert: fs.readFileSync("server.cert"),
    },app)

const io = new Server(server);
io.on('connection', (socket) => {
  socket.on("stdin", (command)=>{
    run(command, socket)
  })
});


  
  server.listen(port);
  
console.log('Server started at https://localhost:' + port);
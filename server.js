const path = require('path');
const express = require('express')
const {NodeSSH} = require('node-ssh')
const fs = require("fs");
const https = require("https");
const cors = require('cors');
const spawn = require('child_process').spawn;

const { Server } = require("socket.io");

const run = (cmdStr, socket) =>{
  const { exec } = require('node:child_process');

  exec(cmdStr,{ cwd:process.cwd(), maxBuffer: 1024 ** 6 },(error, stdout, stderr) => {

    if (error) {
      console.error(error.toString())
      socket.emit("stdout", error.toString())
      return;
    }

    console.log(stdout.split("\n"))
    socket.emit("stdout", stdout)

  });
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
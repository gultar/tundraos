const path = require('path');
const express = require('express')
const {NodeSSH} = require('node-ssh')
const fs = require("fs");
const https = require("https");
const IO = require("socket.io")


const ssh = new NodeSSH()

const app = express();
const port = process.env.PORT || 8000;



app.use(express.static(__dirname + '/public'));
// sendFile will go here
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

const server = https
  .createServer(
    {
      key: fs.readFileSync("server.key"),
      cert: fs.readFileSync("server.cert"),
    },
    app
  )
  .listen(port);
console.log('Server started at https://localhost:' + port);
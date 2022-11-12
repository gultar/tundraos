const path = require('path');
const express = require('express')
const {NodeSSH} = require('node-ssh')
const IO = require("socket.io")


const ssh = new NodeSSH()

const app = express();
const port = process.env.PORT || 8080;

app.use(express.static(__dirname + '/public'));
// sendFile will go here
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.listen(port);
console.log('Server started at http://localhost:' + port);
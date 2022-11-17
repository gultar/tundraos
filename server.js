const path = require('path');
const express = require('express')
const fs = require("fs");
const https = require("https");
const helmet = require('helmet')
const cors = require('cors');
const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
const VirtualFileSystem = require('./src/filesystem/virtualfilesystem.js')
const {
  validateLogin,
  isValidPassword,
  createUser,
  createUserHandler,
  addUserToAccountFile,
  getAccountsFromFile,
  userExists,
  getUser,
  loadUserFileSystems,
  filesystems
} = require('./src/usershandler.js')

const { Server } = require("socket.io");

const parseCommandString = (cmdStr) =>{
  return cmdStr.split(" ")
}

const run = (cmdStr, socket) =>{
  try{
    const [ cmd, ...args ] = parseCommandString(cmdStr)
    console.log(cmd, ...args)
    const username = authenticatedSockets[socket.id].username
    
    const userFs = filesystems[username]
    const commandResult = userFs[cmd](...args)
    
    socket.emit("stdout", commandResult)
  }catch(e){
    console.log(e)
    socket.emit("stdout", e.message)
  }
}

const app = express();
const port = process.env.PORT || 8000;

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

app.post('/createUser', (req, res)=> createUserHandler(req, res));

const server = https
  .createServer({
      key: fs.readFileSync("server.key"),
      cert: fs.readFileSync("server.cert"),
    },app)

const io = new Server(server);
const authenticatedSockets = {}
io.on('connection', (socket) => {

  socket.on('login', async (loginStr)=>{
    const { username, password } = JSON.parse(loginStr)
    
    if(userExists(username)){
      const isAuthenticated = await validateLogin({
        username:username,
        password:password
      })
      if(isAuthenticated){
        authenticatedSockets[socket.id] = {
          username:username,
          authenticatedAt:Date.now()
        }
        console.log(`Socket id ${socket.id} authenticated`)
        socket.emit('login-result', `${username} is authenticated`)
      }else{
        socket.emit('login-result', `Login failed`)
      }
    }else{
      socket.emit('login-result', `User ${username} does not exist`)
    }
  })

  socket.on('stdin', (cmd)=>{
    if(authenticatedSockets[socket.id]){
      run(cmd, socket)
    }else{
      socket.emit('stdout', 'You need to login first')
    }
  })

});

loadUserFileSystems()

server.listen(port);
  
console.log('Server started at https://localhost:' + port);
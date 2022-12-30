const express = require('express')
const process = require('node:process')
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);
const cors = require('cors');
const bodyParser = require('body-parser')
const { createServer } = require("http")
const crypto = require('crypto')
const buildUserspace = require('./src/filesystem/build-userspace.js')
const hyperwatch = require("hyperwatch")

const log = (...text) =>{
  console.log("[server:>]", ...text)
}

const sha256 = (text) =>{
  return crypto
  .createHash('sha256')
  .update(text)
  .digest('hex');
}

const authorizedUsers = {
  root:{
    passwordHash : sha256("root"),
    tokenHash:""
  },
  guest:{
    passwordHash: sha256("guest"),
    tokenHash:""
  }
}

const createNewUser = (username, password) =>{
  if(authorizedUsers[username] !== undefined) return false
  
  authorizedUsers[username] = {
    passwordHash : sha256(password),
    tokenHash:""
  }

  return true
}

const isValidPassword = (username, password) =>{
  const user = authorizedUsers[username]
  const isValidPassword = sha256(password) === user.passwordHash
  return isValidPassword
}

let FileSystem = null

const runServer = (origin={ http:true, mountPoint:process.MOUNT_POINT || "system" }) =>{

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
      log(e)
      return { error:e.message }
    }
  }

  const execute = async (cmd, args, pointerId) =>{
    try{
      
      if(!args) args = []

      const availableCommands = FileSystem.exposeCommands()
      if(availableCommands[cmd]){
        const pointer = FileSystem.getPointer(pointerId)
        const result = await pointer[cmd](...args)
        
        return result
      }else{
        return { error:`Command ${cmd} unavailable` }
      }

    }catch(e){
      log(e)
      return { error:e.message }
    }
  }

  const expressApp = express();
  const httpServer = createServer(expressApp)
  const port = process.env.PORT || 8000;
  
  expressApp.get("/", (req, res)=>{
    const query = req.query
    const { token, username } = query
    if(!query.token){
      return res.redirect("/log")
    }else if(authorizedUsers[username].tokenHash !== token){
      log('Session token did not match')
      log('Stored', authorizedUsers[username].tokenHash)
      log('Sent', token)
      return res.redirect("/log")
    }else{
      
      if(FileSystem === null){
        FileSystem = buildUserspace(username)
        global.FileSystem = FileSystem
      }

      res.sendFile(__dirname + '/public/index.html')
      
    }

  })

  expressApp.use('/',express.static(__dirname + '/public'));
  expressApp.use("/log", express.static(__dirname + '/public/login'))
  
  expressApp.use(cors())
//   expressApp.use(bodyParser.json());       // to support JSON-encoded bodies
//   expressApp.use(bodyParser.urlencoded({     // to support URL-encoded bodies
//     extended: true
//   }));
  expressApp.use(express.json({limit: '50mb'}));
  expressApp.use(bodyParser.json({ limit: "200mb" }));
  expressApp.use(bodyParser.urlencoded({ limit: "200mb",  extended: true, parameterLimit: 1000000 }));

  expressApp.post("/login", (req, res)=>{
    const { username, password, timestamp } = req.body
    const loggedIn = login(username, password, timestamp)
    if(loggedIn.error) res.status(401).send({ error:loggedIn.error })
    else return res.status(200).send(loggedIn)
  })

  const login = (username, password, timestamp) =>{

    if(!authorizedUsers[username]){
      const newUser = createNewUser(username, password)
    }
    
    if(!isValidPassword(username, password)){
      return { 
        error:`Password of user ${username} is invalid`, 
        status:401 
      }
    }

    let code = `${username}${password}${timestamp}`

    let hexHash = sha256(code)

    authorizedUsers[username].tokenHash = hexHash
    
    global.activeUser = username
    return { 
      token:{
        hash:hexHash.toString("hex"),
        username:username,
        status:200,
      }
  }
    
  }

  expressApp.post("/rootcmd", async (req, res)=>{
    if(global.activeUser === "root"){
      try{
        const { command } = req.body
        
        if(command.substr(0, 3) == "cd "){
          const path = command.substr(3)
          process.chdir(path)
          return res.send({ result:process.cwd(), error:false })
        }else if(command.substr(0, 3) === 'node'){
          
          return res.send({ result:stdout, error:stderr })
        }else{
          const { stdout, stderr } = await exec(command);
          console.log('stdout:', stdout);
          console.error('stderr:', stderr);
          return res.send({ result:stdout, error:stderr })
        }
      }catch(e){
        log(e)
        return res.send({ error:e.message, result:false })
      }

    }else return res.send({ error:'UNAUTHORIZED: Only root user may run such commands', result:false })
  })

  expressApp.post("/changeUser", (req, res)=>{
    const { username } = req.body
    FileSystem = null;
    if(FileSystem === null){
      FileSystem = buildUserspace(username) 
      global.FileSystem = FileSystem
    }
  })

  expressApp.post("/logout", (req, res)=>{
    const { username } = req.body
    FileSystem = null;
    
    authorizedUsers[username].token = ""
    global.activeUser = ""
    log(`Logged out of user ${username}'s session`)
    log(FileSystem)
  })

  expressApp.post('/command', async(req, res)=> {
    const { cmd, args } = req.body
    const result = await runCommand(cmd, args)
    if(result.error) res.json({ error:result.error })
    else res.json({ result:result })
  });

  expressApp.post('/execute', async(req, res)=> {
    const { cmd, args, pointerId } = req.body
    const result = await execute(cmd, args, pointerId)
    if(result.error) res.json({ error:result.error })
    else res.json({ result:result })
  });

  expressApp.get("/makepointer", (req, res)=>{
    const { id } = FileSystem.createPointer()
    res.send({ pointerId:id })
  })

  expressApp.get("/origin", (req, res)=>{
    res.send(origin)
  })
  
  httpServer.listen(port, ()=>{
    log('HTTP Server listening on '+port)
  })
  
  const config = hyperwatch(httpServer)

    
}
module.exports = runServer 
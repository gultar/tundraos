const express = require('express')
const process = require('node:process')
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);
const cors = require('cors');
const bodyParser = require('body-parser')
const { createServer } = require("http")
const crypto = require('crypto')
const buildUserspace = require('./src/filesystem/build-userspace.js')

const log = (...text) =>{
  console.log("[SERVER:>]", ...text)
}

const sha256 = (text) =>{
  return crypto
  .createHash('sha256')
  .update(text)
  .digest('hex');
}

const authorizedUsers = {
  kerac:{
    passwordHash:sha256("awd"),
    tokenHash:"",
  },
  root:{
    passwordHash : sha256("root"),
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

const runServer = (FileSystem=null, origin={ http:true }) =>{

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
      
      if(FileSystem === null) FileSystem = buildUserspace(username)
      
      res.sendFile(__dirname + '/public/index.html')
      
    }

  })

  expressApp.use('/',express.static(__dirname + '/public'));
  expressApp.use("/log", express.static(__dirname + '/public/login'))
  
  expressApp.use(cors())
  expressApp.use(bodyParser.json());       // to support JSON-encoded bodies
  expressApp.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
  }));

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
    
    process.env.activeUser = username
    return { 
      token:{
        hash:hexHash.toString("hex"),
        username:username,
        status:200,
      }
  }
    
  }

  expressApp.post("/rootcmd", async (req, res)=>{
    if(process.env.activeUser === "root"){
      try{
        const { command } = req.body
        console.log('command.substr(0, 3) == "cd "', command.substr(0, 3) == "cd ")
        if(command.substr(0, 3) == "cd "){
          const path = command.substr(3)
          process.chdir(path)
          return res.send({ result:process.cwd(), error:false })
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
    if(FileSystem === null) FileSystem = buildUserspace(username)
  })

  expressApp.post("/logout", (req, res)=>{
    const { username } = req.body
    FileSystem = null;
    
    authorizedUsers[username].token = ""
    process.env.activeUser = ""
    log(`Logged out of user ${username}'s session`)
    log(FileSystem)
  })

  expressApp.post('/command', async(req, res)=> {
    const { cmd, args } = req.body
    const result = await runCommand(cmd, args)
    if(result.error) res.json({ error:result.error })
    else res.json({ result:result })
  });

  expressApp.get("/origin", async(req, res)=>{
    res.send(origin)
  })
  
  httpServer.listen(port, ()=>{
    log('HTTP Server listening on '+port)
  });
    
}
module.exports = runServer 
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
const wifiTools = require("./src/wifi/network-tools")

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

const runServer = (config={ http:true, mountPoint:process.MOUNT_POINT }) =>{
  if(!config.mountPoint) throw new Error('Need to provide filesystem mount point value')

  const execute = async (cmd, args, pointerId) =>{
    try{
      
      if(!args) args = []

      const availableCommands = FileSystem.exposeCommands()
      if(availableCommands[cmd]){
        const pointer = FileSystem.getPointer(pointerId)
        const result = await pointer[cmd](...args)
        pointer.lastUsed = Date.now()
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
  
  expressApp.get("/", async (req, res)=>{
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
        FileSystem = await buildUserspace(username)
        global.FileSystem = FileSystem
      }

      res.sendFile(__dirname + '/public/index.html')
      
    }

  })

  expressApp.use('/',express.static(__dirname + '/public'));
  expressApp.use("/log", express.static(__dirname + '/public/login'))
  
  expressApp.use(cors())
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

  expressApp.post("/changeUser", async (req, res)=>{
    const { username } = req.body
    FileSystem = null;
    if(FileSystem === null){
      FileSystem = await buildUserspace(username) 
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

  expressApp.post('/execute', async(req, res)=> {
    const { cmd, args, pointerId } = req.body
    const result = await execute(cmd, args, pointerId)
    if(result.error) res.json({ error:result.error })
    else res.json({ result:result })
  });

  expressApp.post("/wifi", async(req, res)=>{
      
    const { wifiCmd, ssid, password, iface } = req.body
    
    if(!wifiTools[wifiCmd]) return res.send({ error:`Ẁifi Command ${wifiCmd} not found` })
    else{
      try{
        console.log(wifiTools)
        const result = await wifiTools[wifiCmd]({ ssid:ssid, password:password, iface:iface })
        console.log('RESULT OF WIFI', result)
        return res.send(result) 
      }catch(e){
        return res.send({ error:e })
      }
    }
  })

  expressApp.post("/makepointer", (req, res)=>{
    const { instanceId } = req.body
    const { id } = FileSystem.createPointer(instanceId)
    res.send({ pointerId:id })
  })
  
  expressApp.post("/destroypointer", (req, res)=>{
    const { id } = req.body
    if(!id) return res.send({ error:"Server: Need to provide Id of directory pointer to destroy" })
    else if(id) FileSystem.deletePointer(id)
    console.log("Active Pointers", Object.keys(FileSystem.pointerPool))

    res.send({ result:`Pointer ${id} deleted successfully` })
  })

  expressApp.post("/destroyallpointers", (req, res)=>{
    const { all } = req.body
    if(all) {
      FileSystem.deleteAllPointers()
      console.log("Active Pointers", Object.keys(FileSystem.pointerPool))
      return res.send({ result:`All pointer deleted successfully` })
    }else{
      return res.send({ error:"No pointers were destroyed" })
    }
  })

  expressApp.get("/config", (req, res)=>{
    res.send(config)
  })
  
  httpServer.listen(port, ()=>{
    log('HTTP Server listening on '+port)
  })
  
  const configuration = hyperwatch(httpServer)

    
}
module.exports = runServer 
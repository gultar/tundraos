const path = require('path');
const express = require('express')
const session = require('express-session')
const helmet = require('helmet')
const cors = require('cors');
const bodyParser = require('body-parser')
const { createServer } = require("http")
const crypto = require('crypto')

const sha256 = (text) =>{
  return crypto
  .createHash('sha256')
  .update(text)
  .digest('hex');
}

const authorizedUsers = {
  kerac:{
    password:sha256("awd"),
    token:"",
  },
  root:{

  }
}

const runServer = (FileSystem, origin={ http:true }) =>{
  
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


  const expressApp = express();
  const httpServer = createServer(expressApp)
  const port = process.env.PORT || 8000;
  let pagePath = __dirname + '/public/login'
  // expressApp.use(express.static(__dirname + '/public'));
  // expressApp.use("/", (req, res, next)=>{
  //   const query = req.query
  //   if(query.token){
  //     res.redirect("/log")
  //   }
  //   next()
  // })

  
  expressApp.use(express.static(__dirname + '/public'));
  expressApp.use(cors())
  // expressApp.use(helmet.frameguard())
  expressApp.use(bodyParser.json());       // to support JSON-encoded bodies
  expressApp.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
  }));

  


  expressApp.post("/login", (req, res)=>{
    const { username, password, timestamp } = req.body

    if(!authorizedUsers[username]) 
      res.send({ error:'Unknown user '+username, status:401 }).end()
    
    if(sha256(password) !== authorizedUsers[username].password)
      res.send({ 
        error:`Password of user ${username} is invalid`, 
        status:401 
      }).end()

    let code = `${username}${password}${timestamp}`

    let hexHash = sha256(code)

    authorizedUsers[username].token = hexHash
    res.status(200).json({ 
        token:{
          hash:hexHash.toString("hex"),
          username:username,
          status:200,
        }
    })
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
    console.log('HTTP Server listening on '+port)
  });
    
}
module.exports = runServer 
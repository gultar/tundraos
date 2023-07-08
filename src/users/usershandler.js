const fs = require("fs").promises;
const bcrypt = require('bcrypt')
const crypto = require('crypto')

const log = (...text) =>{
    console.log("[auth:>]", ...text)
}
  

const sha256 = (text) =>{
    return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex');
}

let accountFilePath = "./src/users/accounts.json"

const isExistingUser = (username) =>{
    return (accounts[username]? true :  false)
}
  
let accounts = {
    root:{
      passwordHash : sha256("root"),
      tokenHash:""
    },
    guest:{
      passwordHash: sha256("guest"),
      tokenHash:""
    }
}

const makeSessionTokenHash = (username, password, timestamp) =>{
    let code = `${username}${password}${timestamp}`

    let hexHash = sha256(code)

    accounts[username].tokenHash = hexHash.toString("hex")

    return {
        hash:hexHash.toString("hex"),
        username:username,
        status:200,
    }
}

const getTokenHash = (username) =>{
    if(!accounts[username]) return false
    
    return accounts[username].tokenHash
}

const getUserEntry = (username) =>{
    return accounts[username]
}

const isValidTokenHash = (username, token) =>{
    const user = getUserEntry(username)
    console.log('User entry', user)
    if(!user){
        log(`User ${username} doesn't exist`)
        return false
    }else{
        return user.tokenHash === token
    }
    
}

const validateLogin = async ({ username, password }) =>{

    try{
      const user = getUser(username)
      if(user == undefined){
        return false
      }
  
      const { hash } = user
      const isValid = await isValidPassword(password, hash)
      return isValid
    }catch(e){
      console.log(e)
      return false
    }
  
}
  
const isValidPassword = async (username, password) => {
    try{
        const user = getUserEntry(username)
        const hash = user.hash
        const isEqual = await bcrypt.compare(password, hash)
        return isEqual
    }catch(e){
      console.log(e)
      return false
    }
}
  
const createUser = async ({ username, password, timestamp }) =>{
    try{
      if(userExists(username) == true) return "User already exists"
      
      const rounds = 10
      const hash = await bcrypt.hash(password, rounds)

      const user = {
        username:username,
        hash:hash,
        timestamp:timestamp,
        tokenHash:""
      }
      addUserToAccountFile(user)

      accounts[username] = user
      return user
    }catch(e){
      throw e
    }
}
  
const createUserHandler = async (req, res) =>{
    try{
        const { username, password, timestamp } = req.body
        res.end(await createUser({ username, password, timestamp }))
    }catch(e){
        console.log(e)
        res.end(e.message)
    }
}

const loadAccounts = async () =>{
    const accountsFromFile = await getAccountsFromFile()
    const hasContent = Object.keys(accountsFromFile).length > 0
    if(hasContent){
        accounts = accountsFromFile
    }else{
        accounts = await createAccountFile()
    }
}

const addUserToAccountFile = async ({ username, hash, timestamp, rounds}) =>{
    try{
        const exists = await fs.readFile(accountFilePath)
        if(!exists){
            await createAccountFile()
        }
    }catch(e){
        console.log(e)
        throw e
    }
    
    accounts = await getAccountsFromFile()
    
    if(accounts[username] !== undefined) throw new Error(`User ${username} already exists`)
    
    accounts[username] = {
      hash:hash,
      created:timestamp,
      rounds:rounds,
      tokenHash:""
    }
  
    const written = await fs.writeFile(accountFilePath,JSON.stringify(accounts))
    return written
}

const createAccount = async ({ username, password, timestamp }) =>{
    const rounds = 10
    const hash = await bcrypt.hash(password, rounds)
    const user = {
        username:username,
        hash:hash,
        timestamp:timestamp,
        tokenHash:""
    }
    accounts[username] = user
    return user
}

const createAccountFile = async () =>{
    
    const accounts = {
        root:await createAccount({ username:'root', password:'root', timestamp:Date.now() }),
        guest:await createAccount({ username:'guest', password:'guest', timestamp:Date.now() })
    }
  
    const written = await fs.writeFile(accountFilePath,JSON.stringify(accounts))
    return accounts
    
}
  
const getAccountsFromFile = async () =>{
    try{
        const accountsFileBuffer = await fs.readFile(accountFilePath)
        const accountsFileString = accountsFileBuffer.toString()
        const accounts = JSON.parse(accountsFileString)
        return accounts
    }catch(e){
        console.log(e)
        return false
    }
}
  
const userExists = (username) =>{
    const accounts = getAccountsFromFile()
    return (accounts[username] ? true : false)
}
  
const getUser = (username) =>{
    const accounts = getAccountsFromFile()
    console.log(accounts)
    return accounts[username]
}


module.exports = {
    validateLogin,
    isValidPassword,
    createUser,
    createUserHandler,
    addUserToAccountFile,
    getAccountsFromFile,
    userExists,
    getUser,
    accounts,
    sha256,
    isValidTokenHash,
    getTokenHash,
    makeSessionTokenHash,
    loadAccounts
} 
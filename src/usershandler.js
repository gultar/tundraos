const fs = require("fs");
const bcrypt = require('bcrypt')

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
  
  const isValidPassword = async (password, hash) => {
    try{
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
      addUserToAccountFile({
        username:username,
        hash:hash,
        timestamp:timestamp,
      })
      return `User ${username} created`
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

const addUserToAccountFile = ({ username, hash, timestamp, rounds}) =>{
    const accounts = getAccountsFromFile()
    
    accounts[username] = {
      hash:hash,
      created:timestamp,
      rounds:rounds
    }
  
    filesystems[username] = new VirtualFileSystem(username)
  
    const written = fs.writeFileSync("./accounts.json",JSON.stringify(accounts))
    return written
}
  
const getAccountsFromFile = () =>{
    const accountsFileString = fs.readFileSync("./accounts.json").toString()
    const accounts = JSON.parse(accountsFileString)
    return accounts
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
} 
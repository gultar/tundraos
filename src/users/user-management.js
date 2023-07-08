let accountFilePath = "./users/accounts.json"

const sha256 = (text) =>{
    return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex');
}

const isExistingUser = (username) =>{
    return (authorizedUsers[username]? true :  false)
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
  
const isPasswordValid = (username, password) =>{
    const user = authorizedUsers[username]
    const isValidPassword = sha256(password) === user.passwordHash
    return isValidPassword
}

module.exports = { isPasswordValid, createNewUser, sha256, authorizedUsers, isExistingUser }
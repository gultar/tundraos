const runServer = require('./server.js')
const buildUserspace = require('./src/filesystem/build-userspace.js')

const selectUser = () =>{
    const args = process.argv
    let positionUsername = -1
    for(const arg of args){
        if(arg === "--user" || arg === "-u"){
            positionUsername = args.indexOf(arg)
        }
    }
    
    if(positionUsername > -1) return args[positionUsername + 1]
    else return 'guest'
}

let username = selectUser()

let FileSystem = buildUserspace(username)
runServer(FileSystem)
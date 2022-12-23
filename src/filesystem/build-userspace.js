const VirtualFileSystem = require('../../public/js/filesystem/virtualfilesystem.js')
const { buildFileSystemRepresentation, getBuildStats } = require('./dir-build.js')
const Persistance = require('./persistance.js')
const fs = require('fs')

let FileSystem = {}

const buildUserspace = (username='root') =>{

    const log = (...text) =>{
        console.log(`[${username}:>]`, ...text)
    }

    class Userspace{
        constructor(userspacePath){
            this.userspacePath = userspacePath
            this.structure = {
                home:{
                    desktop:{},
                    documents:{},
                    downloads:{},
                    applications:{},
                    images:{}
                },
                sys:{
                    settings:{}
                }
            }
    
            this.build()
        }
    
        build(dirlevel=this.structure, path=this.userspacePath){
            const dirnames = Object.keys(dirlevel).filter(name => name != '..')
            for(const dirname of dirnames){
                const dirpath = `${path}/${dirname}`
                if(!fs.existsSync(dirpath)){
                    try{
                        fs.mkdirSync(dirpath)
                        this.build(dirlevel[dirname], dirpath)
                    }catch(e){
                        console.log(e)
                        throw e
                    }
                }
            }
    
            return true
        }
    }
    
    let userspacePath = `./public/userspaces/${username}`

    if(!fs.existsSync("./public/userspaces")){
        try{
            fs.mkdirSync("./public/userspaces")
        }catch(e){
            console.log(e)
            throw e
        }
    }
    
    if(!fs.existsSync(userspacePath)){
        try{
            fs.mkdirSync(userspacePath)
    
            const userspace = new Userspace(userspacePath)
    
        }catch(e){
            console.log(e)
            throw e
        }
    }
    
    if(username == 'root'){
        userspacePath = "."//'./public'
    }
    
    log("Standy as I attempt to load the file system")
    
    let userDir = buildFileSystemRepresentation(userspacePath)
    
    
    
    let persistance = new Persistance(username)
    
    FileSystem = new VirtualFileSystem(username, persistance, userspacePath)
    
    FileSystem.import({ system:userDir })
    
    log('File system loaded successfully')
    log(getBuildStats())

    return FileSystem
}

module.exports = buildUserspace
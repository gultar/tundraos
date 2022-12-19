const VirtualFileSystem = require('../../public/js/classes/virtualfilesystem.js')
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
        userspacePath = './public'
    }
    
    let userDir = buildFileSystemRepresentation(userspacePath)
    log(getBuildStats())
    let persistance = new Persistance(username)
    
    FileSystem = new VirtualFileSystem(username, persistance)
    
    FileSystem.import({ system:userDir })

    return FileSystem
}

module.exports = buildUserspace
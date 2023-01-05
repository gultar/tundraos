const VirtualFileSystem = require('../../public/js/filesystem/virtualfilesystem.js')
const buildWorker = require('./build-controller.js')
const Persistance = require('./persistance.js')
const fs = require('fs')

let FileSystem = {}
let persistance = {}

class Userspace{
    constructor(username){
        this.username = username
        this.userspacePath=`./public/userspaces/${username}`
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

process.MOUNT_POINT = "."

const buildUserspace = async (username='root', rootPath="/") =>{
    let mountPoint = process.MOUNT_POINT || "system"

    const log = (...text) =>{
        console.log(`[${username}:>]`, ...text)
    }


    
    let userspacePath = "."

    if(process.fullOs){
        userspacePath = "/"
    }
    

    if(!fs.existsSync("./public/userspaces")){
        try{
            fs.mkdirSync("./public/userspaces")
        }catch(e){
            console.log(e)
            throw e
        }
    }
    
    if(!fs.existsSync(`./public/userspaces/${username}`)){
        try{
            fs.mkdirSync(`./public/userspaces/${username}`)
    
            const userspace = new Userspace(username)
    
        }catch(e){
            console.log(e)
            throw e
        }
    }

    log("Standy as I attempt to load the file system")
    
    persistance = new Persistance(username, rootPath, userspacePath)
    let directories = {}

    let sharedspace = await buildWorker("./public/sharedspace")
    
    let filesystemStructure = {}
    if(!process.fullOs) {
        directories = await buildWorker(".")
        if(username === "root"){
            filesystemStructure = { 
                ...directories,
            }
            
        }else{
            filesystemStructure = { 
                public:{
                    userspaces:{
                        [username]:{
                            ...directories.public.userspaces[username]
                        },
                    },
                    sharedspace:{
                        ...sharedspace,
                    },
                }
            }
        }
    }else{
        directories = global.linuxFs
        filesystemStructure = {
            ...directories
        }
    }

    FileSystem = new VirtualFileSystem(username, persistance, userspacePath)    
    FileSystem.import(filesystemStructure)

    if(username === 'root' && !process.fullOs) 
        FileSystem.root().contents = directories.contents
    
    log('File system loaded successfully')

    return FileSystem
}

module.exports = buildUserspace
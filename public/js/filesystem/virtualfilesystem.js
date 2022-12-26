const { stringify } = require('./utils')
const parenter = require('./proxy')
const File = require('./file')
const DirectoryPointer = require('./directory-pointer')

class VirtualFileSystem{
    constructor(username, persistance=persistanceInterface, basePath="."){
        //All objects will be treated like potential directories
        this.username = username
        this.filesystem = new Proxy({}, parenter)
        this.filesystem["/"] = (!persistance.isInterface ? {} : {
            home:{
                desktop:{},
                documents:{},
                downloads:{},
                applications:{},
                images:{}
            },
            sys:{
                settings:{}
            },
        })
        this.workingDir = this.filesystem["/"] 
        this.persistance = persistance
        this.basePath = basePath
        this.pointerPool = {}
        this.mainPointer = new DirectoryPointer(this.filesystem["/"], this.persistance)
        this.initMainPointer()
    }

    exposeCommands(){
        return this.mainPointer.exposeExternalCommands()
    }

    initMainPointer(){
        //Associate all pointer methods for ease of navigation with filesystem's main pointre
        const commands = this.mainPointer.exposeExternalCommands()
        for(const command in commands){
            
            this[command] = async (...args) =>{ 
                return await this.mainPointer[command](...args) 
            }
  
        }

        const internalCommands = this.mainPointer.exposeInternalCommands()
        for(const command in internalCommands){
            this[command] = async (...args) =>{ 
                return await this.mainPointer[command](...args) 
            }
        }
    }

    isDir(destination){
        if(destination === undefined) return false
        const canContainFiles = destination.contents !== undefined
        
        return canContainFiles
    }

    isRootDir(directory){
        if(directory == undefined) throw new Error("Directory provided is undefined")
        return directory.name == "/"
    }

    root(){
        return this.filesystem["/"]
    }

    createPointer(){
        const id = Date.now()
        this.pointerPool[id] = new DirectoryPointer(this.root(), this.persistance)

        this.pointerPool[id].id = id
        return this.pointerPool[id]
    }

    getPointer(id){
        if(!id) return this.createPointer()
        else return this.pointerPool[id]
    }

    deletePointer(id){
        delete this.pointerPool[id]
    }

    setDirectoryContent(directory, structureEntry){
        for(const prop in structureEntry){
            if(!Array.isArray(structureEntry[prop]) && typeof structureEntry[prop] == "object"){
                directory[prop] = structureEntry[prop]
                this.setDirectoryContent(directory[prop], structureEntry[prop])
            }
        }
        return true
    }

    import(structure){
        return this.setDirectoryContent(this.root(), structure)
    }

    export(startingDirectory=this.root()){
        const clean = stringify(startingDirectory, null, null, ()=>undefined)
        return clean
    }

}

module.exports = VirtualFileSystem



const { stringify } = require('./utils')
const parenter = require('./proxy')
const File = require('./file')
const Directory = require('./directory')
const DirectoryPointer = require('./directory-pointer')

class VirtualFileSystem{
    constructor(username, persistance=persistanceInterface, basePath="."){
        
        this.username = username
        this.filesystem = {}
        this.filesystem["/"] = new Directory("/", this.filesystem["/"])
        
        if(persistance.isInterface){
            this.filesystem["/"].home = new Directory("home", this.filesystem["/"])
            this.filesystem["/"].sys = new Directory("sys", this.filesystem["/"])
            
            this.home = this.filesystem["/"].home
            this.sys = this.filesystem["/"].sys
    
            
            this.home.desktop = new Directory("desktop", this.home)
            this.home.documents = new Directory("documents", this.home)
            this.home.downloads = new Directory("downloads", this.home)
            this.home.applications = new Directory("applications", this.home)
            this.home.images = new Directory("images", this.home)
            this.sys.settings = new Directory("settings", this.sys)
        }

        this.workingDir = this.filesystem["/"] 
        this.persistance = persistance
        this.basePath = basePath
        this.pointerPool = {}
        
        this.mainPointer = new DirectoryPointer(this.filesystem["/"], this.persistance)
        this.initMainPointer()
    }

    wd(){
        return this.mainPointer.workingDir
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

    createPointer(id){
        if(!id) id = Date.now()
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

    deleteAllPointers(){
        this.pointerPool = {}
    }

    startPointerCleaningRoutine(){
        setInterval(()=>{
            for(const id in this.pointerPool){
                const pointer = this.pointerPool[id]

                if(pointer.lastUsed + (60 * 1000) < Date.now()){
                    delete this.pointerPool[id]
                }
            }
        }, 10*1000)
    }

    setDirectoryContent(directory, structureEntry){
        for(const prop in structureEntry){
            if(!Array.isArray(structureEntry[prop]) && typeof structureEntry[prop] == "object"){
                directory[prop] = new Directory(prop, directory, structureEntry[prop].contents)
                this.setDirectoryContent(directory[prop], structureEntry[prop])
            }
            
        }
        return true
    }

    fromPathToArray(path){
        let arrayOfDirectories = path.split("/")
        arrayOfDirectories = arrayOfDirectories.filter(cell => cell != "")
        return arrayOfDirectories
    }

    fromArrayToPath(arrayOfDirectories){
        const path = this.convertToPathString(arrayOfDirectories)
        return path
    }

    convertToPathString(directoriesArray){
        return Array.isArray(directoriesArray) ? directoriesArray.join("/") : ""
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



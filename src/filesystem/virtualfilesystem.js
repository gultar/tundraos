String.prototype.unshift = function(el) {
    let arr = [this];
    arr.unshift(el);
    return arr.join("");
}

let parenter = {
    set: function(target, prop, value){
      if(typeof value === "object"){
        let p = new Proxy(new Directory(prop, target), parenter);

        for(key in value){
          p[key] = value[key];
        }
        target[prop] = p
        return target[prop]
      }else{
        target[prop] = value;
      }
    },
}

class Directory{
    
    constructor(name, parent){
        this[".."] = parent
        this.name = name
        this.files = {}
        this.isDirectory = true
        this.permissions = "" //to be implemented
    }

    getDirectoryProperties(){
        return ["name","files","permissions","isDirectory"]
    }

    parent(){
        return this[".."]
    }

    hasDir(dirname){
        const dirnames = this.getDirnames()
        return dirnames.includes(dirname)
    }

    hasFile(filename){
        return (this.files[filename] ? true : false)
    }

    getDirnames(){
        const props = Object.keys(this)
        const thisDirectoryProperties = this.getDirectoryProperties()
        const dirnames = props.filter(prop =>{
            const isObject = typeof this[prop] == 'object'
            const isDirectoryProp = thisDirectoryProperties.includes(prop)
            if(isDirectoryProp == false && isObject == true){
                return prop
            }
                
        })
        return dirnames
    }

    getContentNames(){
        const filenames = this.getFilenames()
        const dirnames = this.getDirnames().map(dirname => {
            if(dirname !== "..")
                return dirname + "/"
            else
                return dirname
        })
        return [ ...dirnames, ...filenames ]
    }

    getDirectory(dirname){
        const isExistingDirectory = this.hasDir(dirname)
        if(isExistingDirectory) return this[dirname]
        else return undefined
    }

    getFile(filename){
        return this.files[filename]
    }

    get(name){
        const isDirectory = this.hasDir(name)
        if(isDirectory) return this[name]

        const isFile = this.hasFile(name)
        if(isFile) return this.files[name]

        return undefined
    }

    getFilenames(){
        return Object.keys(this.files)
    }

    getFiles(){
        return this.files
    } 

}

class File{
    constructor(name=""){
        this.name = name
        this.content = ""
    }

    setContent(content){
        this.content = content
    }

    getContent(){
        return this.content
    }
}

class VirtualFileSystem{
    constructor(username){
        //All objects will be treated like potential directories
        this.username = username
        this.filesystem = new Proxy({}, parenter)
        this.filesystem["/"] = {
            home:{},
            [username]:{}
        }
        this.workingDir = this.filesystem["/"] //this.root.home
        
    }

    isDir(destination){
        if(destination === undefined) return false
        const canContainFiles = destination !== undefined
        
        return canContainFiles
    }

    isRootDir(directory){
        if(directory == undefined) throw new Error("Directory provided is undefined")
        return directory.name == "/"
    }

    root(){
        return this.filesystem["/"]
    }

    wd(){
        return this.workingDir
    }

    hasDir(destination){
        const isDirectory = this.isDir(destination)
        const hasDirectory = this.workingDir[destination] !== undefined
        if(hasDirectory && isDirectory) return true
        else return false
    }

    hasChild(parentDir, childDirName){
        return (parentDir[childDirName] ? true : false)
    }

    splitPathIntoArray(path){
        const directories = path.split("/")
        return directories
    }

    fromPathToArray(path){
        const arrayOfDirectories = this.splitPathIntoArray(path)
        return arrayOfDirectories
    }

    fromArrayToPath(arrayOfDirectories){
        const path = this.convertToPathString(arrayOfDirectories)
        return path
    }

    find(path){
        const isPathRoot = path === "/"
        if(isPathRoot) return this.root()

        let workingDir = this.workingDir
        if(path === workingDir.name){
            console.log('Path', path)
            console.log('Working dir', workingDir.name)
        }

        const isDirectChild = workingDir[path]
        if(isDirectChild) return workingDir[path]

        const directories = this.fromPathToArray(path)

        for(const dir of directories){
            if(dir !== ""){

                const exists = workingDir[dir]
                const isDirectory = this.isDir(workingDir[dir])

                if(exists){
                    if(isDirectory){
                        workingDir = workingDir[dir]
                    }
                }else{
                    throw new Error(`Directory ${dir} could not be found`)
                }
            }
        }
        
        return workingDir
    }

    *preOrderTraversal(node = this.root) {
        yield node;
        if (node.children.length) {
            for (let child of node.children) {
            yield* this.preOrderTraversal(child);
            }
        }
    }

    search(itemName){

    }

    walkBackToRootDir(currentDir, pathToRoot=[]){
        const isCurrentDirRoot = this.isRootDir(currentDir)
        if(isCurrentDirRoot) return pathToRoot["/"]

        const parentIsRoot = this.isRootDir(currentDir.parent())
        if(parentIsRoot){
            pathToRoot.unshift(currentDir.name)
            return pathToRoot
        }else{
            pathToRoot.unshift(currentDir.name)
            return this.walkBackToRootDir(currentDir.parent(), pathToRoot)
        }
    }

    getAbsolutePath(currentDir){
        const directoriesArray =  this.walkBackToRootDir(currentDir)
        return this.fromArrayToPath(directoriesArray)
    }

    cd(path){
        try{
            const newWorkingDirectory = this.find(path)
            if(this.isDir(newWorkingDirectory)){
                this.workingDir = newWorkingDirectory
            }
            
            return this.workingDir.name
        }catch(e){
            console.log(e)
            return e.message
        }
    }

    ls(path, args){
        let directory = {}
        if(path == undefined){
            directory = this.workingDir
        }else{
            directory = this.find(path)
            const isDirectory = this.isDir(directory)
            if(!isDirectory) throw new Error(`Command ls failed. ${path} is not a directory`)
        }
        
        const contents = directory.getContentNames()

        return contents
    }

    pwd(){
        let path = this.getAbsolutePath(this.workingDir)
        path = path.unshift("/")
        return path
    }

    mkdir(path){
        if(path === undefined) throw new Error('touch: missing file operand')
        
        const pathArray = this.fromPathToArray(path)
        const dirname = pathArray[pathArray.length - 1]
        const isWithinThisDir = pathArray.length == 1

        if(isWithinThisDir){
            this.workingDir[dirname] = {}

        }else{
            pathArray.pop()
            const pathToFile = this.fromArrayToPath(pathArray) 
            const targetDirectory = this.find(pathToFile)
            targetDirectory[dirname] = {}

        }

        return true
    }

    touch(path){
        if(path === undefined) throw new Error('touch: missing file operand')
        const pathArray = this.fromPathToArray(path)
        const filename = pathArray[pathArray.length - 1]
        const directory = this.findDir(path)
        directory.files[filename] = new File(filename)

        return true
    }

    findDir(path){
        const pathArray = this.fromPathToArray(path)
        const isWithinThisDir = pathArray.length == 1
        let directory;

        if(isWithinThisDir)
            directory = this.workingDir
        else{
            pathArray.pop()
            const pathToFile = this.fromArrayToPath(pathArray) 
            directory = this.find(pathToFile)
        }

        return directory
    }

    cat(path){
        if(path === undefined) throw new Error('cat: missing file operand')
        const pathArray = this.fromPathToArray(path)
        const filename = pathArray[pathArray.length - 1]
        const directory = this.findDir(path)
        const file = directory.files[filename]
        if(!file) return undefined
        
        return file.content
    }

    rmdir(path, args){
        if(path === undefined) throw new Error('rmdir: missing file operand')
        const pathArray = this.fromPathToArray(path)
        const dirname = pathArray[pathArray.length - 1]
        const isWithinThisDir = pathArray.length == 1
        if(isWithinThisDir){
            delete this.workingDir[dirname]

        }else{
            pathArray.pop()
            const pathToFile = this.fromArrayToPath(pathArray) 
            const targetDirectory = this.find(pathToFile)
            delete targetDirectory[dirname]
        }

        return true
    }

    rm(path, args){
        if(path === undefined) throw new Error('rmdir: missing file operand')
        const pathArray = this.fromPathToArray(path)
        const filename = pathArray[pathArray.length - 1]
        const isWithinThisDir = pathArray.length == 1
        if(isWithinThisDir){
            const isElementToDeleteDirectory = this.workingDir.hasDir(path)
            if(isElementToDeleteDirectory == true){
                throw new Error(`rm: cannot remove '${path}': Is a directory`)
            }

            delete this.workingDir.files[filename]

        }else{
            pathArray.pop()
            const pathToFile = this.fromArrayToPath(pathArray) 
            const targetDirectory = this.find(pathToFile)
            const isElementToDeleteDirectory = targetDirectory.hasDir(pathToFile)
            if(isElementToDeleteDirectory == true){
                throw new Error(`rm: cannot remove '${path}': Is a directory`)
            }
            delete targetDirectory.files[filename]
        }

        return true
    }

    convertToPathString(directoriesArray){
        return Array.isArray(directoriesArray) ? directoriesArray.join("/") : ""
    }

}

module.exports = VirtualFileSystem



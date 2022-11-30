String.prototype.unshift = function(el) {
    let arr = [this];
    arr.unshift(el);
    return arr.join("");
}

function cleanUpEmptyArrayCells(array){
    return array.filter(el => {
        return el != null && el != '';
    });
}

function stringify(obj, replacer, spaces, cycleReplacer) {
    return JSON.stringify(obj, serializer(replacer, cycleReplacer), spaces)
  }
  
  function serializer(replacer, cycleReplacer) {
    var stack = [], keys = []
  
    if (cycleReplacer == null) cycleReplacer = function(key, value) {
      if (stack[0] === value) return "[Circular ~]"
      return "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
    }
  
    return function(key, value) {
      if(key === '..') return
      if (stack.length > 0) {
        var thisPos = stack.indexOf(this)
        ~thisPos ? stack.splice(thisPos + 1) : stack.push(this)
        ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key)
        if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value)
      }
      else stack.push(value)
  
      return replacer == null ? value : replacer.call(this, key, value)
    }
  }

let parenter = {
    set: function(target, prop, value){
      if(typeof value === "object" && prop !== 'contents'){
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


class File{
    constructor(name="", content=""){
        this.name = name
        this.content = content
    }

    setContent(content){
        this.content = content
    }

    getContent(){
        return this.content
    }
}



class Directory{
    
    constructor(name, parent, contents=[]){
        this[".."] = parent
        this.name = name
        this.contents = []
        this.isDirectory = true
        this.permissions = "" //to be implemented
    }

    getDirectoryProperties(){
        return ["name","permissions","isDirectory","contents"]
    }

    parent(){
        return this[".."]
    }

    hasDir(dirname){
        const dirnames = this.getDirnames()
        return dirnames.includes(dirname)
    }

    hasFile(filename){
        for(const file of this.contents){
            if(file && file.name == filename){
                return true
            }
        }
        return false
    }

    getDirnames(){
        const props = Object.keys(this)
        const thisDirectoryProperties = this.getDirectoryProperties()
        const dirnames = props.filter(prop =>{
            const isObject = typeof this[prop] == 'object'
            const isNotArray = !Array.isArray(this[prop])
            const isDirectoryProp = thisDirectoryProperties.includes(prop)
            if(isDirectoryProp == false && isObject == true && isNotArray == true){
                return prop
            }
                
        })
        
        return dirnames
    }

    getChildDirectories(){
        const childDirs = []
        const dirnames = this.getDirnames()
        for(const dirname of dirnames){
            if(dirname !== '..'){
                childDirs.push(this[dirname])
            }
        }

        return childDirs
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
        for(const file of this.contents){
            if(file && file.name == filename){
                return file
            }
        }
        return false
    }

    get(name){
        const isDirectory = this.hasDir(name)
        if(isDirectory) return this[name]

        const isFile = this.hasFile(name)
        if(isFile) return this.files[name]

        return undefined
    }

    getFilenames(){
        const filenames = []
        for(const file of this.contents){
            if(file){
                filenames.push(file.name)
            }
        }
        return filenames
    }

    getFiles(){
        return this.contents
    } 

    removeFile(filename){
        const file = this.getFile(filename)
        const indexOfFile = this.contents.indexOf(file)
        if(indexOfFile == -1) throw new Error(`File ${filename} was not found in ${this.name}`)
        
        delete this.contents[indexOfFile]

        return true
    }

}



class VirtualFileSystem{
    constructor(username){
        //All objects will be treated like potential directories
        this.username = username
        this.filesystem = new Proxy({}, parenter)
        this.filesystem["/"] = {
            home:{
                desktop:{},
                documents:{},
            },
            [username]:{},
        }
        this.workingDir = this.filesystem["/"] 
    }

    exposeCommands(){
        return {
            ls:this.ls,
            cd:this.cd,
            pwd:this.pwd,
            rm:this.rm,
            rmdir:this.rmdir,
            mkdir:this.mkdir,
            touch:this.touch,
            cat:this.cat,
            whereis:this.whereis,
            search:this.search,
            cp:this.cp,
            mv:this.mv,
            autoCompletePath:this.autoCompletePath,
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

    removeDirectoryMarker(path){
        const hasDirectoryMarker = path[path.length - 1] === "/"
        if(hasDirectoryMarker){
            return path.slice(0, path.length - 1)
        }else{
            return path
        }
    }

    cd(path){
        try{
            if(path !== "/"){
                path = this.removeDirectoryMarker(path)
            }
            
            const newWorkingDirectory = this.getDir(path)
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
        let directory = false
        if(path == undefined){
            directory = this.workingDir
        }else{
            directory = this.find(path)
            const isDirectory = this.isDir(directory)
            if(!isDirectory) throw new Error(`Command ls failed. ${path} is not a directory`)
        }
        
        const contents = (directory ? directory.getContentNames() : [])

        return contents
    }

    mkdir(path){
        if(path === undefined) throw new Error('touch: missing file operand')
        
        const pathArray = this.fromPathToArray(path)
        const dirname = pathArray[pathArray.length - 1]
        const isWithinThisDir = pathArray.length == 1
// debugger
        const exists = this.workingDir.hasDir(dirname)
        if(exists) throw new Error(`mkdir: directory ${dirname} already exists`)

        if(isWithinThisDir){
            this.workingDir[dirname] = {}//new Directory(dirname, this.workingDir)
// debugger
        }else{
            pathArray.pop()
            const pathToFile = this.fromArrayToPath(pathArray) 
            const targetDirectory = this.find(pathToFile)
            
            const exists = targetDirectory[dirname]
            if(exists) throw new Error(`mkdir: directory ${dirname} already exists`)

            targetDirectory[dirname] = {}//new Directory(dirname, targetDirectory)
        }

        return true
    }

    cat(path){
        if(path === undefined) throw new Error('cat: missing file operand')
        const pathArray = this.fromPathToArray(path)
        const filename = pathArray[pathArray.length - 1]
        
        const directory = this.findContainingDir(path)
        if(!directory) throw new Error(`cat: could not find directory of file ${path}`)

        const file = directory.getFile(filename)
        if(!file) return undefined
        
        return file.content
    }

    pwd(){
        let path = this.getAbsolutePath(this.workingDir)
        path = path.unshift("/")
        return path
    }

    touch(path, content){
        if(path === undefined) throw new Error('touch: missing file operand')
        const pathArray = this.fromPathToArray(path)
        const filename = pathArray[pathArray.length - 1]
        if(this.workingDir[filename]) throw new Error(`touch: cannot overwrite directory ${filename}`)
        
        const directory = this.findContainingDir(path)
        if(!directory) throw new Error(`touch: could not find containing directory ${path}`)

        const exists = directory.hasFile(filename)
        if(exists) throw new Error(`touch: file ${filename} already exists`)

        directory.contents.push(new File(filename, content))
        
        return true
    }

    cp(pathFrom, pathTo){
        
        if(!pathFrom) throw new Error('Need to provide origin path of file to copy')
        if(!pathTo) throw new Error('Need to provide destination path of file to copy')

        const found = this.search(pathFrom)
        if(!found) throw new Error(`Could not find file ${pathFrom}`)

        const { file } = found
        if(!file) throw new Error(`-r not specified; omitting directory ${pathFrom}`)

        const copied = this.touch(pathTo, file.content)

        return copied
    }

    mv(pathFrom, pathTo){
        if(!pathFrom) throw new Error('Need to provide origin path of file to copy')
        if(!pathTo) throw new Error('Need to provide destination path of file to copy')

        const found = this.search(pathFrom)
        if(!found) throw new Error(`Could not find file ${pathFrom}`)

        const { file } = found
        if(!file) throw new Error(`-r not specified; omitting directory ${pathFrom}`)

        const copied = this.touch(pathTo, file.content)

        const removed = this.rm(pathFrom)

        return copied
    }

    rm(...paths){
        const results = []
        for(const path of paths){
            if(path === undefined) throw new Error('rmdir: missing file operand')
            const pathArray = this.fromPathToArray(path)
            const filename = pathArray[pathArray.length - 1]
            const isWithinThisDir = pathArray.length == 1
            if(isWithinThisDir){
                const isElementToDeleteDirectory = this.workingDir.hasDir(path)
                if(isElementToDeleteDirectory == true){
                    throw new Error(`rm: cannot remove '${path}': Is a directory`)
                }
                results.push(this.workingDir.removeFile(filename))
            }else{
                pathArray.pop()
                const pathToFile = this.fromArrayToPath(pathArray) 
                const targetDirectory = this.find(pathToFile)
                const isElementToDeleteDirectory = targetDirectory.hasDir(pathToFile)
                if(isElementToDeleteDirectory == true){
                    throw new Error(`rm: cannot remove '${path}': Is a directory`)
                }
                results.push(targetDirectory.removeFile(filename))
            }
            
            
        }

        return { removed:results }
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
            const pathToDir = this.fromArrayToPath(pathArray) 
            const targetDirectory = this.find(pathToDir)
            delete targetDirectory[dirname]
        }

        return true
    }

    find(path){
        if(!path) return this.workingDir
        if(typeof path !== 'string'){
            throw new Error('Path provided needs to be a string')
        }
        if(path === "") path = this.workingDir.name
        if(path === "/") return this.root()
        if(path === ".." && this.isRootDir(this.workingDir)) return this.workingDir
        if(path === ".") return this.workingDir        
        if(path === this.workingDir.name) return this.workingDir

        const isDirectChild = this.workingDir[path]
        if(isDirectChild) return this.workingDir[path]

        //Do not move working directory, just follow the path
        let currentDir = this.workingDir
        
        const dirnames = this.fromPathToArray(path)
        for(const dir of dirnames){
            if(dir !== ""){
                const exists = currentDir[dir]
                const isDirectory = this.isDir(currentDir[dir])
                if(exists){
                    if(isDirectory){
                        currentDir = currentDir[dir]
                    }
                }else{
                    throw new Error(`Directory ${dir} could not be found`)
                }
            }
        }
        
        return currentDir
    }

    whereis(itemName){
        const found = this.search(itemName)
        
        if(found){
            if(found.directory){
                return this.getAbsolutePath(found.directory)
            }else if(found.file){
                const path = this.getAbsolutePath(found.containedIn)
                return path+"/"+itemName
            }else{
                throw new Error(`${itemName} is not a file or a directory`)
            }
            
        }else{
            return false
        }
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

    autoCompletePath(partialPath){
        if(!partialPath) return this.ls()
        if(typeof partialPath !== 'string') throw new Error('Partial path type must be string to autocompelte')
        
        const isExistingDir = this.workingDir[partialPath]
        if(isExistingDir) return [this.workingDir[partialPath].name]

        const existingFile = this.workingDir.getFile(partialPath)
        if(existingFile) return [existingFile.name]

        let partialTarget = ""
        let relativePath = ""

        if(partialPath.includes("/")){
            const pathArray = this.fromPathToArray(partialPath)
            partialTarget  = pathArray[pathArray.length - 1]
            pathArray.pop()
            relativePath = this.fromArrayToPath(pathArray)
        }else{
            partialTarget = partialPath
        }
        
        const contents = this.ls(relativePath)
        
        const result = this.findMatchingPartialValues(partialTarget, contents)
        return result
    }

    findMatchingPartialValues(partialValue, setOfValues){
        const options = []
        for(let value of setOfValues){
          const contains = value.substr(0, partialValue.length) == partialValue
          if(contains){
            options.push(value)
          }
        }
    
        return options
      }

    getAbsolutePath(currentDir){
        const directoriesArray =  this.walkBackToRootDir(currentDir)
        return this.fromArrayToPath(directoriesArray)
    }

    findContainingDir(path){
        const pathArray = this.fromPathToArray(path)
        const isWithinThisDir = pathArray.length == 1
        let directory;

        if(isWithinThisDir)
            directory = this.workingDir
        else{
            pathArray.pop()
            const pathToDir = this.fromArrayToPath(pathArray) 
            directory = this.getDir(pathToDir)
        }

        return directory
    }

    fromArrayToPath(arrayOfDirectories){
        const path = this.convertToPathString(arrayOfDirectories)
        return path
    }

    convertToPathString(directoriesArray){
        return Array.isArray(directoriesArray) ? directoriesArray.join("/") : ""
    }

    fromPathToArray(path){
        let arrayOfDirectories = this.splitPathIntoArray(path)
        arrayOfDirectories = cleanUpEmptyArrayCells(arrayOfDirectories)
        return arrayOfDirectories
    }
    
    splitPathIntoArray(path){
        if(path.includes("/")){
            return path.split("/")
        }else{
            return [path]
        }
    }

    recursiveWalk(directory, modifierFunc=()=>{}){
        const children = directory.getChildDirectories()
        for(const child of children){
            if(child.name !== '..'){
                modifierFunc(child)
                this.recursiveWalk(child, modifierFunc)
            }
        }
    }

    preParsePath(path){
        if(path){
            const hasDirectoryMarker = path[path.length-1] === "/"
            if(hasDirectoryMarker){
                path = path.substring(0, path.length - 1);
            }
            
        }
        return path
    }

    getDir(path){
        if(!path) return this.workingDir
        if(typeof path !== 'string') throw new Error(`search: type of path parameter must be string ${path}`)
        
        if(path === '/') return this.root()
        if(path === '.') return this.workingDir
        if(path === './') return this.workingDir
        if(path === ".." && this.isRootDir(this.workingDir)) return this.workingDir
        if(path === this.workingDir.name) return this.workingDir

        path = this.preParsePath(path)

        const pathArray = this.fromPathToArray(path)
        const target = pathArray[pathArray.length - 1]

        let currentDir = this.workingDir

        if(pathArray.length > 1){
            pathArray.pop()
            for(const dirname of pathArray){
                
                if(currentDir[dirname] && this.isDir(currentDir[dirname])){
                    currentDir = currentDir[dirname]
                }else{
                    throw new Error(`Cannot find directory ${dirname}`)
                }
                
            }
        }
        
        const dirExists = currentDir[target]
        const isFile = currentDir.getFile(target)
        if(dirExists){
            return currentDir[target]
        }else if(isFile){
            throw new Error(`Cannot open directory ${target}: it is a file`)
        }else{
            return false
        }
    }

    search(path){
        if(!path) throw new Error(`search: path undefined`)
        if(typeof path !== 'string') throw new Error(`search: type of path parameter must be string ${path}`)

        if(path === '/') return { directory:this.root() } 
        if(path === '.') return { directory:this.wd() } 
        if(path === './') return { directory:this.wd() } 

        path = this.preParsePath(path)

        const pathArray = this.fromPathToArray(path)
        const target = pathArray[pathArray.length - 1]
        let currentDir = this.wd()

        if(pathArray.length > 1){
            pathArray.pop()
            for(const dirname of pathArray){
                if(currentDir[dirname]){
                    currentDir = currentDir[dirname]
                }else{
                    throw new Error(`Cannot find directory ${dirname}`)
                }
                
            }
        }

        const isChildDirectory = currentDir[target]
        const isFile = currentDir.getFile(target)
        if(isChildDirectory){
            return { directory:currentDir[target] }
        }else if(isFile){
            const found = currentDir.getFile(target)
            return { file:found, containedIn:currentDir }
        }else{
            return false
        }
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



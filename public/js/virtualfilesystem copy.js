String.prototype.unshift = function(el) {
    let arr = [this];
    arr.unshift(el);
    return arr.join("");
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
        console.log('target',target)
        console.log('prop', prop)
        console.log('value', value)
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



class Directory{
    
    constructor(name, parent, contents=[]){
        this[".."] = parent
        this.name = name
        this.files = {}
        this.contents = []
        this.isDirectory = true
        this.permissions = "" //to be implemented
    }

    getDirectoryProperties(){
        return ["name","files","permissions","isDirectory","contents"]
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



class VirtualFileSystem{
    constructor(username, imported){
        //All objects will be treated like potential directories
        this.username = username
        this.filesystem = new Proxy({}, parenter)
        if(imported){
            console.log('Importing', imported)
            this.filesystem["/"] = {
                ...imported
            }
        }else{
            
            this.filesystem["/"] = {
                home:{},
                [username]:{}
            }
        }
        this.workingDir = this.filesystem["/"] //this.root.home
    }

    isDir(destination){
        if(destination === undefined) return false
        const canContainFiles = destination.files !== undefined
        
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

        if(path == ".." && this.isRootDir(this.workingDir)){
            return this.workingDir
        }

        let workingDir = this.workingDir
        if(path === workingDir.name){
            return workingDir
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

    search(itemName){
        return new Promise((resolve)=>{
            this.recursiveWalk(this.root(), (directory)=>{
                const isDir = directory.name == itemName
                const isFile = directory.files[itemName]

                if(isDir){
                    resolve({ directory:directory })
                }else if(isFile){
                    resolve({ file:directory.files[itemName] })
                }
            })

            resolve(undefined)
        })
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
        // directory.contents.push(new File(filename))
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

    recursiveWalk(directory, modifierFunc=()=>{}){
        const children = this.getSubDirectories(directory)//directory.getChildDirectories()
        for(const child of children){
            if(child.name !== '..'){
                modifierFunc(child)
                this.recursiveWalk(child, modifierFunc)
            }
        }
    }

    * walkTree(directory, modifierFunc){
        const children = this.getSubDirectories(directory)//directory.getChildDirectories()
        for(const child of children){
            if(child.name !== '..'){
                modifierFunc(child)
                yield* this.recursiveWalk(child, modifierFunc)
            }
        }
    }

    removeCircularReferences(directory){
        const unlinked = {
            name:directory.name,
            files:directory.files,
            id:directory.id,
            type:directory.type,
            permissions:directory.permissions,
            contents:directory.contents
        }
        const noCircularStr = stringify(directory, null, null, () => undefined)
        const noCircular = JSON.parse(noCircularStr)
        let clean = {}
        Object.keys(noCircular).map(prop =>{
            if(prop !== '..'){
                clean[prop] = noCircular[prop]
            }
        })
        console.log(clean)
        return clean
    }

    extractDirectories(directory, structure){
        
        const dirnames = directory.getDirnames()
        for(const dirname of dirnames){
            
            if(dirname !== '..'){
                const child = directory[dirname]
                if(child.files && this.isDir(child)){
                    if(child.parent().name == directory.name){
                        const exportable = this.removeCircularReferences(child)
                        structure[dirname] = exportable
                        this.extractDirectories(child, structure[dirname])
                    }
                }
            }
        }
        return structure
    }

    export(startingDirectory=this.root()){
        const clean = stringify(startingDirectory, null, null, ()=>undefined)
        return clean
    }

}

module.exports = VirtualFileSystem



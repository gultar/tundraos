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
        // console.log('target',target)
        // console.log('prop', prop)
        // console.log('value', value)
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
            home:{},
            [username]:{}
        }
        this.workingDir = this.filesystem["/"] //this.root.home
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

    mkdir(path){
        if(path === undefined) throw new Error('touch: missing file operand')
        
        const pathArray = this.fromPathToArray(path)
        const dirname = pathArray[pathArray.length - 1]
        const isWithinThisDir = pathArray.length == 1

        const exists = this.workingDir[dirname]
        if(exists) throw new Error(`mkdir: directory ${dirname} already exists`)

        if(isWithinThisDir){
            this.workingDir[dirname] = {}

        }else{
            pathArray.pop()
            const pathToFile = this.fromArrayToPath(pathArray) 
            const targetDirectory = this.find(pathToFile)
            
            const exists = targetDirectory[dirname]
            if(exists) throw new Error(`mkdir: directory ${dirname} already exists`)

            targetDirectory[dirname] = {}
        }

        return true
    }

    cat(path){
        if(path === undefined) throw new Error('cat: missing file operand')
        const pathArray = this.fromPathToArray(path)
        const filename = pathArray[pathArray.length - 1]
        const directory = this.findDir(path)
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
        const directory = this.findDir(path)
        const exists = directory.hasFile(filename)
        if(exists) throw new Error(`touch: file ${filename} already exists`)

        directory.contents.push(new File(filename, content))
        
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
            return this.workingDir.removeFile(filename)

        }
        
        pathArray.pop()
        const pathToFile = this.fromArrayToPath(pathArray) 
        const targetDirectory = this.find(pathToFile)
        const isElementToDeleteDirectory = targetDirectory.hasDir(pathToFile)
        if(isElementToDeleteDirectory == true){
            throw new Error(`rm: cannot remove '${path}': Is a directory`)
        }
        return targetDirectory.removeFile(filename)

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

        const dirnames = this.fromPathToArray(path)

        for(const dir of dirnames){
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
                const isFile = directory.getFile(itemName)

                if(isDir){
                    resolve({ directory:directory })
                }else if(isFile){
                    resolve({ file:directory.getFile(itemName), containedIn:directory })
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

    findDir(path){
        const pathArray = this.fromPathToArray(path)
        const isWithinThisDir = pathArray.length == 1
        let directory;

        if(isWithinThisDir)
            directory = this.workingDir
        else{
            pathArray.pop()
            const pathToDir = this.fromArrayToPath(pathArray) 
            directory = this.find(pathToDir)
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
        const directories = path.split("/")
        return directories
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

    //does not work
    * walkTree(directory, modifierFunc){
        const children = this.getSubDirectories(directory)//directory.getChildDirectories()
        for(const child of children){
            if(child.name !== '..'){
                modifierFunc(child)
                yield* this.recursiveWalk(child, modifierFunc)
            }
        }
    }

    // removeCircularReferences(directory){
    //     const unlinked = {
    //         name:directory.name,
    //         id:directory.id,
    //         type:directory.type,
    //         permissions:directory.permissions,
    //         contents:directory.contents
    //     }
    //     const noCircularStr = stringify(directory, null, null, () => undefined)
    //     const noCircular = JSON.parse(noCircularStr)
    //     let clean = {}
    //     Object.keys(noCircular).map(prop =>{
    //         if(prop !== '..'){
    //             clean[prop] = noCircular[prop]
    //         }
    //     })
    //     return clean
    // }

    // extractDirectories(directory, structure){
        
    //     const dirnames = directory.getDirnames()
    //     for(const dirname of dirnames){
            
    //         if(dirname !== '..'){
    //             const child = directory[dirname]
    //             if(child.contents && this.isDir(child)){
    //                 if(child.parent().name == directory.name){
    //                     const exportable = this.removeCircularReferences(child)
    //                     structure[dirname] = exportable
    //                     this.extractDirectories(child, structure[dirname])
    //                 }
    //             }
    //         }
    //     }
    //     return structure
    // }

    setDirectoryContent(directory, structureEntry){
        for(const prop in structureEntry){
            if(Array.isArray(structureEntry[prop]) && typeof structureEntry[prop] == "object"){
                for(const value of structureEntry[prop]){
                    // console.log('Has', directory.contents)
                }

            }else if(!Array.isArray(structureEntry[prop]) && typeof structureEntry[prop] == "object"){
                directory[prop] = structureEntry[prop]
                this.setDirectoryContent(directory[prop], structureEntry[prop])
            }else{
                // directory[prop] = structureEntry[prop]
                // console.log('Structure has prop',prop, structureEntry[prop])
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



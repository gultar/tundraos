(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
    const File = require('./file')
    const Directory = require('./directory')
    
    class DirectoryPointer{
        constructor(root, persistance){
            if(!root) throw new Error('Need to provide root value to directory pointer')
            this.rootDir = root
            this.workingDir = root
            this.persistance = this.clonePersistanceInstance(persistance)
            this.persistance.pwd = ()=> this.pwd()
            this.lastUsed = Date.now()
        }
    
        exposeExternalCommands(){
            return {
                ls:this.ls,
                cd:this.cd,
                pwd:this.pwd,
                rm:this.rm,
                rmdir:this.rmdir,
                mkdir:this.mkdir,
                touch:this.touch,
                whereis:this.whereis,
                createVirtualFile:this.createVirtualFile,
                cat:this.cat,
                cp:this.cp,
                mv:this.mv,
                autoCompletePath:this.autoCompletePath,
                getFile:this.getFile,
                getFileContent:this.getFileContent,
                editFile:this.editFile,
                exists:this.exists,
                getAbsolutePath:this.getAbsolutePath,
                saveFile:this.saveFile
            }
        }
    
        exposeInternalCommands(){
            return{
                isDir:this.isDir,
                lookup:this.lookup,
                search:this.search,
                whereis:this.whereis,
                walk:this.walk,
            }
        }
    
        clonePersistanceInstance(persistance){
            return Object.assign(Object.create(Object.getPrototypeOf(persistance)), persistance)
        }
    
        root(){
            return this.rootDir
        }
    
        wd(){
            return this.workingDir
        }
    
        findDir(path){
            if(!path) return this.workingDir
            if(typeof path !== 'string'){
                throw new Error('Path provided needs to be a string')
            }
            if(path === "") path = this.workingDir.name
            if(path === "/") return this.root()
            if(path === ".." && this.isRootDir(this.workingDir)) return this.workingDir
            if(path === ".") return this.workingDir  
            
            // if(path[0] === ".") path.slice(0,1)
    
            const isDirectChild = this.workingDir[path]
            if(isDirectChild) return this.workingDir[path]
    
            let currentDir = this.workingDir
    
            const isAbsolutePath = path[0] === '/'
            if(isAbsolutePath){
                currentDir = this.root()
            }
            
            
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
                        // throw new Error(`Directory ${dir} could not be found`)
                        return false
                    }
                }
            }
            
            return currentDir
        }
    
        cd(path){
            try{
                if(!path){
                    this.workingDir = this.root()
                    return this.workingDir.name
                }
    
                if(path !== "/"){
                    path = this.removeDirectoryMarker(path)
                }
                
                const newWorkingDirectory = this.findDir(path)
                
                if(this.isDir(newWorkingDirectory)){
                    this.workingDir = newWorkingDirectory
                }else{
                    console.log('cd: new dir is not a dir', newWorkingDirectory)
                }
    
                this.persistance.cd(this.pwd())
                
                return this.workingDir.name
                
            }catch(e){
                console.log(e)
                return e.message
            }
        }
    
        pwd(){
            let path = this.getAbsolutePath(this.workingDir)
            path = "/" + path
            return path
        }
    
        async ls(path, args=[]){
            let [ fullContents, ...rest ] = args
            let directory = false
            if(path == undefined){
                directory = this.workingDir
            }else{
    
                directory = await this.findDir(path)
                if(!directory) return new Error(`ls: ${path} not found`)
                
                const isDirectory = this.isDir(directory)
                if(!isDirectory) return new Error(`ls: ${path} is not a directory`)
            }
    
            let contents = [];
            
            if(fullContents){
                contents = (directory ? directory.getContents() : [])
            }else{
                contents = (directory ? directory.getContentNames() : [])
            }
            
            // console.log(this.workingDir)
            return contents
        }
    
        async mkdir(path, dirToCopy=false){
            if(path === undefined) throw new Error('touch: missing file operand')
            
            const pathArray = this.fromPathToArray(path)
            const dirname = pathArray[pathArray.length - 1]
            const isWithinThisDir = pathArray.length == 1
            let targetDirectory = ""
    
            const nameValidator = /^(\w+\.?)*\w+$/
            if(nameValidator.test(dirname) === false){
                throw new Error('Directory name can only contain alphanumerical characters')
            }
    
            if(isWithinThisDir){
                const exists = this.workingDir.hasDir(dirname)
                if(exists) throw new Error(`mkdir: directory ${dirname} already exists`)
                
                if(dirToCopy){
                    const structure = await this.buildStructure(dirToCopy)
                    this.workingDir[dirname] = new Directory(dirname, this.workingDir, dirToCopy.contents)
                    
                    this.setDirectoryContent(this.workingDir[dirname], dirToCopy)
                    
                }else{
                    this.workingDir[dirname] = new Directory(dirname, this.workingDir)//new Proxy({}, parenter)
                }
    
            }else{
                pathArray.pop()
                const pathToFile = this.fromArrayToPath(pathArray) 
                targetDirectory = this.findDir(pathToFile)
                
                const exists = targetDirectory[dirname]
                if(exists) throw new Error(`mkdir: directory ${dirname} already exists`)
    
                if(dirToCopy){
                    const structure = await this.buildStructure(dirToCopy)
                    targetDirectory[dirname] = new Directory(dirname, targetDirectory, dirToCopy.contents)
                    
                    this.setDirectoryContent(targetDirectory[dirname], structure)
    
                }else{
                    targetDirectory[dirname] = new Directory(dirname, targetDirectory)
                }
                
            }
    
    
            this.persistance.mkdir(path)
    
            return true
        }
    
    
        async buildStructure(sourceDir, structure={}){
            // yield sourceDir
            for await(let dirname of sourceDir.getDirnames()) {
                if(dirname !== '..'){
                    let child = sourceDir[dirname]
                    structure[dirname] = {
                        contents:child.contents
                    }
    
                    await this.buildStructure(child, structure[dirname]);
                }
            }
    
            return structure
        }
    
    
        async cat(path){
            if(path === undefined) throw new Error('cat: missing file operand')
            const pathArray = this.fromPathToArray(path)
            const filename = pathArray[pathArray.length - 1]
            
            pathArray.pop()
            const pathToFile = pathArray.join("/")
            
            const directory = this.findDir(pathToFile)
            if(!directory) throw new Error(`cat: could not find directory of file ${path}`)
    
            const file = directory.getFile(filename)
            if(!file) return false
    
            const content = await this.persistance.getFileContent(file.path)
            
            return content
        }
    
        touch(filePath, content=""){
            if(filePath === undefined) throw new Error('touch: missing file operand')
            
            const pathArray = this.fromPathToArray(filePath)
            const filename = pathArray.pop()
            const path = pathArray.join("/")
            if(this.workingDir[filename]) throw new Error(`touch: cannot overwrite directory ${filename}`)
            
    
            const directory = this.findDir(path)
            if(!directory) throw new Error(`touch: could not find containing directory ${path}`)
    
            const exists = directory.hasFile(filename)
            if(exists) throw new Error(`touch: file ${filename} already exists`)
    
            const realPath = this.persistance.resolvePath(filePath)
            
            const file = new File(filename, content, realPath)
            directory.contents.push(file)
            
            this.persistance.touch(filePath, content)
    
            return true
        }
    
        async whereis(name){
            let possibilities = []
            for await(const directory of this.walk()){
                if(directory.name === name){
                    const pathArray = this.walkBackToRootDir(directory)
                    const path = pathArray.join("/")
                    possibilities.push(path+"/")
                }else if(directory.hasFile(name) === true){
                    const pathArray = this.walkBackToRootDir(directory)
                    const path = pathArray.join("/")
                    possibilities.push(path+"/"+name)
                }
            }
    
            return possibilities
        }
    
        createVirtualFile(filePath, content=""){
            if(filePath === undefined) throw new Error('touch: missing file operand')
            
            const pathArray = this.fromPathToArray(filePath)
            const filename = pathArray.pop()
            const path = pathArray.join("/")
            if(this.workingDir[filename]) throw new Error(`touch: cannot overwrite directory ${filename}`)
            
    
            const directory = this.findDir(path)
            if(!directory) throw new Error(`touch: could not find containing directory ${path}`)
    
            const exists = directory.hasFile(filename)
            if(exists) throw new Error(`touch: file ${filename} already exists`)
    
            const realPath = this.persistance.resolvePath(filePath)
            
            const file = new File(filename, content, realPath)
            directory.contents.push(file)
    
            return true
        }
    
        async cp(pathFrom, pathTo){
            if(!pathFrom) throw new Error('Need to provide origin path of file to copy')
            if(!pathTo) throw new Error('Need to provide destination path of file to copy')
            let copied = false
            const found = this.search(pathFrom)
            if(!found) throw new Error(`Could not find file ${pathFrom}`)
    
            const { file, directory } = found
            if(!file && directory){
                const sourceDir = this.findDir(pathFrom)
    
                copied = this.mkdir(pathTo, sourceDir)
                
            }else if(file && !directory){
                const content = await this.getFileContent(pathFrom)
                copied = this.touch(pathTo, content)
                
            }
    
            this.persistance.cp(pathFrom, pathTo)
    
            return copied
        }
    
        async mv(pathFrom, pathTo){
            if(!pathFrom) throw new Error('Need to provide origin path of file to copy')
            if(!pathTo) throw new Error('Need to provide destination path of file to copy')
            let copied = false
            const found = this.search(pathFrom)
            if(!found) throw new Error(`Could not find file ${pathFrom}`)
    
            const { file, directory } = found
            if(!file && directory){
                copied = this.mkdir(pathTo)
                if(copied !== false){
                    this.rmdir(pathFrom)
                }
            }else if(file && !directory){
                const content = await this.getFileContent(pathFrom)
                copied = this.touch(pathTo, content)
                if(copied !== false){
                    this.rm(pathFrom)
                }
                
            }
    
            this.persistance.mv(pathFrom, pathTo)
    
            return copied
        }
    
        rm(...paths){
            if(paths === undefined) throw new Error('rmdir: missing file operand')
            const results = []
            for(const path of paths){
                
                const pathArray = this.fromPathToArray(path)
                const filename = pathArray[pathArray.length - 1]
                const isWithinThisDir = pathArray.length == 1
                if(isWithinThisDir){
                    const isElementToDeleteDirectory = this.workingDir.hasDir(path)
                    if(isElementToDeleteDirectory == true){
                        throw new Error(`rm: cannot remove '${path}': Is a directory`)
                    }
                    this.workingDir.removeFile(filename)
                    results.push({ removed:filename })
                }else{
                    pathArray.pop()
                    const pathToFile = this.fromArrayToPath(pathArray) 
                    const targetDirectory = this.findDir(pathToFile)
                    const isElementToDeleteDirectory = targetDirectory.hasDir(pathToFile)
                    if(isElementToDeleteDirectory == true){
                        throw new Error(`rm: cannot remove '${path}': Is a directory`)
                    }
                    targetDirectory.removeFile(filename)
                    results.push({ removed:filename })
                }
                
                
            }
    
            this.persistance.rm(...paths)
    
            return { removed:results }
        }
    
        rmdir(...paths){
            if(paths === undefined) throw new Error('rmdir: missing file operand')
            //should prompt for confirmation
            if(paths == '*') paths = this.workingDir.getDirnames().filter(path => path != '..') 
    
            const results = []
            for(const path of paths){
                
                const pathArray = this.fromPathToArray(path)
                const dirname = pathArray[pathArray.length - 1]
                const isWithinThisDir = pathArray.length == 1
                
                if(isWithinThisDir){
                    delete this.workingDir[dirname]
                    results.push({ removed:dirname })
                }else{
                    pathArray.pop()
                    const pathToDir = this.fromArrayToPath(pathArray) 
                    const targetDirectory = this.findDir(pathToDir)
                    delete targetDirectory[dirname]
                    results.push({ removed:dirname })
                }
    
            }
    
            this.persistance.rmdir(...paths)
    
            return { removed:results }
            
            
        }
    
        async editFile(path, newContent){
            const file = await this.getFile(path)
            if(!file) return false
            // file.content = newContent
            // const saved = this.workingDir.setFile(filename, file)
    
            return await this.persistance.editFile(path, newContent)
        }
    
        async getFile(path){
            const pathArray = path.split("/").filter(e => e !== "")
            const filename = pathArray.pop()
            const pathToFile = pathArray.join("/")
    
            const containingDir = this.findDir(pathToFile)
            if(!containingDir) throw new Error(`Could not find ${filename}: parent directory is invalid`)
    
            const file = containingDir.getFile(filename)
            if(!file) throw new Error(`Could not find ${filename}: file could not be found`)
    
            const content = await this.persistance.getFileContent(file.path)
            return {
                name:file.name,
                path:file.path,
                content:content
            }
        }
    
        async getFileContent(virtualPath){
            const file = await this.getFile(virtualPath)
            if(!file) return false
    
            const content = await this.persistance.getFileContent(file.path)
            return content
        }
    
        async exists(path){
            if(!path) throw new Error('exists: Must provide valid path')
    
            const found = await this.findDir(path)
            if(found) return true
            else return false
        }
    
        async lookup(name){
            let results = []
            for await(const child of this.walk()){
                if(child.name === target){
                    result.push({ directory:child })
                }else if(child.getFile(target)){
                    result.push({ file:child.getFile(target), containedIn:child })
                }else if(child.name.includes(name)){
                    result.push({ partialMatch:child })
                }
            }
    
            return results
        }
    
        search(path){
            if(!path) throw new Error(`search: path undefined`)
            if(typeof path !== 'string') throw new Error(`search: type of path parameter must be string ${path}`)
    
            if(path === '/') return { directory:this.root() } 
            if(path === '.') return { directory:this.wd() } 
            if(path === './') return { directory:this.wd() } 
    
            path = this.removeDirectoryMarker(path)
    
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
    
        async autoCompletePath(partialPath){
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
            
            const contents = await this.ls(relativePath)
            
            const result = this.findMatchingPartialValues(partialTarget, contents)
            return result
        }
    
        findMatchingPartialValues(partialValue, setOfValues){
            const options = []
            const matchingSegment = ""
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
    
        isRootDir(directory){
            if(directory == undefined) throw new Error("Directory provided is undefined")
            return directory.name == "/"
        }
    
        isDir(destination){
            if(destination === undefined) return false
            const canContainFiles = destination.contents !== undefined
            
            return canContainFiles
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
    
        removeDirectoryMarker(path){
            if(!path) return false
    
            const hasDirectoryMarker = path[path.length - 1] === "/"
            if(hasDirectoryMarker){
                return path.slice(0, path.length - 1)
            }else{
                return path
            }
        }
    
        setDirectoryContent(directory, structureEntry){
            console.log('Directory', directory.name)
            console.log('Structure Entry', structureEntry)
            for (const prop of Object.keys(structureEntry)){
                if(typeof structureEntry[prop] == "object" && prop !== 'contents' && prop !== ".."){
                    directory[prop] = new Directory(prop, directory, structureEntry[prop].contents)
                    this.setDirectoryContent(directory[prop], structureEntry[prop])
                }
            }
            return true
        }
    
        *walk(currentDir=this.root()) {
            yield currentDir
            for (let dirname of currentDir.getDirnames()) {
                if(dirname !== '..'){
                    let child = currentDir[dirname]
                    yield* this.walk(child);
                }
              }
        }
    }
    
    module.exports = DirectoryPointer
    
    },{"./directory":2,"./file":3}],2:[function(require,module,exports){
    class Directory{
        
        constructor(name, parent, contents=[], permissions=""){
            this[".."] = parent
            this.name = name
            this.contents = contents
            this.isDirectory = true
            this.permissions = permissions //to be implemented
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
    
        getContents(){
            const files = this.getFiles()
            const dirnames = this.getDirnames().map(dirname => {
                if(dirname !== "..")
                    return dirname + "/"
                else
                    return dirname
            })
    
            let dirs = []
            for(const dirname of dirnames){
                dirs.push({ directory:true, name:dirname })
            }
            return [ ...dirs, ...files ]
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
    
        setFile(filename, newFile){
            for(const file of this.contents){
                if(file && file.name == filename){
                    file.content = newFile.content
                    return true
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
    
    module.exports = Directory
    },{}],3:[function(require,module,exports){
    class File{
        constructor(name="", content="", path=""){
            this.name = name
            this.content = content
            this.path = path
        }
    
        setContent(content){
            this.content = content
        }
    
        getContent(){
            return this.content
        }
    }
    
    window.File = File
    
    module.exports = File
    },{}],4:[function(require,module,exports){
    const saveState = () =>{
      const exported = FileSystem.export()
      console.log('Exported', exported)
      return localStorage.setItem("filesystem", exported)
    }
    
    const init = () =>{
      let fsBackupStr = localStorage.getItem("filesystem")
    
      let fsBackup = undefined;
      if(fsBackupStr != undefined){
        try{
          fsBackup = JSON.parse(fsBackupStr)
          
        }catch(e){
          console.log(e)
          fsBackup = {}
        }
      }
      
      const VirtualFileSystem = require('./virtualfilesystem')
      const persistance = require('./localstorage-persistance')
      FileSystem = new VirtualFileSystem("guest",persistance) //ADD FSBACKUP
    
      FileSystem.import(fsBackup)
      window.FileSystem = FileSystem
    
      document.addEventListener('visibilitychange', function() {
          saveState()
      });
    }
    
    window.addEventListener("load", (event) => {
      console.log("page is fully loaded");
      init()
      initScript()
    });
    
    window.saveState = saveState
    },{"./localstorage-persistance":5,"./virtualfilesystem":8}],5:[function(require,module,exports){
    
    const resolvePath = (path) => {
        if(!path || path == null) return path
    
        path = "/" + path
        return removeDoubleSlash(path)
    }
    
    let persistanceInterface = {
        isInterface:true,
        touch:(filename, content)=>{
            if(typeof localStorage !== 'undefined'){
                filename = resolvePath(filename)
                localStorage.setItem(filename, JSON.stringify({
                    name:filename,
                    content:content,
                }))
            }
        },
        mkdir:()=>{},
        rmdir:()=>{},
        rm:(filename)=>{
            filename = resolvePath(filename)
            localStorage.removeItem(filename)
        },
        editFile:(filename, newContent="")=>{
            if(typeof localStorage !== 'undefined'){
                filename = resolvePath(filename)
                const fileString = localStorage.getItem(filename)
                if(fileString && fileString !== null && fileString !== 'null'){
                    const file = JSON.parse(fileString)
                    file.content = newContent
                    localStorage.setItem(filename, JSON.stringify(file))
                }else{
                    const file = new window.File(filename, newContent)
                    localStorage.setItem(filename, JSON.stringify(file))
                }
    
                return true
            }
        },
        cp:(pathFrom, pathTo)=>{
    
            if(typeof localStorage !== 'undefined'){
                pathFrom = resolvePath(pathFrom)
                pathTo = resolvePath(pathTo)
                const fileString = localStorage.getItem(pathFrom)
                localStorage.setItem(pathTo, fileString)
            }
        },
        mv:(pathFrom, pathTo)=>{
     
            if(typeof localStorage !== 'undefined'){
                pathFrom = resolvePath(pathFrom)
                pathTo = resolvePath(pathTo)
                const fileString = localStorage.getItem(pathFrom)
                localStorage.setItem(pathTo, fileString)
                localStorage.removeItem(pathFrom)
            }
        },
        cd:()=>{},
        resolvePath:(path)=>{
            if(!path || path == null) return path
            return path.replace("//","/")
        },
        getFile:(path)=>{
            
            if(typeof localStorage !== 'undefined'){
                path = resolvePath(path)
                const fileString = localStorage.getItem(path)
                if(!fileString || fileString == null) return false 
                
                const file = JSON.parse(fileString)
                return file
            }
        },
        getFileContent:(path)=>{
            if(typeof localStorage !== 'undefined'){
                path = resolvePath(path)
                const fileString = localStorage.getItem(path)
                if(!fileString) return false 
                
                if(fileString == 'null') return false
    
                console.log('Get File Content', fileString)
                console.log('Get File Content', typeof fileString)
    
                const file = JSON.parse(fileString)
                return file.content
            }
        },
    }
    
    module.exports = persistanceInterface
    },{}],6:[function(require,module,exports){
    const Directory = require('./directory')
    
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
    
    module.exports = parenter
    },{"./directory":2}],7:[function(require,module,exports){
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
    
    
    module.exports = { stringify }
    },{}],8:[function(require,module,exports){
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
    
    
    
    },{"./directory":2,"./directory-pointer":1,"./file":3,"./proxy":6,"./utils":7}]},{},[4]);
    
const parenter = require('./proxy')
const File = require('./file')

class DirectoryPointer{
    constructor(root, persistance){
        if(!root){
            root = new Proxy({}, parenter)
            root["/"] = {}
        }
        this.rootDir = root
        this.workingDir = root
        this.persistance = persistance

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
        path = path.unshift("/")
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
        
        return contents
    }

    mkdir(path, contents=[]){
        if(path === undefined) throw new Error('touch: missing file operand')
        
        const pathArray = this.fromPathToArray(path)
        const dirname = pathArray[pathArray.length - 1]
        const isWithinThisDir = pathArray.length == 1
        
        const nameValidator = /^(\w+\.?)*\w+$/
        if(nameValidator.test(dirname) === false){
            throw new Error('Directory name can only contain alphanumerical characters')
        }

        if(isWithinThisDir){
            const exists = this.workingDir.hasDir(dirname)
            if(exists) throw new Error(`mkdir: directory ${dirname} already exists`)
            this.workingDir[dirname] = new Proxy({}, parenter)

        }else{
            pathArray.pop()
            const pathToFile = this.fromArrayToPath(pathArray) 
            const targetDirectory = this.findDir(pathToFile)
            
            const exists = targetDirectory[dirname]
            if(exists) throw new Error(`mkdir: directory ${dirname} already exists`)

            targetDirectory[dirname] = new Proxy({}, parenter)
        }

        this.persistance.mkdir(path)

        return true
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
        let copied = false
        if(!pathFrom) throw new Error('Need to provide origin path of file to copy')
        if(!pathTo) throw new Error('Need to provide destination path of file to copy')

        const found = this.search(pathFrom)
        if(!found) throw new Error(`Could not find file ${pathFrom}`)

        const { file, directory } = found
        if(!file && directory){
            //throw new Error(`-r not specified; omitting directory ${pathFrom}`)
            copied = this.mkdir(pathTo)
        }else if(file && !directory){
            let content = await this.getFileContent(pathFrom)
            if(!content) content = " "
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

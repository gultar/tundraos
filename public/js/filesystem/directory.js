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
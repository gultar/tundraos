const fs = require('fs')
const fsa = require("fs").promises
const { writeFile } = fsa
const fsx = require('fs-extra')

const log = (...text) =>{
    console.log("[persistance:>]", ...text)
}

let mountPoint = ""

class Persistance{
    constructor(
        user="", 
        rootDir=".", 
        userspaceDir="./public/userspaces/",
        pwd=()=>{ return "/" }){
        // console.log('User', user)
        this.user = user
        this.rootDir = rootDir
        this.userspaceDir = userspaceDir
        this.baseDir = userspaceDir//`${userspaceDir}${user}`
        this.pwd = pwd //should be pointer .pwd()
        
        if(user == 'root'){
            this.baseDir = this.rootDir//`./public` 
        }
        
        this.currentDir = "/"
        
        if(user && !fs.existsSync(this.baseDir)){
            try{
                fs.mkdirSync(this.baseDir)
                log(`Created user ${user} filesystem directory`)
            }catch(e){
                console.log(e);
            throw e
                throw e
            }
        }

        mountPoint = (process.MOUNT_POINT == "." ? "" : process.MOUNT_POINT)
    }

    registerPointer(id, pointer){
        this.pointerIds[id] = pointer
    }

    resolvePath(path){
        let resolvedPath = ""
        this.currentDir = this.pwd()
        
        const directories = path.split("/").filter(directory => directory !== "")
        for(const dirname of directories){
            if(dirname !== ".."){
                resolvedPath = resolvedPath + "/" + dirname
            }else{
                resolvedPath = resolvedPath.split("/")
                resolvedPath.pop()
                resolvedPath = resolvedPath.join("/")
            }

            console.log('Resolved Path', resolvedPath)
        }

        resolvedPath = this.currentDir + resolvedPath
        console.log('Resolved Path', resolvedPath)
        

        if(resolvedPath.slice(0,2) == "//" && !process.fullOs)
            resolvedPath = resolvedPath.replace("//", "./")
        else
            resolvedPath = resolvedPath.replace("//", "/")

            console.log('Resolve Path No //', resolvedPath)

        return resolvedPath
    }

    // resolvePath(pathString){
    //     console.trace('pathString',pathString)
    //     this.currentDir = this.pwd()
    //     console.log('Current Dir', this.currentDir)
    //     let truePath = this.baseDir + this.currentDir
    //     console.log('First true path', truePath)
    //     console.log('Base Dir', this.baseDir)
    //     const paths = pathString.split("/").filter(path => path !== "")
    //     for(const path of paths){
    //         if(path !== ".."){
    //             truePath = truePath + "/" + path
    //         }else{
    //             truePath = truePath.split("/")
    //             truePath.pop()
    //             truePath = truePath.join("/")
    //         }
    //     }

        
        
    //     console.log('Second true path', truePath)
    //     truePath = mountPoint + truePath
    //     if(truePath.slice(0,2) == "//" && !process.fullOs)
    //          truePath = truePath.replace("//", "./")
    //     else
    //         truePath = truePath.replace("//", "/")

    //         console.log('Last True Path')
    //     return truePath
    // }

    cd(path){
        this.currentDir = this.pwd()
    }

    async touch(path, content=" "){
        try{
            await fsx.outputFile(this.resolvePath(path), content, { encoding: 'utf-8' })
            return true
        }catch(e){
            console.log(e);
            throw e
        }
    }

    mkdir(path){
        try{
            const newDir = fs.mkdirSync(this.resolvePath(path))
            log(`Created new directory ${path}:`, newDir)
        }catch(e){
            console.log(e);
            throw e
        }
    }

    async cp(pathFrom, pathTo){
        try{
            const stats = await fsa.lstat(this.resolvePath(pathFrom))
            if(stats.isDirectory()){
                const copied = await fsa.cp(this.resolvePath(pathFrom), this.resolvePath(pathTo), {recursive: true});
                log(`Copied directory ${pathFrom} recursively to ${pathTo}`, copied)
            }else{
                const copied = await fsa.copyFile(this.resolvePath(pathFrom), this.resolvePath(pathTo))
                log(`Copied file ${pathFrom} to ${pathTo}`, copied)
            }
            
        }catch(e){
            console.log(e);
            throw e
        }
    }

    async mv(pathFrom, pathTo){
        try{
            const isDirectory = fs.lstatSync(this.resolvePath(pathFrom)).isDirectory()
            if(isDirectory){
                // const copied = fsx.copySync(this.resolvePath(pathFrom), this.resolvePath(pathTo), { overwrite: false })
                const copied = fsx.copy(this.resolvePath(pathFrom), this.resolvePath(pathTo))
                .then(res => {
                    fs.rmSync(this.resolvePath(pathFrom), { recursive:true })
                    log(`Moved directory ${pathFrom} recursively to ${pathTo}`)
                })
                
            }else{
                const copied = await fsa.copyFile(this.resolvePath(pathFrom), this.resolvePath(pathTo))
                const sourceRemoved = await fsa.rm(this.resolvePath(pathFrom))

                log(`Moved file ${pathFrom} to ${pathTo}`)
            }

        }catch(e){
            console.log(e);
            throw e
        }
    }

    async rm(...paths){
        try{
            for(const path of paths){
                const sourceRemoved = await fsa.rm(this.resolvePath(path))
                log(`Deleted file ${path}`, sourceRemoved)
            }
        }catch(e){
            console.log(e)
            throw e
        }
    }

    async rmdir(...paths){
       try{
            for(const path of paths){
                const sourceRemoved = await fsa.rm(this.resolvePath(path), { recursive:true }).catch(e => console.log('Catch ',e))
                log(`Deleted directory ${path}:`, sourceRemoved)
            }
       }catch(e){
            console.log(e)
            throw e
       }
    }

    async editFile(filename, newContent){
        try{
            const edited = await fsa.writeFile(this.resolvePath(filename), newContent)
            log(`Edited file ${filename}'s content`)

            return true
        }catch(e){
            console.log(e);
            throw e
            throw new Error(e)
        }
    }

    async getFileContent(path){
        try{
            const content = await fsa.readFile(path)
            return content.toString()
        }catch(e){
            console.log(e);
            throw e
        }       
    }

    async saveBase64File(base64String, pathToFile){
        try{
            const saved = await fsa.writeFile(pathToFile, base64String, {encoding: 'base64'});
            log(`Saved base64 file ${pathToFile}'s content: ${saved}`)

            return true
        }catch(e){
            console.log(e);
            throw e
        }
    }

}

module.exports = Persistance
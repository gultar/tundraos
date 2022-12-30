const fs = require('fs')
const fsa = require("fs").promises
const { writeFile } = fsa
const fsx = require('fs-extra')

const log = (...text) =>{
    console.log("[persistance:>]", ...text)
}

let mountPoint = "system"

class Persistance{
    constructor(user="", rootDir=".", userspaceDir="./public/userspaces/"){
        // console.log('User', user)
        this.user = user
        this.rootDir = rootDir
        this.userspaceDir = userspaceDir
        this.baseDir = `${userspaceDir}${user}`
        
        if(user == 'root'){
            this.baseDir = this.rootDir//`./public` 
        }
        
        this.currentDir = "/"
        
        if(user && !fs.existsSync(this.baseDir)){
            try{
                fs.mkdirSync(this.baseDir)
                log(`Created user ${user} filesystem directory`)
            }catch(e){
                console.log(e)
                throw e
            }
        }

        mountPoint = process.MOUNT_POINT || 'system'
    }

    resolvePath(pathString){
        
        pathString = pathString.replace(mountPoint, '')
        this.currentDir = this.currentDir.replace(mountPoint, '').replace('//', '/')
        this.baseDir = this.baseDir.replace(mountPoint, '')
        const paths = pathString.split("/").filter(path => path !== "")
        
        let truePath = this.baseDir + this.currentDir
        
        for(const path of paths){
            if(path !== ".."){
                truePath = truePath + "/" + path
            }else{
                truePath = truePath.split("/")
                truePath.pop()
                truePath = truePath.join("/")
            }

            truePath = truePath.replace("//", "/")
        }

        return truePath
    }

    cd(path){
        this.currentDir = path
    }

    async touch(path, content=" "){
        try{
            await fsx.outputFile(this.resolvePath(path), content, { encoding: 'utf-8' })
            return true
        }catch(e){
            console.log(e)
        }
    }

    mkdir(path){
        try{
            const newDir = fs.mkdirSync(this.resolvePath(path))
            log(`Created new directory ${path}:`, newDir)
        }catch(e){
            console.log(e)
        }
    }

    async cp(pathFrom, pathTo){
        try{
            const isDirectory = fs.lstatSync(this.resolvePath(pathFrom)).isDirectory()
            if(isDirectory){
                const copied = await fs.cp(this.resolvePath(pathFrom), this.resolvePath(pathTo), {recursive: true});
                log(`Copied directory ${pathFrom} recursively to ${pathTo}`, copied)
            }else{
                const copied = await fsa.copyFile(this.resolvePath(pathFrom), this.resolvePath(pathTo))
                log(`Copied file ${pathFrom} to ${pathTo}`, copied)
            }
            
        }catch(e){
            console.log(e)
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
            console.log(e)
        }
    }

    rm(...paths){
        for(const path of paths){
            const sourceRemoved = fs.rmSync(this.resolvePath(path))
            log(`Deleted file ${path}`, sourceRemoved)
        }
    }

    rmdir(...paths){
        for(const path of paths){
            const sourceRemoved = fs.rmSync(this.resolvePath(path), { recursive:true })
            log(`Deleted directory ${path}:`, sourceRemoved)
        }
    }

    async editFile(filename, newContent){
        try{
            const edited = await fsa.writeFile(this.resolvePath(filename), newContent)
            log(`Edited file ${filename}'s content`)

            return true
        }catch(e){
            console.log(e)
            throw new Error(e)
        }
    }

    async getFileContent(path){
        try{
            const content = await fsa.readFile(path)
            
            return content.toString()
        }catch(e){
            console.log(e)
            throw new Error(e)
            // return { error:e.message }
        }       
    }

    async saveBase64File(base64String, pathToFile){
        try{
            const saved = await fsa.writeFile(pathToFile, base64String, {encoding: 'base64'});
            log(`Saved base64 file ${pathToFile}'s content: ${saved}`)

            return true
        }catch(e){
            console.log(e)
            throw new Error(e)
        }
    }

}

module.exports = Persistance
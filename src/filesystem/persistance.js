const fs = require('fs')
const fsx = require('fs-extra')

const log = (...text) =>{
    console.log("[FS:>]", ...text)
}

class Persistance{
    constructor(user=""){
        console.log('User', user)
        this.user = user
        this.baseDir = `./public/userspaces/${user}`
        
        if(user == 'root'){
            this.baseDir = `./public`
            
        }
        console.log('Base dir', this.baseDir)
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
    }

    resolvePath(pathString){
        pathString = pathString.replace('system', '')
        this.currentDir = this.currentDir.replace('system', '')
        this.baseDir = this.baseDir.replace('system', '')

        const paths = pathString.split("/").filter(path => path !== "")

        

        let truePath = this.baseDir + this.currentDir
        
        for(const path of paths){
            if(path !== ".."){
                truePath = truePath + "/" + path
                truePath = truePath.replace("//", "/")
            }else{
                truePath = truePath.split("/")
                truePath.pop()
                truePath = truePath.join("/")
            }
        }

        return truePath
    }

    cd(path){
        
        if(this.user == 'root'){
            //otherwise it can't find path within actual directory
            
        }
        this.currentDir = path
        log(`Set working directory : ${path}`)
    }

    touch(path, content=""){
        try{
            const newFile = fs.writeFileSync(this.resolvePath(path), content)
            log(`Created new file ${path}:`, newFile)
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

    cp(pathFrom, pathTo){
        try{
            const isDirectory = fs.lstatSync(this.resolvePath(pathFrom)).isDirectory()
            if(isDirectory){
                const copied = fs.cpSync(this.resolvePath(pathFrom), this.resolvePath(pathTo), {recursive: true});
                log(`Copied directory ${pathFrom} recursively to ${pathTo}`, copied)
            }else{
                const copied = fs.copyFileSync(this.resolvePath(pathFrom), this.resolvePath(pathTo))
                log(`Copied file ${pathFrom} to ${pathTo}`, copied)
            }
            
        }catch(e){
            console.log(e)
        }
    }

    mv(pathFrom, pathTo){
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
                const copied = fs.copyFileSync(this.resolvePath(pathFrom), this.resolvePath(pathTo))
                const sourceRemoved = fs.rmSync(this.resolvePath(pathFrom))

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

    editFile(filename, newContent){
        try{
            console.log('Resolved path Edit File', this.resolvePath(filename))
            const edited = fs.writeFileSync(this.resolvePath(filename), newContent)
            log(`Edited file ${filename}'s content: ${edited}`)
        }catch(e){
            console.log(e)
        }
    }

    getFileContent(path){
        return new Promise(resolve=>{
                fs.readFile(path, 'utf8', (err, content)=>{
                    if(err){
                        log('Error occured while reading file: ')
                        log(err)
                        log("-----------------------------------")
                        resolve(false)
                    }else{
                        log(`Read file ${path}'s content`)
                        resolve(content)
                    }

                })

        })
        
    }
}

module.exports = Persistance
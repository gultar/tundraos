const fs = require('fs')
const fsx = require('fs-extra')

class Persistance{
    constructor(user=""){
        console.log('User', user)
        this.user = user
        this.baseDir = `./public/userspaces/${user}`
        
        if(user == 'root'){
            this.baseDir = `./public`
            
        }

        console.log('Basedir', this.baseDir)
        this.currentDir = "/"
        if(user && !fs.existsSync(this.baseDir)){
            try{
                fs.mkdirSync(this.baseDir)
            }catch(e){
                console.log(e)
                throw e
            }
        }
    }

    resolvePath(pathString){
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
        path = path.replace('system', '')
        if(this.user == 'root'){
            //otherwise it can't find path within actual directory
            
        }
        this.currentDir = path
    }

    touch(path, content=""){
        console.log(path, content)
        try{
            const newFile = fs.writeFileSync(this.resolvePath(path), content)
        }catch(e){
            console.log(e)
        }
    }

    mkdir(path){
        try{
            const newDir = fs.mkdirSync(this.resolvePath(path))
        }catch(e){
            console.log(e)
        }
    }

    cp(pathFrom, pathTo){
        try{
            const isDirectory = fs.lstatSync(this.resolvePath(pathFrom)).isDirectory()
            if(isDirectory){
                fs.cpSync(this.resolvePath(pathFrom), this.resolvePath(pathTo), {recursive: true});
            }else{
                const copied = fs.copyFileSync(this.resolvePath(pathFrom), this.resolvePath(pathTo))
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
                })
                
            }else{
                const copied = fs.copyFileSync(this.resolvePath(pathFrom), this.resolvePath(pathTo))
                const sourceRemoved = fs.rmSync(this.resolvePath(pathFrom))
            }

        }catch(e){
            console.log(e)
        }
    }

    rm(...paths){
        for(const path of paths){
            const sourceRemoved = fs.rmSync(this.resolvePath(path))
        }
    }

    rmdir(...paths){
        for(const path of paths){
            const sourceRemoved = fs.rmSync(this.resolvePath(path), { recursive:true })
        }
    }

    editFile(filename, newContent){
        try{
            console.log('Resolved path Edit File', this.resolvePath(filename))
            const edited = fs.writeFileSync(this.resolvePath(filename), newContent)
        }catch(e){
            console.log(e)
        }
    }
}

module.exports = Persistance
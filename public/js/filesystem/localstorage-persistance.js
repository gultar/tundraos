let persistanceInterface = {
    touch:(filename, content)=>{
        if(typeof localStorage !== 'undefined'){
            localStorage.setItem(filename, JSON.stringify({
                name:filename,
                content:content,
            }))
        }
    },
    mkdir:()=>{},
    rmdir:()=>{},
    rm:()=>{},
    editFile:(filename, newContent)=>{
        if(typeof localStorage !== 'undefined'){
            const fileString = localStorage.getItem(filename)
            const file = JSON.parse(fileString)
            file.content = newContent
            localStorage.setItem(filename, JSON.stringify(file))
        }
    },
    cp:(pathFrom, pathTo)=>{
        if(typeof localStorage !== 'undefined'){
            const fileString = localStorage.getItem(pathFrom)
            localStorage.setItem(pathTo, fileString)
        }
    },
    mv:(pathFrom, pathTo)=>{
        if(typeof localStorage !== 'undefined'){
            const fileString = localStorage.getItem(pathFrom)
            localStorage.setItem(pathTo, fileString)
            localStorage.removeItem(pathFrom)
        }
    },
    cd:()=>{},
    resolvePath:(path)=>{return path},
    getFile:()=>{
        if(typeof localStorage !== 'undefined'){
            const fileString = localStorage.getItem(path)
            if(!fileString) return false 
            
            const file = JSON.parse(fileString)
            return file
        }
    },
    getFileContent:(path)=>{
        if(typeof localStorage !== 'undefined'){
            const fileString = localStorage.getItem(path)
            if(!fileString) return false 
            
            const file = JSON.parse(fileString)
            return file.content
        }
    },
}

module.exports = persistanceInterface

const resolvePath = (path) => {
    return path.replace("//","/")
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
    editFile:(filename, newContent)=>{
        if(typeof localStorage !== 'undefined'){
            filename = resolvePath(filename)
            const fileString = localStorage.getItem(filename)
            console.log('File String', fileString)
            if(fileString && fileString !== null){
                console.log('save: file exists', fileString)
                const file = JSON.parse(fileString)
                file.content = newContent
                localStorage.setItem(filename, JSON.stringify(file))
            }else{
                console.log('save: file does not exist',filename, newContent)
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
            if(!fileString || fileString == null) return false 
            
            console.log('Get File Content', fileString)

            const file = JSON.parse(fileString)
            return file.content
        }
    },
}

module.exports = persistanceInterface
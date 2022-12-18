const openFile = async (filename) =>{
    const path = await exec('whereis', [filename])
    const file = await exec("getFile", [path])
    let fileExists = false
    
    if(file){
        fileExists = true
    }
    
    const fileExtension = handleExtension(filename)
    if(fileExtension == "png" || fileExtension == 'jpg' || fileExtension == "gif"){
        
        window.viewImage(file)
    }else{
        window.launchNotepad(filename, file.content)
    }
    
}

const handleExtension = (filename) =>{
    const [ name, ...extensions ] = filename.split(".")

    return extensions[extensions.length - 1]
}
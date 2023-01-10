const removeDoubleSlash = (path) =>{
    return path.replace(/\/\//g, '/')
}

window.removeDoubleSlash = removeDoubleSlash
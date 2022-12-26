let files = {}
let mockPersistance = {

  isInterface:true,
  touch:(path, content)=>{
    const pathArray = path.split("/")
    const filename = pathArray[pathArray.length - 1]
    files[filename] = {
      name:filename,
      content:content,
    }
  },
  mkdir:()=>{},
  rmdir:()=>{},
  rm:()=>{},
  editFile:(filename, newContent)=>{
    const file = files[filename]
    file.content = newContent
  },
  cp:()=>{},
  mv:()=>{},
  cd:()=>{},
  resolvePath:(path)=>{return path},
  getFileContent:(path)=>{
    const pathArray = path.split("/")
    const filename = pathArray[pathArray.length - 1]
    
    const file = files[filename]
    if(!file) return false

    return file.content
      
  },
  getFileContentSync:(path)=>{
    const pathArray = path.split("/")
    const filename = pathArray[pathArray.length - 1]
    const file = files[filename]
    if(!file) return false

    return file.content
  }
}

module.exports = mockPersistance
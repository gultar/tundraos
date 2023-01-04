const fs = require("fs").promises
const File = require('../../public/js/filesystem/file.js')


// class RootFS{
//     constructor(){
//         this.system = {
//             contents:[]
//         },
//         this.contents = []
//     }
// }

const root = {
    contents:[]
}

const log = (...text) =>{
    if(!process.silentBuild) console.log(`[build:>]`, ...text)
}

let totalDirectories = 0
let totalFiles = 0

const buildFileSystemRepresentation = async (dirPath, fsPosition=root) =>{ //new RootFS().system
    
    try{
        files = await fs.readdir(dirPath)
    }catch(e){
        log('DIR BUILD ERROR', e)
        
        files = []
    }
    fsPosition.contents = []

  for(const file of files) {
    try{
        const stats = await fs.stat(dirPath + "/" + file)
        
        if (stats.isDirectory() && !stats.isSymbolicLink()) {
            const dir = file
            fsPosition[dir] = {
                contents:[]
            }
            log(`Adding directory ${dir}`)
            totalDirectories++
            await buildFileSystemRepresentation(dirPath + "/" + file, fsPosition[dir])
        } else if(!stats.isSymbolicLink()){
            
            
            const path = dirPath + "/" + file
            const fileContent = ""
            totalFiles++
            const newFile = new File(file, fileContent, path)
            fsPosition.contents.push(newFile)
            log(`\\_Adding file ${path}`)
        }else{
            console.log('SYMBOLIC LINK', stats)
        }

    }catch(e){
        log('DIR BUILD statSync ERROR',e)
    }
  }
  return fsPosition
}

const getBuildStats = () =>{
    return { totalDirectories:totalDirectories, totalFiles:totalFiles }
}

module.exports = { buildFileSystemRepresentation, getBuildStats }

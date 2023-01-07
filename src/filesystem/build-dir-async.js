const fs = require("fs").promises
const File = require('../../public/js/filesystem/file.js')
const { parentPort } = require("worker_threads")

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
        parentPort.postMessage({ log:e })
        
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
            parentPort.postMessage({ log:`Adding directory ${dir}` })
            totalDirectories++
            await buildFileSystemRepresentation(dirPath + "/" + file, fsPosition[dir])
        } else if(!stats.isSymbolicLink()){
            
            
            const path = dirPath + "/" + file
            const fileContent = ""
            totalFiles++
            const newFile = new File(file, fileContent, path)
            fsPosition.contents.push(newFile)
            parentPort.postMessage({ log:`\\_Adding file ${path}` })
        }else{
            console.log('SYMBOLIC LINK', stats)
        }

    }catch(e){
        parentPort.postMessage({ log:e })
    }
  }
  return fsPosition
}

const getBuildStats = () =>{
    return { totalDirectories:totalDirectories, totalFiles:totalFiles }
}

module.exports = { buildFileSystemRepresentation, getBuildStats }

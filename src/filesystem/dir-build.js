const fs = require("fs")
const File = require('../../public/js/classes/file.js')

// const rootFs = {
//     "system":{
//         contents:[]
//     },
//     contents:[]
// }

class RootFS{
    constructor(){
        this.system = {
            contents:[]
        },
        this.contents = []
    }
}

const log = (...text) =>{
    console.log(`[BUILD:>]`, ...text)
}

let totalDirectories = 0
let totalFiles = 0

const buildFileSystemRepresentation = function(dirPath, fsPosition=new RootFS().system) {
    
    files = fs.readdirSync(dirPath)
    fsPosition.contents = []

  for(const file of files) {
        
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            const dir = file
            fsPosition[dir] = {
                contents:[]
            }
            log('Adding directory ', dir)
            totalDirectories++
            buildFileSystemRepresentation(dirPath + "/" + file, fsPosition[dir])
        } else {
            
            log(`\\_Adding file ${file}`)
            const path = dirPath + "/" + file
            const fileContent = fs.readFileSync(path).toString()
            totalFiles++
            fsPosition.contents.push(new File(file, fileContent, path))
        }
  }
  return fsPosition
}

const getBuildStats = () =>{
    return { totalDirectories:totalDirectories, totalFiles:totalFiles }
}

module.exports = { buildFileSystemRepresentation, getBuildStats }

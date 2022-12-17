const fs = require("fs")
const File = require('../../public/js/classes/file.js')

const rootFs = {
    "system":{
        contents:[]
    },
    contents:[]
}

const buildFileSystemRepresentation = function(dirPath, fsPosition=rootFs["system"]) {
    // console.log('Dirpath', dirPath)
    files = fs.readdirSync(dirPath)
    // console.log(files)
    fsPosition.contents = []

  for(const file of files) {
        
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            const dir = file
            fsPosition[dir] = {
                contents:[]
            }
            console.log('Adding directory ', dir)
            buildFileSystemRepresentation(dirPath + "/" + file, fsPosition[dir])
        } else {
            
            console.log(`   Adding file ${file}`)
            const fileContent = fs.readFileSync(dirPath + "/" + file).toString()
            fsPosition.contents.push(new File(file, fileContent))
        }
  }
  
  return fsPosition
}

module.exports = { buildFileSystemRepresentation }

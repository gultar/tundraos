const {buildFileSystemRepresentation} = require("./build-dir-async")
process.silentBuild = true
const {
    parentPort, workerData,
  } = require('worker_threads');
  
  const build = async () =>{
    try{
      const { path } = workerData
      const dirStructure = await buildFileSystemRepresentation(path)
      
      if(dirStructure.error) console.log('Worker !!!',dirStructure.error)
      if(dirStructure && !dirStructure.error) parentPort.postMessage({ success:dirStructure })
      else if(dirStructure && dirStructure.error) parentPort.postMessage({ error:error })
      else parentPort.postMessage({ error:"Could not build directory structure" })

    }catch(e){
      console.log('Inside Worker', e)
      parentPort.postMessage({ error:e })
    }
   
  }
  
  build()
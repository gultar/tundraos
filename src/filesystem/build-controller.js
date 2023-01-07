const { Worker } = require('worker_threads')

const log = (...args) =>{
  console.log("[Worker:>]", ...args)
}

const buildWorker = (path=__dirname) =>{
    return new Promise((resolve) =>{
      const worker = new Worker("./src/filesystem/build-worker.js", {
        workerData:{
          path: path,
        }
      });
      worker.on('message', (message)=>{
        if(message.success){
          console.log('Loaded ', path)
          resolve(message.success)
          worker.terminate()
        }else if(message.log){
           if(!process.silentBuild) log(message.log)
        }else if(message.error){
            console.log('Worker Error', message.error)
          throw new Error(message.error)
          worker.terminate()
        }
      });
      worker.on('error', (error)=>{
        throw new Error(error)
        worker.terminate()
      });
      worker.on('exit', (code) => {
        
        if (code !== 0){
          // throw new Error()
          console.log(`Worker stopped with exit code ${code}`)
          worker.terminate()
        }
      });
    })
}

module.exports = buildWorker
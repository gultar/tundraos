const Downloader = require("nodejs-file-downloader");
const { Worker } = require('worker_threads');

const downloadWorker = (url, targetDir=__dirname, ipc) =>{
  return new Promise((resolve) =>{
    const worker = new Worker("./src/downloads/download-worker.js", {
      workerData:{
        url: url,
        targetDir:targetDir
      }
    });
    worker.on('message', (message)=>{
        
      if(message.success){
        console.log('Success!')
        resolve(message)
        worker.terminate()
      }else if(message.percentage){
        console.log('Message percentage', message.percentage)
        ipc.send('download-percentage',message)
      }else if(message.error){
        resolve({ error:message.error })
        worker.terminate()
      }
    });
    worker.on('error', (error)=>{
      resolve({ error:error })
      worker.terminate()
    });
    worker.on('exit', (code) => {
      if (code !== 0){
        resolve({ error:new Error(`Worker stopped with exit code ${code}`) })
        worker.terminate()
      }
    });
  })
}

const download = (url, targetDir=__dirname, parentPort) =>{
    return new Promise(async (resolve)=>{

        const downloader = new Downloader({
            url: url,
            directory: targetDir, //Sub directories will also be automatically created if they do not exist.
            onProgress: function (percentage, chunk, remainingSize) {
              //Gets called with each chunk.
              console.log("% ", percentage);
              console.log("Remaining bytes: ", remainingSize);
              parentPort.postMessage({ percentage:percentage, remainingSize:remainingSize })
              
            },
          });
        
          try {
            const success = await downloader.download();
            resolve({ success:success })
          } catch (error) {
            resolve({ error:error })
          }
    })
}


module.exports = { download, downloadWorker }
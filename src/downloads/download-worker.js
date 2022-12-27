const {
  parentPort, workerData,
} = require('worker_threads');
const { download } = require('./downloader')

const run = async () =>{
    const { url, targetDir } = workerData

    const { success, error } = await download(url, targetDir, parentPort)
    if(success) parentPort.postMessage({ success:success })
    else parentPort.postMessage({ error:error })

    return false
}

run()
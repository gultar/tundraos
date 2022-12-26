const Downloader = require("nodejs-file-downloader");

const download = (url, targetDir=__dirname) =>{
    return new Promise(async (resolve)=>{
        // const dl = new DownloaderHelper(url, targetDir);

        // dl.on('end', (result) => resolve({ success:true, result:result }));
        // dl.on('error', (err) => resolve({ error:err }));
        // dl.start().catch(err => resolve({ error:err }));

        const downloader = new Downloader({
            url: url,
            directory: targetDir, //Sub directories will also be automatically created if they do not exist.
            onProgress: function (percentage, chunk, remainingSize) {
              //Gets called with each chunk.
              console.log("% ", percentage);
              console.log("Current chunk of data: ", chunk);
              console.log("Remaining bytes: ", remainingSize);
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

module.exports = download
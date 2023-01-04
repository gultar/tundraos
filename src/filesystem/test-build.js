const buildWorker = require("./build-controller")
const fs = require("fs")
const mapLinuxFs = require("./map-linux-fs")
const fsa = require("fs").promises


const res = async (rootPath="/home/gultar/") =>{
    try{
        const contents = await fsa.readdir(rootPath)
        const dirNames = []
        for(const file of contents){
            const isDir = fs.statSync(rootPath+file).isDirectory()
            if(isDir){
                dirNames.push(file)
            }
        }
        // const { success, error } = await buildWorker("/usr")
        // console.log(JSON.stringify(success, null, 2))

        // console.log(dirNames)

        // const rootdirectories = [
        //     'bin',
        //     'boot',
        //     'dev',
        //     'etc',
        //     'home',
        //     'lib',
        //     'lib32',
        //     'lib64',
        //     'libx32',
        //     'lost+found',
        //     'media',
        //     'mnt',
        //     'opt',
        //     'root',
        //     'run',
        //     'sbin',
        //     'snap',
        //     'srv',
        //     'sys',
        //     'tmp',
        //     'usr',
        //     'var'
        //   ]
          

        // const filesystem = {}

        // filesystem["proc"] = await buildWorker("/proc")
        // for await(const dirname of dirNames){
        //     if(dirname !== 'proc') filesystem[dirname] = await buildWorker(rootPath+dirname)
        // }
        
        // console.log(filesystem)
        // let queue = []

        // const values = await Promise.all([buildWorker("bin"),
    //    const boot = await buildWorker("/boot")
    //    const etc =  await buildWorker("/etc")
    //    const dev = await buildWorker("/dev")
       const home = await buildWorker("/home")
       console.log('Home', home)
    //    const lib = await buildWorker("/lib")
    //    const lib32 = await buildWorker("/lib32")
    //    const lib64 = await buildWorker("/lib64")
    //    const libx32 = await buildWorker("/libx32")
    //    const lostFound = await buildWorker("/lost+found")
    //    const media = await buildWorker("/media")
    //    const mnt = await buildWorker("/mnt")
    //    const opt = await buildWorker("/opt")
    //    const proc = await buildWorker("/proc")
    //    const root = await buildWorker("/root")
    //    const run = await buildWorker("/run")
    //    const sbin = await buildWorker("/sbin")
    //    const snap = await buildWorker("/snap")
    //    const srv = await buildWorker("/srv")
    //    const sys = await buildWorker("/sys")
    //    const tmp = await buildWorker("/tmp")
    //    const usr = await buildWorker("/usr")
    //    const varDir = await buildWorker("/var")
        
    //    console.log({ boot,
    //     etc,
    //     dev,
    //     home,
    //     lib,
    //     lib32,
    //     lib64,
    //     libx32,
    //     lostFound,
    //     media,
    //     mnt,
    //     opt,
    //     // proc,
    //     root,
    //     run,
    //     sbin,
    //     snap,
    //     srv,
    //     sys,
    //     tmp,
    //     usr,
    //     varDir })

    }catch(e){
        console.log("ERROR FAIL:", e)
    }
}


// mapLinuxFs()
// .then(async (struct) =>{
    
//     const structString = JSON.stringify(struct, null, 2)
//     fsa.writeFile("./bigfile.json", structString)
// })
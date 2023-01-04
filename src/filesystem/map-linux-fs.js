const buildWorker = require("./build-controller")

const mapLinuxFs = async () =>{
    const boot = await buildWorker("/boot")
    const etc =  await buildWorker("/etc")
    const dev = await buildWorker("/dev")
    const home = await buildWorker("/home")
    const lib = await buildWorker("/lib")
    const lib32 = await buildWorker("/lib32")
    const lib64 = await buildWorker("/lib64")
    const libx32 = await buildWorker("/libx32")
    const lostFound = await buildWorker("/lost+found")
    const media = await buildWorker("/media")
    const mnt = await buildWorker("/mnt")
    const opt = await buildWorker("/opt")
 //    const proc = await buildWorker("/proc")
    const root = await buildWorker("/root")
    // const run = await buildWorker("/run")
    const sbin = await buildWorker("/sbin")
    const snap = await buildWorker("/snap")
    const srv = await buildWorker("/srv")
    // const sys = await buildWorker("/sys")
    const tmp = await buildWorker("/tmp")
    const usr = await buildWorker("/usr")
    // const varDir = await buildWorker("/var")

    return {
        boot:boot,
        etc:etc,
        dev:dev,
        home:home,
        lib:lib,
        lib32:lib32,
        lib64:lib64,
        libx32:libx32,
        lostFound:lostFound,
        media:media,
        mnt:mnt,
        opt:opt,
        root:root,
        // run:run,
        sbin:sbin,
        snap:snap,
        srv:srv,
        // sys:sys,
        tmp:tmp,
        usr:usr,
        // 'var':varDir
    }
}

module.exports = mapLinuxFs
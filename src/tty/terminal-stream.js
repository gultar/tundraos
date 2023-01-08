
const { init } = require("node-wifi");
const { Server } = require("socket.io");
const spawn = require('child_process').spawn


// let server;

// class TerminalStream{
//     constructor(){
//         this.spawnedProcess = ""
//     }

//     init(server){
//         const io = new Server(server);

//         io.on('connection', (socket)=>{
    
//             socket.on('stdin', (data)=>{
    
//             })
//         })
//     }
// }


class SpawnedProcess{
    constructor(cmd, stdout=console.log){
        this.process = spawn(cmd, { shell:'/bin/sh' })
        
        this.process.stdout.on('data', (d) => {
            stdout(`${d}`)
        })

        // this.process.stdout.pipe(process.stdout)

        process.stdin.pipe(this.process.stdin)

        this.process.stderr.on('data', (data) => {
            stdout(`stderr: ${data}`);
        });

        this.process.on('close', (code) => {
            stdout(`Spawned process exited with code ${code}`)
        });
    }

    send(cmd){
        this.process.stdin.write(`${cmd}\n`);
    }
}

let spawned = new SpawnedProcess('node shell.js')

setTimeout(()=>{
    spawned.send("console.log('hello')")
}, 5000)

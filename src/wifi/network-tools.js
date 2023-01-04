const [
    nodeString, 
    fileString, 
    ssidFlag, 
    ssidValue, 
    passwordFlag, 
    passwordValue] = process.argv
const wifi = require('node-wifi')

const connect = ({ ssid, password, iface=null })=>{
    return new Promise((resolve)=>{
        if(iface === false) iface = null

        wifi.init({
            iface:iface
        })

        console.log('RECEIVED', ssid, password, iface)
        
        if(!ssid){
            console.log('ERROR',ssid, password, iface)
            throw new Error("Need to provide valid SSID")
        }
        
        wifi.connect({ ssid: ssid, password: password }, async () => {
            const { connections, error } = await list()
            if(error) resolve({ error:error })
            else{
                console.log("Active Connections", connections)
                resolve({ success:`Connected to ${ssid}` })
            }
        
        });
    })
}

const list = () =>{
    return new Promise((resolve)=>{
        wifi.init({
            iface:null
        })

        wifi.getCurrentConnections((error, currentConnections) => {
            if (error) {
              resolve({ error:error })
            } else {
              resolve({ success:currentConnections })
              /*
              // you may have several connections
              [
                  {
                      iface: '...', // network interface used for the connection, not available on macOS
                      ssid: '...',
                      bssid: '...',
                      mac: '...', // equals to bssid (for retrocompatibility)
                      channel: <number>,
                      frequency: <number>, // in MHz
                      signal_level: <number>, // in dB
                      quality: <number>, // same as signal level but in %
                      security: '...' //
                      security_flags: '...' // encryption protocols (format currently depending of the OS)
                      mode: '...' // network mode like Infra (format currently depending of the OS)
                  }
              ]
              */
            }
          });
    })
}


const scan = async () =>{
    return new Promise((resolve)=>{

        // Initialize wifi module
        // Absolutely necessary even to set interface to null
        wifi.init({
            iface: null // network interface, choose a random wifi interface if set to null
        });
        
        // Scan networks
        wifi.scan((error, networks) => {
            if (error) {
                resolve({ error:error })
            } else {
                resolve({ success:networks })
            /*
                networks = [
                    {
                        ssid: '...',
                        bssid: '...',
                        mac: '...', // equals to bssid (for retrocompatibility)
                        channel: <number>,
                        frequency: <number>, // in MHz
                        signal_level: <number>, // in dB
                        quality: <number>, // same as signal level but in %
                        security: 'WPA WPA2' // format depending on locale for open networks in Windows
                        security_flags: '...' // encryption protocols (format currently depending of the OS)
                        mode: '...' // network mode like Infra (format currently depending of the OS)
                    },
                    ...
                ];
                */
            }
        });
    })
}

const disconnect = ({ iface }) =>{
    return new Promise((resolve)=>{
        
        if(!iface){
            iface = "wlp4s0"
        }
        wifi.init({ iface:iface });
        
        wifi.disconnect((error, disconnect) => {
            if (error) {
                console.log("Error:", error)
                resolve({ error:error })
            } else {
                console.log(error, disconnect)
                resolve({ disconnected:true })
            }
        });
    })
}

connect({
    ssid:"Maison Smith ☕",
    password:""
})

// disconnect()

module.exports = { connect, list, scan, disconnect }
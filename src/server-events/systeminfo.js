const os = require('os')

const formatSystemMonitorInfo = () =>{
    let info = ``
    
    let infoBuffer = [
        `[arch]: ${os.arch()}`,
        `[platform]: ${os.platform()}`,
        `[release]: ${os.release()}`,
        `[ostype]: ${os.type()}\n`,
        `[uptime]: ${(os.uptime()/(1000))} \n`,
        formatInterfacesInfo(os.networkInterfaces()),
        formatCPUinfo(os.cpus()),
        `[freemem]: ${(os.freemem()/(1024*1024))} mb`,
        `[totalmem]: ${(os.totalmem()/(1024*1024))} mb\n`,


    ]
    
   for(const entry of infoBuffer){
       info = info + `${entry}\n`
   }
   
  
  return info
}

const selectIPv4Iface = (entry) =>{
    for(const iface of entry){
        if(iface.family === 'IPv4') return iface
    }
    
    return {}
}

const formatNetworkInterfaces = (ifaces) =>{
    let formatted = {}
    
    for(const ifaceName in ifaces){
        const iface = selectIPv4Iface(ifaces[ifaceName])
        formatted[ifaceName] = {
            ip:iface.address,
            cidr:iface.cidr,
            netmask:iface.netmask
        }
    }
    
    return formatted
}

const formatInterfacesInfo = (ifaces) =>{
    let formatted = ``
    
    for(const ifaceName in ifaces){
        const iface = selectIPv4Iface(ifaces[ifaceName])
        
        const ifaceInfo = `[${ifaceName}]: ${iface.address}\n`
        
        formatted = formatted + ifaceInfo
    }
    
    return formatted
}

const formatCPUinfo = (cpus) =>{
    let formatted = ``
    
    for(var cpuIndex=0; cpuIndex < cpus.length; cpuIndex++){
        const cpu = cpus[cpuIndex]
        let entryText = `[CPU ${cpuIndex}]: ${cpu.model}\n`
        formatted = formatted + entryText
    }
    
    return formatted
}

const updateSystemMonitor = (win) =>{
    setInterval(()=>{
        win.webContents.send("system-monitor", formatSystemMonitorInfo())
    }, 5*1000)
}


module.exports = { updateSystemMonitor }

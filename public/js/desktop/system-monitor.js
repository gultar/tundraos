

const drawSystemMonitor = () =>{
    window.ipcRenderer.on("system-monitor", (event, res)=>{
        const content = document.querySelector("#system-monitor-content")
        content.innerText = res
    })
}
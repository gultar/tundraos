let isOpen = false
const launchEditor = (filename, content) =>{
    if(isOpen) return false;

    let editor = false;

    const save = async () =>{
        const filecontent = editor.getValue()
        const edited = await exec("editFile", [filename, filecontent])
    }

    const winbox = new WinBox({ 
        title: "", 
        height:"95%", 
        width:"80%",
        url:"./js/applications/code-editor.html",
    })

    setTimeout(()=>{
        const [ iframe ] = winbox.window.querySelector(".wb-body").childNodes
        
        const iWindow = iframe.contentWindow
        const startEditor = iWindow.startEditor
        const getContent = iWindow.getContent

        iWindow.addEventListener("message", async (event)=>{
            const message = event.data
            if(message.saveContent){
              const filecontent = getContent()
              const saved = await exec("editFile", [filename, filecontent])
              alert(`Saved file ${filename}: ${saved}`)
            }
        })

        startEditor(filename, content)

    }, 500)

}

window.launchEditor = launchEditor

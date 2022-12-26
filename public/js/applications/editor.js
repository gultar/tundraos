let isOpen = false
const launchEditor = (filename, content, dirPointerId) =>{
    if(isOpen) return false;

    isOpen = true

    const save = async (filecontent) =>{
        const fileExists = await exec("getFile", [filename], dirPointerId)
        if(!fileExists) throw new Error(`File ${filename} does not exist`)
        return await exec("editFile", [filename, filecontent], dirPointerId)
    }

    const winbox = new WinBox({ 
        title: "", 
        height:"95%", 
        width:"80%",
        url:"./js/external/notepad.html",
        onclose:()=>{
            isOpen = false
        }
    })

    setTimeout(()=>{
        const [ iframe ] = winbox.window.querySelector(".wb-body").childNodes
        const iWindow = iframe.contentWindow
        const startNotepad = iWindow.startNotepad
        const getContent = iWindow.getContent

        iWindow.addEventListener("message", async (event)=>{
            const message = event.data
            if(message.saveContent){
              const filecontent = getContent()
              const saved = await save(filecontent)
              popup(`Saved file ${filename}: ${saved}`)
            }
        })

        startNotepad(filename, content)

    }, 1000)

}

window.launchEditor = launchEditor

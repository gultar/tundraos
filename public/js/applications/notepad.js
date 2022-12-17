let isOpen = false
const launchNotepad = (filename, content, exists=false) =>{
    if(isOpen) return false;

    let editor = false;

    const save = async (filecontent) =>{
        const fileExists = await exec("getFile", [filename])

        if(!fileExists){
            return await exec("touch", [filename, filecontent])
        }else{
            return await exec("editFile", [filename, filecontent])

        }

    }

    const winbox = new WinBox({ 
        title: "", 
        height:"95%", 
        width:"80%",
        url:"./js/external/notepad.html",//"./pages/editor.html",
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
              alert(`Saved file ${filename}: ${saved}`)
            }
        })

        startNotepad(filename, content)

    }, 1000)

}

window.launchNotepad = launchNotepad

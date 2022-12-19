let history = ["https://www.google.com/webhp?igu=1"]
let current = ""
let currentIndex = 0

const startPageWatcher = (webview) =>{
    // 
    
    setInterval(()=>{
        const webview = document.getElementById('webview')
        
        if(webview.src !== current){
            const url = webview.src
            history.push(url)
            currentIndex = history.length - 1
            current = url
            console.log('History', history)
        }
    }, 3000)
}

const getURL = () =>{
    return document.getElementById('url-bar').value
}

const setURL = (url) => {
    document.getElementById('url-bar').value = url
}

const visit = (url, index="none") =>{
    const webview = document.getElementById('webview')
    console.log('Is electron', window.isElectron)
    if(window.isElectron)
        webview.loadURL(url)
    else
        webview.src = url
    
}

const addNewURL = (url) =>{
    history.push(url)
    currentIndex = history.length - 1
    current = url
    visit(url)
    return true
}


const forward = () =>{
    console.log('Trigger forward', currentIndex)
    const url = history[currentIndex + 1]
    if(!url) return false
    
    currentIndex = currentIndex + 1
    // current = url
    setURL(url)
    visit(url)
}

const back = () =>{
    console.log('Trigger back', currentIndex)
    if(currentIndex == 0) return false
    const url = history[currentIndex - 1]
    currentIndex = currentIndex - 1
    // current = url
    setURL(url)
    visit(url)
}
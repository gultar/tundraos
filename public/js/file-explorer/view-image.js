const viewImage = (file) =>{
    const imagePath = file.path.replace("/public", "")
    
    const imageViewer = new WinBox({ title:"Viewer", html:`
    <img src="${imagePath}" style="height:100%;width:100%;" />
        ` })
}

window.viewImage = viewImage
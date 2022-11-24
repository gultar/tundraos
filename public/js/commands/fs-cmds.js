
const runFileManager = () =>{
  const anchor = document.getElementById("filemanager")
  const temp = anchor.insertAdjacentHTML('beforeEnd', `
  <iframe src="./js-fileexplorer/demo.html"></iframe>
  `)
  new WinBox({ title: "Window Title", height:"100%", width:"100%", mount:temp });
}

const saveState = () =>{
  const exported = FileSystem.export()
  
  return localStorage.setItem("temp-fs", exported)
}



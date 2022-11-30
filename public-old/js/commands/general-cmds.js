function changeBackground(args){
    const value = args[0]
    if(value.substr(0, 4) == "http"){
      $('#page-wrapper').css("background-image", "url("+args[0]+")")
      $('#page-wrapper').css("background-size", "cover")
    }else{
      $('#page-wrapper').css("background-image", "none")
      console.log(value)
      $('#page-wrapper').css("background", value)
    }
}

const saveState = () =>{
  const exported = FileSystem.export()
  
  return localStorage.setItem("temp-fs", exported)
}
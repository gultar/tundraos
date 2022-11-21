function changeBackground(args){
    const value = args[0]
    if(value.substr(0, 4) == "http"){
      $('body').css("background-image", "url("+args[0]+")")
      $('body').css("background-size", "cover")
    }else{
      $('body').css("background-image", "none")
      console.log(value)
      $('body').css("background", value)
    }
}
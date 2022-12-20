function changeBackground(args){
    const value = args[0]
    if(value.substr(0, 4) == "http"){
      $('#page-wrapper').css("background-image", "url("+args[0]+")")
      $('#page-wrapper').css("background-size", "cover")
    }else{
      $('#page-wrapper').css("background-image", "none")
      $('#page-wrapper').css("background", value)
    }
}

function toggleCirculatingWaveEffect(){

  const angle = getComputedStyle(document.documentElement)
  .getPropertyValue('--gradient-angle'); // #999999

  let [ value ] = angle.split('deg')
  

  setInterval(()=>{
    value = value.replace("-","")
    value = parseInt(value)
    if(value > 360 ){
      value = 0
    }else if(value < 360 && value > 0){
      value = value + 1
    }else if(value == 0){
      value = value + 1
    }
    
    value = `-${value}deg`
    console.log('Value of angle', value)
    document.documentElement.style
    .setProperty('--gradient-angle', value);
  }, 1000)
}

function toggleWaveEffect(){
    
    const pageWrapper = document.querySelector('#page-wrapper')
    
    if(pageWrapper.style.animation == ""){
      pageWrapper.style.background = "var(--wave-gradient)"
      pageWrapper.style.backgroundSize = "400% 400%"
      pageWrapper.style.animation = "gradient 120s ease infinite"
    }
    else{
      pageWrapper.style.background = ""
      pageWrapper.style.backgroundSize = ""
      pageWrapper.style.animation = ""
    }


    return true
}

function toggleMouseHaloEffect(){

  const pageWrapper= document.querySelector("html");
  const haloIsActive = document.getElementsByClassName("mouse-halo");
  
  const followMouse = (e) => {
    const { x, y } = pageWrapper.getBoundingClientRect();
    pageWrapper.style.setProperty("--x", e.clientX - x);
    pageWrapper.style.setProperty("--y", e.clientY - y);
    console.log('Screen', x, y)
  }
  
  if(haloIsActive.length > 0){
    pageWrapper.classList.replace("mouse-halo","no-halo");
    pageWrapper.removeEventListener("mousemove", followMouse)
  }else{
    pageWrapper.classList.add("mouse-halo");
    pageWrapper.addEventListener("mousemove", (e)=>followMouse(e));
  }



}

function toggleParticles(){
  if(window.particles){
    window.particles = false;
  }else{
    initParticles()
  }
}

function changeWindowStyle(){

}


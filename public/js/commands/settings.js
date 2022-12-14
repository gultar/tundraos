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

function toggleParticles(){
  if(window.particles){
    window.particles = false;
  }else{
    initParticles()
  }
}

function toggleWaveEffect(){
/**
 * #page-wrapper
 *  background: linear-gradient(-45deg, #2c4f99, #365afc, #414141, #575757);
    background-size: 400% 400%;
    animation: gradient 180s ease infinite;
 */
}

function changeWindowStyle(){

}


window.hyperwatcher = false

const toggleHyperwatch = () =>{
  
  window.hyperwatcher = require('hyperwatch')({
      mini: {
        position: 'bottom right',
        width: 100,
        height: 100,
        fontSize:6,
      }
  });
}

window.toggleHyperwatch = toggleHyperwatch



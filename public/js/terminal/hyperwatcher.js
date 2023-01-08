window.hyperwatcher = false

const toggleHyperwatch = () =>{
  
  window.hyperwatcher = require('hyperwatch')({
      mini: {
        position: 'top right',
        width: 100,
        height: 100,
        fontSize:6,
      }
  });
}



const path = require('path');
const express = require('express')
const helmet = require('helmet')
const cors = require('cors');
const bodyParser = require('body-parser')

const createServer = () =>{
    
  const app = express();
  const port = process.env.PORT || 8000;
  app.use(express.static(__dirname + '/public'));
  app.use(cors())
  app.use(helmet.frameguard())
  app.use(bodyParser.json());       // to support JSON-encoded bodies
  app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
  })); 
  app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/public/index.html'));
  });

  app.listen(port);
    
  console.log('Server started at https://localhost:' + port);
}
module.exports = createServer 
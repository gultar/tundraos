const Directory = require('./directory')

let parenter = {
    set: function(target, prop, value){
      if(typeof value === "object" && prop !== 'contents'){
        let p = new Proxy(new Directory(prop, target), parenter);

        for(key in value){
          p[key] = value[key];
        }
        target[prop] = p
        return target[prop]
      }else{
        target[prop] = value;
      }
    },
}

module.exports = parenter
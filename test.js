
class Directory{
    
    constructor(name, parent){
        this[".."] = parent
        this.name = name
        this.contents = []
    }

}

function stringify(obj, replacer, spaces, cycleReplacer) {
    return JSON.stringify(obj, serializer(replacer, cycleReplacer), spaces)
  }
  
  function serializer(replacer, cycleReplacer) {
    var stack = [], keys = []
  
    if (cycleReplacer == null) cycleReplacer = function(key, value) {
      if (stack[0] === value) return "[Circular ~]"
      return "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
    }
  
    return function(key, value) {
      if(key === '..') return
      if (stack.length > 0) {
        var thisPos = stack.indexOf(this)
        ~thisPos ? stack.splice(thisPos + 1) : stack.push(this)
        ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key)
        if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value)
      }
      else stack.push(value)
  
      return replacer == null ? value : replacer.call(this, key, value)
    }
}

const handler = {
    set: function(target, prop, value){
      if(typeof value === "object" && !Array.isArray(value)){
        let p = new Proxy(new Directory(prop, target), handler);

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

let obj1 = new Proxy({}, handler)
obj1['obj2'] = {

}

obj1.obj2['obj3'] = {}
obj1.obj2.obj3.contents.push({ test:"test" })
console.log(obj1)
obj1.obj2.contents.push({ test:'test' })
const str = stringify(obj1, null, null, ()=>undefined)

let old = JSON.parse(str)

let newObj = new Proxy({}, handler)

for(const prop in old){
    if(typeof old[prop] == 'object'){
        newObj[prop] = old[prop]
    } 
}

console.log(newObj.obj2)


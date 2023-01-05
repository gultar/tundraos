const VirtualFileSystem = require("./virtualfilesystem")
const mockInterface = require("./test/mock-persistance")
const Directory = require("./directory")
const fs = new VirtualFileSystem("test", mockInterface, ".")
const File = require("./file")

const file = new File("rock", "oaiwjdoaiwjdowij", "./rock")
fs.root()["muppet"] = new Directory("muppet", fs.root(), [file])
console.log(fs.root())

console.log(fs.root().muppet)
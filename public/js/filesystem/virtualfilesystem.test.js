
const VirtualFileSystem = require('./virtualfilesystem.js')
const assert = require('assert');
const filesystem = new VirtualFileSystem("test")

filesystem.root().directory = {
  moreDirectory:{
    andMore:{
          andMoreAndMore:{}
      }
  },
}

const runFileSystemTest = () =>{
  
  describe('Virtual File System Validations methods', ()=> {
    const root = filesystem.root()
    describe('root()', ()=> {
      it('Should check whether it gives the root directory', ()=>{
          assert.equal(root.name, "/")
      });
    });
    describe('isRootDir()', ()=> {
      it('Should check whether it equals to root dir', ()=>{
          assert.equal(filesystem.isRootDir(root), true)
      });
    });
    describe('isDir()', ()=> {
      it('Should check whether it is a directory', ()=>{
          assert.equal(filesystem.isDir(root), true)
      });
      it('Should also say if it is a file', ()=>{
        assert.equal(filesystem.isDir(root.directory.contents), false)
    });
    });
  });

  describe("Virtual File System Path Manipulation methods", ()=>{
      describe("splitPathIntoArray()", ()=>{
        it("Should split a path (ex: /path/to/folder into a useable array)", ()=>{
          const pathArray = filesystem.splitPathIntoArray("../../test")
          assert.deepEqual(pathArray, ["..","..","test"])
        })
      })

      describe("splitPathIntoArray()", ()=>{
        it("Should split a path (ex: /path/to/folder into an array)", ()=>{
          const pathArray = filesystem.splitPathIntoArray("../../test")
          assert.deepEqual(pathArray, ["..","..","test"])
        })
      })

      describe("fromPathToArray()", ()=>{
        it("Should split a path (ex: /path/to/folder into an array of useable directory names)", ()=>{
          const pathArray = filesystem.fromPathToArray("../../test")
          assert.deepEqual(pathArray, ["..","..","test"])
        })
      })

      describe("fromArrayToPath()", ()=>{
        it("Should join directory names into a readable path", ()=>{
          const pathArray = filesystem.fromArrayToPath(["..","..","test"])
          assert.deepEqual(pathArray, "../../test")
        })
      })


  })

  describe("Virtual File System Bash Command methods", ()=>{
    afterEach(function(done) {
      filesystem.cd("/")
      done()
    });

    describe("pwd()", ()=>{
      it("Should display the full path from root to current directory", ()=>{
        filesystem.workingDir = filesystem.root().directory.moreDirectory.andMore.andMoreAndMore
        const path = filesystem.pwd()
        assert.equal(path, "/directory/moreDirectory/andMore/andMoreAndMore")
        filesystem.cd("/")
      })
    })

    describe("ls()", ()=>{
      it("Should output the entire content of the directory", ()=>{
        const contents = filesystem.ls("directory")
        assert.deepEqual(contents, [ "..",'moreDirectory/' ])
      })

      it("Should output content of current directory on empty path", ()=>{
        const contents = filesystem.ls()
        assert.deepEqual(contents, filesystem.wd().getContentNames())
      })
    })

    describe("cd()", ()=>{
      it("Should change current working directory to next directory", ()=>{
        filesystem.cd("directory")
        assert.equal(filesystem.workingDir.name, "directory")
        filesystem.cd("/")
      })

      it("Should change current working directory to remote directory a few levels down", ()=>{
        filesystem.cd("directory/moreDirectory/andMore")
        assert.equal(filesystem.workingDir.name, "andMore")
        filesystem.cd("/")
      })

      it("Should change to parent directory", ()=>{
        filesystem.cd("directory/moreDirectory/andMore")
        const parentDirName = filesystem.wd().parent().name
        filesystem.cd("..")
        assert.equal(filesystem.wd().name, parentDirName)
      })

      it("Should change to root upon path '/'", ()=>{
        filesystem.cd("/")
        assert.equal(filesystem.wd().name, '/')
      })
    })

    describe("mkdir()", ()=>{
      it("Should create a new directory", ()=>{
        const isCreated = filesystem.mkdir("newDir")
        assert.equal(isCreated, true)
      })
      it("New directory should point to parent directory", ()=>{
        const newDir = filesystem.workingDir.newDir
        assert.equal(newDir.parent().name, "/")
      })
      it("Should create a new directory in child directory", ()=>{
        filesystem.cd("home")
        const isCreated = filesystem.mkdir("../directory/anotherDir")
        assert.equal(isCreated, true)
        const anotherDir = filesystem.wd().parent().directory.anotherDir
        assert.equal(anotherDir !== undefined, true)
        assert.equal(anotherDir.name, "anotherDir")
        filesystem.cd("/")
      })

      it("Should create a new directory in parent directory", ()=>{
        const isCreated = filesystem.mkdir("newDir/moreNewDir")
        assert.equal(isCreated, true)
        const newDir = filesystem.wd().newDir
        assert.equal(newDir.moreNewDir !== undefined, true)
        assert.equal(newDir.moreNewDir.name, "moreNewDir")
      })
    })

    describe("touch()", ()=>{
      it("Should create a new file", ()=>{
        const isCreated = filesystem.touch("test.json")
        assert.equal(isCreated, true)
        const testJson = filesystem.wd().getFile("test.json")
        assert(testJson !== undefined, true)
        assert(testJson.name, "test.json")
      })
      it("Should create a new file in child directory", ()=>{
        const isCreated = filesystem.touch("directory/anotherFile.json")
        assert.equal(isCreated, true)
        const anotherJson = filesystem.wd().directory.getFile("anotherFile.json")
        assert(anotherJson !== undefined, true)
        assert(anotherJson.name, "anotherFile.json")
      })
      it("Should create a new file in parent directory", ()=>{
        filesystem.cd("home")
        const isCreated = filesystem.touch("../parentFile.json")
        assert.equal(isCreated, true)
        const parentFileJson = filesystem.wd().parent().getFile("parentFile.json")
        assert.equal(parentFileJson !== undefined, true)
        assert.equal(parentFileJson.name, "parentFile.json")
        filesystem.cd("/")
        
      })
      
    })

    describe("cp()", ()=>{
      it("Should copy a file", ()=>{
        const isCreated = filesystem.touch("/home/toCopy.json")
        
        const isCopied = filesystem.cp("home/toCopy.json", "directory/copied.json")
      })
      
    })

    describe("rmdir()", ()=>{
      it("Should remove directory within working directory", ()=>{
        filesystem.mkdir("toBeRemoved")
        assert.equal(filesystem.wd().hasDir("toBeRemoved"), true)

        filesystem.rmdir("toBeRemoved")
        assert.equal(filesystem.wd().hasDir("toBeRemoved"), false)
      })

      it("Should remove directory within child directory", ()=>{
        filesystem.mkdir("toBeRemoved")
        assert.equal(filesystem.wd().hasDir("toBeRemoved"), true)

        filesystem.mkdir("toBeRemoved/newDirToBeRemoved")
        assert.equal(filesystem.wd().toBeRemoved.hasDir("newDirToBeRemoved"), true)

        filesystem.rmdir("toBeRemoved/newDirToBeRemoved")
        assert.equal(filesystem.wd().toBeRemoved.hasDir("newDirToBeRemoved"), false)
        
      })

      it("Should remove directory within parent directory", ()=>{
        filesystem.cd("home")
        assert.equal(filesystem.wd().parent().hasDir("toBeRemoved"), true)

        filesystem.rmdir("../toBeRemoved")
        assert.equal(filesystem.wd().parent().hasDir("toBeRemoved"), false)
        
      })
    })

    describe("rm()", ()=>{
      it("Should remove file within working directory", ()=>{
        filesystem.touch("filetobe.removed")
        assert.equal(filesystem.wd().hasFile("filetobe.removed"), true)
        filesystem.rm("filetobe.removed")
        assert.equal(filesystem.wd().hasFile("filetobe.removed"), false)
      })

      it("Should remove file within child directory", ()=>{
        filesystem.cd("/")
        filesystem.mkdir("toBeRemoved")
        assert.equal(filesystem.wd().hasDir("toBeRemoved"), true)

        filesystem.touch("toBeRemoved/filetobe.removed")
        assert.equal(filesystem.wd().toBeRemoved.hasFile("filetobe.removed"), true)

        filesystem.rm("toBeRemoved/filetobe.removed")
        // assert.equal(filesystem.wd().toBeRemoved.hasDir("filetobe.removed"), false)
        
      })

      it("Should remove file within parent directory", ()=>{
        filesystem.cd("/")
        filesystem.touch("toBeRemoved/filetobe.removed")
        assert.equal(filesystem.wd().toBeRemoved.hasFile("filetobe.removed"), true)

        filesystem.cd("home")
        assert.equal(filesystem.wd().parent().hasDir("toBeRemoved"), true)
        assert.equal(filesystem.wd().parent().toBeRemoved.hasFile("filetobe.removed"), true)

        filesystem.rm("../toBeRemoved/filetobe.removed")
        assert.equal(filesystem.wd().parent().toBeRemoved.hasFile("filetobe.removed"), false)
        
      })
    })

    describe("cat()", ()=>{
      it("Should output file content", ()=>{
        filesystem.cd("/")
        filesystem.touch("smallfile")
        const file = filesystem.wd().getFile("smallfile")
        file.content = "This is a file"
        assert.equal(filesystem.cat("smallfile"), "This is a file")
      })

      it("Should output content of file in child directory", ()=>{
        filesystem.cd("/")
        filesystem.touch("home/bigfile")
        filesystem.wd().home.getFile("bigfile").content = "This is a biiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiig file" 
        assert.equal(filesystem.cat("home/bigfile"), "This is a biiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiig file")
      })

      it("Should output content of file in parent directory", ()=>{
        filesystem.cd("/home")
        assert.equal(filesystem.cat("../smallfile"), "This is a file")
      })
    })
  })

  describe("Search and complete functions", ()=>{
    describe("autoCompletePath()", ()=>{
      it("Should autocomplete in current directory", ()=>{
        filesystem.cd("/")
        filesystem.touch("afile")
        const found = filesystem.autoCompletePath("af")
        assert.deepEqual(found, [ 'afile' ])
      })
      it("Should autocomplete in child directory", ()=>{
        filesystem.cd("/")
        filesystem.touch("directory/anotherDir/myfile")
        filesystem.touch("directory/anotherDir/myOtherFile")
        const found = filesystem.autoCompletePath("directory/anotherDir/m")
        assert.deepEqual(found, [ 'myfile', 'myOtherFile' ])
      })
      it("Should autocomplete in parent directory", ()=>{
        filesystem.cd("/")
        filesystem.cd("home")
        const found = filesystem.autoCompletePath("../directory/anotherDir/m")
        assert.deepEqual(found, [ 'myfile', 'myOtherFile' ])
      })
    })
  })

}

module.exports = runFileSystemTest
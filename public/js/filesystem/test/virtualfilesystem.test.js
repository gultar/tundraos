

const assert = require('assert');
const Directory = require('../directory.js');
const VirtualFileSystem = require('../virtualfilesystem.js')
const persistanceInterface = require("./mock-persistance")

const filesystem = new VirtualFileSystem("guest", persistanceInterface, ".")
const structure = {
  directory:{
    moreDirectory:{
      andMore:{
        andMoreAndMore:{}
      }
    }
  }
}
filesystem.root()
filesystem.import(structure)




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
    describe('isDir()',()=> {
      it('Should check whether it is a directory', async  ()=>{
          assert.equal(await filesystem.isDir(root), true)
      });
      it('Should also say if it is a file',  async ()=>{
        assert.equal(await filesystem.isDir(root.directory.contents), false)
    });
    });
  });

  describe("Virtual File System Path Manipulation methods", ()=>{
      // describe("splitPathIntoArray()", ()=>{
      //   it("Should split a path (ex: /path/to/folder into a useable array)", ()=>{
      //     const pathArray = filesystem.splitPathIntoArray("../../test")
      //     assert.deepEqual(pathArray, ["..","..","test"])
      //   })
      // })

      // describe("splitPathIntoArray()", ()=>{
      //   it("Should split a path (ex: /path/to/folder into an array)", ()=>{
      //     const pathArray = filesystem.splitPathIntoArray("../../test")
      //     assert.deepEqual(pathArray, ["..","..","test"])
      //   })
      // })

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
      it("Should display the full path from root to current directory", async ()=>{
        filesystem.cd("/")
        await filesystem.cd("/directory/moreDirectory/andMore/andMoreAndMore")
        const path = await filesystem.pwd()
        assert.equal(path, "/directory/moreDirectory/andMore/andMoreAndMore")
        filesystem.cd("/")
      })
    })

    describe("ls()", ()=>{
      it("Should output the entire content of the directory", async ()=>{
        filesystem.cd("/")
        const contents = await filesystem.ls("directory")
        assert.deepEqual(contents, [ "..",'moreDirectory/' ])
      })

      it("Should output content of current directory on empty path", async ()=>{
        const contents = await filesystem.ls()
        assert.deepEqual(contents, filesystem.wd().getContentNames())
      })
    })

    describe("cd()", ()=>{
      it("Should change current working directory to next directory", async ()=>{
        await filesystem.cd("directory")
        assert.equal(filesystem.wd().name, "directory")
      })

      it("Should change current working directory to remote directory a few levels down", async ()=>{
        filesystem.cd("directory/moreDirectory/andMore")
        assert.equal(filesystem.wd().name, "andMore")
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
      it("Should create a new directory", async ()=>{
        
        const isCreated = await filesystem.mkdir("newDir")
        assert.equal(isCreated, true)
      })
      it("New directory should point to parent directory", ()=>{
        const newDir = filesystem.wd().newDir
        assert.equal(newDir.parent().name, "/")
      })
      it("Should create a new directory in child directory", async ()=>{
        filesystem.cd("home")
        
        const isCreated = await filesystem.mkdir("../directory/anotherDir")
        assert.equal(isCreated, true)
        const anotherDir = filesystem.wd().parent().directory.anotherDir
        assert.equal(anotherDir !== undefined, true)
        assert.equal(anotherDir.name, "anotherDir")
        filesystem.cd("/")
      })

      it("Should create a new directory in parent directory", async ()=>{
        const isCreated = await filesystem.mkdir("newDir/moreNewDir")
        assert.equal(isCreated, true)
        const newDir = filesystem.wd().newDir
        assert.equal(newDir.moreNewDir !== undefined, true)
        assert.equal(newDir.moreNewDir.name, "moreNewDir")
      })
    })

    describe("touch()", ()=>{
      it("Should create a new file", async ()=>{
        const isCreated = await filesystem.touch("test.json")
        assert.equal(isCreated, true)
        const testJson = filesystem.wd().getFile("test.json")
        assert(testJson !== undefined, true)
        assert(testJson.name, "test.json")
      })
      it("Should create a new file in child directory", async ()=>{
        const isCreated = await filesystem.touch("directory/anotherFile.json")
        assert.equal(isCreated, true)
        const anotherJson = filesystem.wd().directory.getFile("anotherFile.json")
        assert.equal(anotherJson !== undefined, true)
        assert.equal(anotherJson.name, "anotherFile.json")
      })
      it("Should create a new file in parent directory", async()=>{
        filesystem.cd("home")
        const isCreated = await filesystem.touch("../parentFile.json")
        assert.equal(isCreated, true)
        const parentFileJson = filesystem.wd().parent().getFile("parentFile.json")
        assert.equal(parentFileJson !== undefined, true)
        assert.equal(parentFileJson.name, "parentFile.json")
        filesystem.cd("/")
        
      })
      
    })

    describe("cp()", ()=>{
      it("Should copy a file", async ()=>{
        const isCreated = await filesystem.touch("/home/toCopy.json")
        
        const isCopied = await filesystem.cp("home/toCopy.json", "directory/copied.json")
      })
      
    })

    describe("rmdir()", ()=>{
      it("Should remove directory within working directory", async ()=>{
        await filesystem.mkdir("toBeRemoved")
        assert.equal(filesystem.wd().hasDir("toBeRemoved"), true)

        await filesystem.rmdir("toBeRemoved")
        assert.equal(filesystem.wd().hasDir("toBeRemoved"), false)
      })

      it("Should remove directory within child directory", async()=>{
        await filesystem.mkdir("toBeRemoved")
        assert.equal(filesystem.wd().hasDir("toBeRemoved"), true)

        await filesystem.mkdir("toBeRemoved/newDirToBeRemoved")
        assert.equal(filesystem.wd().toBeRemoved.hasDir("newDirToBeRemoved"), true)

        await filesystem.rmdir("toBeRemoved/newDirToBeRemoved")
        assert.equal(filesystem.wd().toBeRemoved.hasDir("newDirToBeRemoved"), false)
        
      })

      it("Should remove directory within parent directory", async ()=>{
        filesystem.cd("home")
        assert.equal(filesystem.wd().parent().hasDir("toBeRemoved"), true)

        await filesystem.rmdir("../toBeRemoved")
        assert.equal(filesystem.wd().parent().hasDir("toBeRemoved"), false)
        
      })
    })

    describe("rm()", ()=>{
      it("Should remove file within working directory", async ()=>{
        await filesystem.touch("filetobe.removed")
        assert.equal(filesystem.wd().hasFile("filetobe.removed"), true)
        await filesystem.rm("filetobe.removed")
        assert.equal(filesystem.wd().hasFile("filetobe.removed"), false)
      })

      it("Should remove file within child directory", async()=>{
        filesystem.cd("/")
        await filesystem.mkdir("toBeRemoved")
        assert.equal(filesystem.wd().hasDir("toBeRemoved"), true)

        await filesystem.touch("toBeRemoved/filetobe.removed")
        assert.equal(filesystem.wd().toBeRemoved.hasFile("filetobe.removed"), true)

        await filesystem.rm("toBeRemoved/filetobe.removed")
        // assert.equal(filesystem.wd().toBeRemoved.hasDir("filetobe.removed"), false)
        
      })

      it("Should remove file within parent directory", async()=>{
        filesystem.cd("/")
        await filesystem.touch("toBeRemoved/filetobe.removed")
        assert.equal(filesystem.wd().toBeRemoved.hasFile("filetobe.removed"), true)

        filesystem.cd("home")
        assert.equal(filesystem.wd().parent().hasDir("toBeRemoved"), true)
        assert.equal(filesystem.wd().parent().toBeRemoved.hasFile("filetobe.removed"), true)

        await filesystem.rm("../toBeRemoved/filetobe.removed")
        assert.equal(filesystem.wd().parent().toBeRemoved.hasFile("filetobe.removed"), false)
        
      })
    })

    describe("cat()", ()=>{
      it("Should output file content", async()=>{
        filesystem.cd("/")
        await filesystem.touch("smallfile","This is a file")
        assert.equal(await filesystem.cat("smallfile"), "This is a file")
      })

      it("Should output content of file in child directory", async()=>{
        filesystem.cd("/")
        await filesystem.touch("directory/bigfile","This is a biiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiig file")
        assert.equal(await filesystem.cat("directory/bigfile"), "This is a biiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiig file")
      })

      it("Should output content of file in parent directory", async ()=>{
        filesystem.cd("/directory")
        assert.equal(await filesystem.cat("../smallfile"), "This is a file")
      })
    })
  })

  describe("Search and complete functions", ()=>{
    describe("autoCompletePath()", async()=>{
      it("Should autocomplete in current directory", async ()=>{
        filesystem.cd("/")
        await filesystem.touch("afile")
        const found = await filesystem.autoCompletePath("af")
        assert.deepEqual(found, [ 'afile' ])
      })
      it("Should autocomplete in child directory", async ()=>{
        filesystem.cd("/")
        await filesystem.touch("directory/anotherDir/myfile")
        await filesystem.touch("directory/anotherDir/myOtherFile")
        const found = await filesystem.autoCompletePath("directory/anotherDir/m")
        assert.deepEqual(found, [ 'myfile', 'myOtherFile' ])
      })
      it("Should autocomplete in parent directory", async ()=>{
        filesystem.cd("/")
        filesystem.cd("home")
        const found = await filesystem.autoCompletePath("../directory/anotherDir/m")
        assert.deepEqual(found, [ 'myfile', 'myOtherFile' ])
      })
    })
  })

}

module.exports = runFileSystemTest
const openFileManager = () =>{
    const filemanagerElem = document.getElementById("filemanager")
    const filesystem = new VirtualFileSystem("virtual")
    const initialPath = filesystem.pwd()
    const getDirnames = (directory) =>{
    const props = Object.keys(directory)
    const thisDirectoryProperties = [
            "..",
            "name",
            "files",
            "permissions",
            "id",
            "type"
        ]
        const dirnames = props.filter(prop =>{
            const isObject = typeof directory[prop] == 'object'
            const isDirectoryProp = thisDirectoryProperties.includes(prop)
            if(isDirectoryProp == false && isObject == true){
                return prop
            }
                
        })
        return dirnames
    }

    const getDirs = (directory) =>{
        const dirnames = getDirnames(directory)
        const dirs = []
        const headers = []
        for(const dirname of dirnames){
            const child = directory[dirname]
            dirs.push({ name:child.name, type:"folder", id:child.name })
        }
        dirs.unshift({ name:"..", type:"folder", id:".." })
        return dirs
    }

    const getCurrentDirectories = () =>{
        return getDirs(filesystem.wd())
    }
    let clicked = false
    let options = {
        group: 'demo_test_group',

        capturebrowser: true,

        initpath: [
            [ initialPath, 'Projects (/)', { canmodify: false } ],
        ],
        onfocus:(e)=>{
            if(e.target.innerText == ".."){

                if(filesystem.wd().name == "/"){
                    console.log('Cannot go back')
                    return
                }

                if(clicked){
                    filesystem.cd("..")
                    fe.NavigateUp()
                    clicked = false
                }else{
                    clicked = true
                }
            }else{
                filesystem.cd(e.target.innerText)
            }
            // document.dispatchEvent(event)
        },

        onrefresh:(folder, required)=>{
            folder.SetEntries(getCurrentDirectories());
        }
    }

    var fe = new FileExplorer(filemanagerElem, options);
    console.log(Object.keys(fe))
    new WinBox({ title:"File Explorer", mount:filemanagerElem })
}
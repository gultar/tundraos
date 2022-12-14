let isOpen = false
const launchEditor = (content, filename) =>{
    if(isOpen) return false;

    const editorDOM = `<title>ACE in Action</title>
    <style type="text/css" media="screen">
        #editor { 
            position: absolute;
            top: 30px;
            right: 0;
            bottom: 0;
            left: 0;
        }

        .file-menu {
            z-index:9;
        }
    </style>
    <script src="../editor/ace.js" type="text/javascript" charset="utf-8"></script>
    </head>
    <body>
        <div class="wrapper">
            <nav class="file-menu" role="navigation">
                <ul class="menu-item-list">
                    <li class="menu-item"><a href="#">File</a>
                    <ul class="dropdown">
                        <li onclick="window.postMessage({ save:true })" class="dropdown-item hoverable"><a href="#">Save</a></li>
                        <li class="dropdown-item hoverable"><a href="#">Exit</a></li>
                    </ul>
                    </li>
                </ul>
            </nav>
            <div id="editor"><xmp>${content}</xmp></div>
        </div>
    </body>
    </html>`

    let editor = false;

    window.addEventListener("message", async ()=>{
        await save()
    })

    const save = async () =>{
        const filecontent = editor.getValue()
        const edited = await exec("editFile", [filename, filecontent])
    }
    const editorElement = document.getElementById("editor-element")
    new WinBox({ 
        title: "", 
        height:"95%", 
        width:"80%",
        html:editorDOM,
        oncreate:()=>{
            
            isOpen = true
            // ace.config.setModuleUrl("ace/theme/textmate", "./editor/theme-textmate.js");
            editor = ace.edit("editor");
            editor.setTheme("ace/theme/monokai");
            editor.session.setMode("ace/mode/javascript");
            editor.commands.addCommand({
                name: 'save',
                bindKey: {win: 'Ctrl-S',  mac: 'Command-M'},
                exec: async function(editor) {
                    await save()
                },
            });

        },
        onclose:()=>{
            
            isOpen = false
        }
    });

}
/***/
const makeDesktopMenu = () =>{
    new VanillaContextMenu({
        scope: document.querySelector('#page-wrapper'),
        customThemeClass: 'context-menu-orange-theme',
        customClass: 'custom-context-menu-cls',
        menuItems: [{ 
              label: 'Go to Desktop',
              iconHTML: `<img src="./images/icons/home.png" height="20px" width="20px"></i>`,
              callback: () => minimizeAllWindows("force")
            },{ 
                label: 'Open Terminal',
                iconHTML: `<img src="./images/icons/console.png" height="20px" width="20px"></i>`,
                callback: (e) => new TerminalWindow(e.pageX/2, e.pageY/2)
            },{
                label: 'Open Browser',
                iconHTML: `<img src="./images/icons/browser.png" height="20px" width="20px"></i>`, 
                callback: ()=>new Browser(),
            },{ 
                label: 'Open Explorer', 
                iconHTML: `<img src="./images/icons/file-explorer.png" height="20px" width="20px"></i>`,
                callback: (e)=>new FileExplorer(), 
            },
            'hr',
            { 
                label: 'Applications', 
                iconHTML: `<img src="./images/icons/internet.png" height="20px" width="20px"></i>`,
                preventCloseOnClick:true,
                nestedMenu:[{
                        label: 'Browser',
                        iconHTML: `<img src="./images/icons/browser.png" height="20px" width="20px"></i>`, 
                        callback: ()=>new Browser(),
                    },{
                        label: 'Rich Text Editor',
                        iconHTML: `<img src="./images/icons/quill.png" height="20px" width="20px"></i>`, 
                        callback: ()=> new RichTextEditor(),
                    },{
                        label: 'Markdown Editor',
                        iconHTML: `<img src="./images/icons/markdown.png" height="20px" width="20px"></i>`, 
                        callback: ()=>new MarkdownEditor(),
                    },{
                        label: 'Editor',
                        iconHTML: `<img src="./images/icons/editor.png" height="20px" width="20px"></i>`, 
                        callback: ()=>new Editor(),
                    },{
                        label: 'Diablo',
                        iconHTML: `<img src="./images/diablo.png" height="20px" width="20px"></i>`,
                        callback:()=>runWeb(['https://d07riv.github.io/diabloweb/'])
                    }
                ]
            },
            { 
                label: 'System', 
                iconHTML: `<img src="./images/icons/system.png" height="20px" width="20px"></i>`,
                preventCloseOnClick:true,
                nestedMenu:[
                    {
                        label: 'Logout',
                        iconHTML: `<img src="./images/icons/system.png" height="20px" width="20px"></i>`, 
                        callback: ()=>{
                            logout()
                        },
                    },
                    {
                        label: 'Shutdown',
                        iconHTML: `<img src="./images/icons/system.png" height="20px" width="20px"></i>`,
                        callback:()=>{
                            shutdown()
                        }
                    }
                ]
            },
        ],
    })
}

let audioMenuOpened = false
const makeAudioMenu = (x, y) =>{
    let audioMenu = {}
    if(!audioMenuOpened){
        audioMenu = new WinBox({
            class: [ "no-min", "no-max", "no-full", "no-resize", "no-move" ],
            height:80,
            width:200,
            y:30,
            x:x-80,
            onclose:()=>{
                audioMenuOpened = false
                audioMenu = {}
            },
            mount:document.querySelector("#volume-menu")
        //     html:`
        // <div id="volume-menu">
        //     <span>Volume:</span>
        //     <input id="volume-slider" type="range" min="0" max="100" value="0">    
        // </div>`
        })
        audioMenuOpened = true
    }else{
        audioMenu.focus()
    }
}

const createDesktopMenu = () =>{
    $.contextMenu({
        selector: '#page-wrapper', 
        callback: function(key, options) {
            if(key == 'Go to Desktop') minimizeAllWindows("force")
            else if(key == 'Terminal') createTerminalWindow(0,0)
            else if(key == 'Explorer') new FileExplorer()
            else if(key == 'Browser') runWeb()
            else if(key == 'Editor') new Editor()
            else if(key == 'Markdown Editor') new MarkdownEditor()
            else if(key == "Rich Text Editor") new RichTextEditor()
            else if(key == 'Logout') logout()
            else if(key == 'Reboot') reboot()
            else if(key == 'Shutdown') shutdown()
        },   
        items: {
            "Go to Desktop": {name: "Go to Desktop", icon: 'fa-edit'},
            "Terminal": {name: "Terminal", icon: "fa-regular fa-window"},
            'Explorer': {name: "Explorer", icon: "explorer"},
            "sep1": "<hr>",
            "Applications": {
                name: "Applications",
                icon:"applications",
                items: {
                    "Browser": { name: "Browser", icon:"fa-window"},
                    "Editor": { name: "Editor", icon:"codeeditor"},
                    "Rich Text Editor": { name: "Rich Text Editor", icon:"texteditor" },
                    "Markdown Editor": { name: "Markdown Editor", icon:"markdowneditor" },
                }
            },
            "System": {
                name: "System",
                icon:"system",
                items: {
                    "Logout": { name: "Logout", icon:"system"},
                    "Reboot": { name: "Reboot", icon:"system"},
                    "Shutdown": { name: "Shutdown", icon:"system" },
                }
            }
        }
    });
}




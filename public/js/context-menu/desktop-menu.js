

const makeDesktopMenu = () =>{
    console.log(new VanillaContextMenu({
        scope: document.querySelector('#page-wrapper'),
        menuItems: [
            { 
              label: 'Go to Desktop',
              iconHTML: `<img src="./images/icons/home.png" height="20px" width="20px"></i>`,
              callback: () => {
                minimizeAllWindows("force")
            }},
            { 
                label: 'Open Terminal',
                iconHTML: `<img src="./images/icons/console.png" height="20px" width="20px"></i>`,
                callback: (e) => {
                    createTerminalWindow(e.pageX/2, e.pageY/2)
                }
            },
            { 
                label: 'Open Explorer', 
                iconHTML: `<img src="./images/icons/file-explorer.png" height="20px" width="20px"></i>`,
                callback: ()=>{
                    makeFileExplorer()
                }, 
            },
            'hr',
            { 
                label: 'Application', 
                iconHTML: `<img src="./images/icons/internet.png" height="20px" width="20px"></i>`,
                preventCloseOnClick:true,
                nestedMenu:[
                    {
                        label: 'Browser',
                        iconHTML: `<img src="./images/icons/browser.png" height="20px" width="20px"></i>`, 
                        callback: ()=>{
                            runWeb()
                        },
                    },
                    {
                        label: 'Diablo',
                        iconHTML: `<img src="./images/diablo.png" height="20px" width="20px"></i>`,
                        callback:()=>{
                            runWeb(['https://d07riv.github.io/diabloweb/'])
                        }
                    }
                ]
            },
        ],
    }))
}

const makeCustomMenu = (opts={}) =>{
    new VanillaContextMenu({
        ...opts
    });
}


const makeDesktopMenu = () =>{
    let that = new VanillaContextMenu({
        scope: document.querySelector('#page-wrapper'),
        menuItems: [
            { label: 'Go to Desktop', callback: () => {
                minimizeAllWindows()
            }},
            { 
                label: 'Open Terminal', callback: (e) => {
                    createTerminalWindow(e.pageX/2, e.pageY/2)
                }
            },
            { 
                label: 'Open Explorer', callback: ()=>{
                    makeFileExplorer()
                }, 
            },
            'hr',
            { 
                label: 'Application', 
                preventCloseOnClick:true,
                nestedMenu:[
                    {
                        label: 'Browser', callback: ()=>{
                            runWeb()
                        },
                    },
                    {
                        label: 'Diablo I', callback:()=>{
                            runWeb(['https://d07riv.github.io/diabloweb/'])
                        }
                    }
                ]
            },
        ],
    });
}

const makeCustomMenu = (opts={}) =>{
    /**scope: document.querySelector('#page-wrapper'),
        menuItems: [
            { label: 'Go to Desktop', callback: () => {
                minimizeAllWindows()
            }},
            'hr',
            { label: 'Open Terminal', callback: (e) => {
                createTerminalWindow(e.pageX/2, e.pageY/2)
            }},
            { label: 'Open Explorer', callback: ()=>{
                makeFileExplorer()
            }, },
        ], */
    new VanillaContextMenu({
        ...opts
    });
}
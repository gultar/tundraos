

class Editor{
    constructor(){
        this.editorDOM = this.createDOM()
        this.editorId = Date.now()

    }

    init(){}

    createDOM(){
        return `
        <div id="editor-wrapper-${this.editorId}" class="wrapper">
            <div style="display:block;">
                <nav class="file-menu" role="navigation">
                    <ul class="menu-item-list">
                        <li class="menu-item"><a>File</a>
                            <ul class="dropdown">
                                <li onclick="save()" class="dropdown-item hoverable"><a>Save</a></li>
                                <li class="dropdown-item hoverable"><a>Exit</a></li>
                            </ul>
                        </li>
                    </ul>
                </nav>
            </div>
            <div id="editor-${this.editorId}" style="margin-top:10px;">
                
            </div>
        </div>
        `
    }

    exec(){}

    start(){}

    save(){}
}
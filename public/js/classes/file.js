class File{
    constructor(name="", content="", path=""){
        this.name = name
        this.content = content
        this.path = path
    }

    setContent(content){
        this.content = content
    }

    getContent(){
        return this.content
    }
}

module.exports = File
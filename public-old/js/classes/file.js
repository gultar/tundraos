class File{
    constructor(name="", content=""){
        this.name = name
        this.content = content
    }

    setContent(content){
        this.content = content
    }

    getContent(){
        return this.content
    }
}

module.exports = File
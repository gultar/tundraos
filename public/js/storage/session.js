class Storage extends Map{
    constructor({ persist="" }){
        super()
        this.storage = (persist? localStorage : sessionStorage)
    }
    set(id, value){
        if(typeof value === 'object') value = JSON.stringify(value)
        this.storage.setItem(id, value)
    }
    
    get(id){
        const value = this.storage.getItem(id)
        try{
            return JSON.parse(value)
        }catch(e){
            return value
        }
    }
}
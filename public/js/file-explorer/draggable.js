const dragstart = (ev) =>{
    console.log('Start Drag', ev)
    ev.dataTransfer.setData("text/plain", ev.target.id);
}

const drop = (e) =>{
    console.log('Drop', e)
}

const dragover = (e) =>{
    console.log('Drag over')
    e.preventDefault()
}

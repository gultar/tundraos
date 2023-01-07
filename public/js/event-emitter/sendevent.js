const sendEvent = (type, payload) =>{
    const newEvent = new CustomEvent(type, { detail:payload })
    window.dispatchEvent(newEvent)
}

window.sendEvent = sendEvent
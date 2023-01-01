const sendEvent = (type, payload) =>{
    console.log("Sent event", type)
    const newEvent = new CustomEvent(type, { detail:payload })
    window.dispatchEvent(newEvent)
}

window.sendEvent = sendEvent
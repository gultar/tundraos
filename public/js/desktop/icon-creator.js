

const createIcon = (opts) =>{
    const iconContainer = document.querySelector('#icon-container')
    const name = opts.name
    const functionName = opts.functionToRun
    const iconImagePath = opts.iconImagePath || "./images/icons/browser-color-large.png"
    const iconDOM = opts.iconDOM || `
<a class="desktop-icon-link" onclick="select(this, (()=>{${functionName}}))" id="${name}-icon">
    <img class="desktop-icon" src="${iconImagePath}">
    <span>${name}</span>
</a>`

    iconContainer.innerHTML = iconContainer.innerHTML + iconDOM
}

window.createIcon

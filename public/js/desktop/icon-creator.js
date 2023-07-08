

const createIcon = (opts) =>{
    const iconContainer = document.querySelector('#icon-container')
    const name = opts.name
    const functionToRun = opts.functionToRun
    const iconImagePath = opts.iconImagePath || "./images/icons/browser-color-large.png"
    const iconDOM = opts.iconDOM || `
<a data-name="${name}-icon" class="desktop-icon-link" onclick="select(this, (()=>{${functionToRun}}))" id="${name}-icon">
    <img class="desktop-icon" src="${iconImagePath}">
    <span>${name}</span>
</a>`

    iconContainer.innerHTML = iconContainer.innerHTML + iconDOM
}

const createDesktopGrid = ()=>{
    const iconContainer = document.querySelector('#icon-container')
    for(var i=0; i < 120; i++){
        iconContainer.innerHTML = iconContainer.innerHTML + `<div class="desktop-icon" style="background:green"></div>`
    }
    
}

const saveIconState = () =>{
    const iconContainer = document.querySelector('#icon-container')
    
    localStorage.setItem('desktopIcons',iconContainer.innerHTML)
}

const loadIconState = () =>{
    const desktopIconsHTML = localStorage.getItem('desktopIcons')
    const iconContainer = document.querySelector('#icon-container')
    
   if(desktopIconsHTML !== null) iconContainer.innerHTML = desktopIconsHTML
}


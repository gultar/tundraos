

const createIcon = (opts) =>{
    const iconContainer = document.querySelector('#icon-container')
    const name = opts.name
    const functionName = opts.functionToRun
    const iconImagePath = opts.iconImagePath || "./images/icons/browser-color-large.png"
    const iconDOM = opts.iconDOM || `
<a data-name="${name}-icon" class="desktop-icon-link" onclick="select(this, (()=>{${functionName}}))" id="${name}-icon">
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
    const children = iconContainer.children
    const desktopIcons = {}
    for(const child of children){
        const name = child.dataset.name
        const { left, top } = $(child).position()
        console.log(name)
        console.log(left, top)
        desktopIcons[name] = {
            top:top,
            left:left,
        }
    }
    localStorage.setItem('desktopIcons',JSON.stringify(desktopIcons))
}

const loadIconState = () =>{
    const desktopIconsString = localStorage.getItem('desktopIcons')
    const desktopIcons = JSON.parse(desktopIconsString)
    
    for(const iconName in desktopIcons){
        
        const icon = desktopIcons[iconName]
        const iconElement = document.getElementById(iconName)

        iconElement.style.left = icon.left
        iconElement.style.top = icon.top
        
    }
}


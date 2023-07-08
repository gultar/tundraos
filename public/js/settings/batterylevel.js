const setBatteryIcon = (level) =>{
    const batteryIcon = document.querySelector("#battery-icon")
    if(level <= 0.10){
        batteryIcon.src = "./images/icons/battery-danger.png"
    }else if(level > 0.10 && level <= 0.25){
        batteryIcon.src = "./images/icons/battery-low.png"
    }else if(level > 0.25 && level <= 0.50){
        batteryIcon.src = "./images/icons/battery-quarter.png"
    }else if(level > 0.50 && level <= 0.75){
        batteryIcon.src = "./images/icons/battery-half.png"
    }else if(level > 0.75 && level <= 0.85){
        batteryIcon.src = "./images/icons/battery-three-quarters.png"
    }else if(level > 0.85 && level <= 0.99){
        batteryIcon.src = "./images/icons/battery-full.png"
    }
    
}

const setBatteryLevel = async () =>{
    const batteryIcon = document.querySelector("#battery-icon")
    const batteryPercentage = document.querySelector("#battery-percentage")
    const { level } = await navigator.getBattery()
    setBatteryIcon(level)
    
    batteryPercentage.innerText = `${level * 100}%`
}

const watchBatteryLevel = async () =>{
    await setBatteryLevel()
    
    setInterval(async ()=>{
        await setBatteryLevel()
    }, 15*1000)
}
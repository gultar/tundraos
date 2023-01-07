const getUsername = () =>{
    //Probably useless
    if(window.location.hostname == 'localhost'){
        const [ url, searchParams ] = window.location.href.split("?")
        const [ tokenAndValue, usernameAndValue ] = searchParams.split("&")
        let [ usernameLabel, value ] = usernameAndValue.split("=")
        value = value.replace("#", '')
        return value
    }else{
        return 'guest'
    }
    
}

const logout = async () =>{
    
    const [ url, searchParams ] = window.location.href.split("?")
    const username = getUsername()
    window.location.href = url
    
    if(window.location.hostname == 'localhost'){
        const loggedOut = await Promise.resolve($.post("/logout", {
            logout:true,
            username:username
        }))
    }

}

const reboot = () =>{
    confirmation({
        message:"Are you sure you want to reboot?",
        yes:()=>{
            window.openWindows = {}
            if(location.hostname === 'localhost')
                location.href = location.origin
            else
                location.reload()
        },
        no:()=>{}
    })
}

const shutdown = () =>{
    confirmation({
        message:"Are you sure you want to shutdown?",
        yes:()=>{
            window.openWindows = {}
            window.close()
        },
        no:()=>{}
    })
}

const setUiElementsStates = () =>{
    $("#icon-container").sortable()
    //prevent dragging start menu elements
    $("nav a").on('dragstart drop', function(e){
        e.preventDefault();
        return false;
    });
}

const select = (element, func) =>{
    if(element.classList.contains('selected')){
        func()
        element.classList.remove('selected')
    }else{
        element.classList.add('selected')
        setTimeout(()=>{
            element.classList.remove('selected')
        }, 1000)
    }
}


const startPreReloadRoutine = () =>{
    window.addEventListener("beforeunload", (event)=>preReloadRoutine(event))
}


const preReloadRoutine = (event)=>{
        event.preventDefault()
        clearPointers()
        restoreAllWindows()
}

const clearPointers = () =>{
    $.post("http://localhost:8000/destroyallpointers", {
            all:true
    }).catch(e => console.log(e))
}


const initDesktop = () =>{
    makeDesktopMenu()
    cycleThroughWindows()
    startPreReloadRoutine()
    setUiElementsStates()
}
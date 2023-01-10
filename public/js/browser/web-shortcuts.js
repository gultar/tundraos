function turnToURLQueryText(args){
    const argsFused = args.toString()
    const text = argsFused.replaceAll(",","+")
    return text
}

function runWeb(url){
    new Browser(url)
}

function runLinguee(params=[]){
    const text = turnToURLQueryText(params)
    new ApplicationWindow({ title: "Linguee", height:"100%", width:"100%", html:`
    <iframe 
    id="wiki-window" 
    style="border:none;" 
    src="https://www.linguee.fr/${(text != undefined? "search?source=auto&query="+text : "")}">
    </iframe>
    ` });
}

function runTirex(){
    new ApplicationWindow({ title: "Tirex Game", height:"90%", width:"90%", url:'./pages/tirex.html' });
}

function runLofi(){
    if(window.isElectron) new Browser('https://www.youtube.com/watch?v=jfKfPfyJRdk&ab_channel=LofiGirl')
    else{
        const lofi = `<iframe width="560" height="315" src="https://www.youtube.com/embed/jfKfPfyJRdk"
        title="YouTube video player" frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; 
        gyroscope; picture-in-picture" allowfullscreen></iframe>`
        new ApplicationWindow({ title: "Lofi Girl", height:"90%", width:"90%", html:lofi });
    }
    
}

function runMap(){
    const maps = `<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d11061.57471035846!2d-70.6774246087825!3d46.12298747613765!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4cb9bfe1bb01d291%3A0x5040cadae4d29b0!2sSaint-Georges%2C%20QC%2C%20Canada!5e0!3m2!1sfr!2smx!4v1668968664821!5m2!1sfr!2smx" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`
    new ApplicationWindow({ title: "Google Maps", height:"95%", width:"80%", html:maps  });
}




function runWebamp(){
    const x = 100
    const y = 100
    const app = document.getElementById("webamp")
    const webamp = new Webamp({
        __initialWindowLayout: {
            main: { position: { x: 800, y: 800 } },
        }
    });
    console.log(webamp)
    app.style["z-index"] = 20
    webamp.renderWhenReady(app);
    // webamp._node.offsetTop = 
}

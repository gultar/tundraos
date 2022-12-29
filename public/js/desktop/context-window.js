const popup = (text) =>{
    if(typeof text == 'object')
        text = JSON.stringify(text)

    $("#dialog-message").html(text)
    $( "#dialog-message" ).dialog({
        modal: true,
        width: 500,
    });
}

const confirmation = ({ message="", yes=()=>{}, no=()=>{} }) =>{
    $("#dialog-message").html(`<span style="font-size:13pt">${message}</span>`)
    $( "#dialog-message" ).dialog({
        resizable: false,
        height: "auto",
        width: 500,
        modal: true,
        buttons: {
            Yes: function() {
                $( this ).dialog( "close" );
                yes(this)
            },
            No: function() {
                $( this ).dialog( "close" );
                no(this)
            }
        }
    });
}

const prompt = ({ message="" }) =>{
    return new Promise((resolve)=>{
        $("#dialog-message").html(`<span style="font-size:13pt">${message}</span>`)
        $( "#dialog-message" ).dialog({
            resizable: false,
            height: "auto",
            width: 500,
            modal: true,
            buttons: {
                Yes: function(){
                    $( this ).dialog( "close" );
                    resolve(true)
                },
                No: function(){
                    $( this ).dialog( "close" );
                    resolve(false)
                }
            }
        });
    })
}
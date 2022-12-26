const popup = (...text) =>{
    $("#dialog-message").html(...text)
    $( "#dialog-message" ).dialog();
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
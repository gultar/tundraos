const popup = (...text) =>{
    $("#dialog-message").html(...text)
    $( "#dialog-message" ).dialog();
}

const confirmation = ({ message="", yes=()=>{}, no=()=>{} }) =>{
    $("#dialog-message").html(`<span>${message}</span>`)
    $( "#dialog-message" ).dialog({
        resizable: false,
        height: "auto",
        width: 400,
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
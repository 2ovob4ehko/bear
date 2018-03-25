$(document).ready(function(){
    $('.search-field').on('keyup click change',function(){
        if($(this).val() == ""){
            $('.search-icon').show();
        }else{
            $('.search-icon').hide();
        }
    })
})
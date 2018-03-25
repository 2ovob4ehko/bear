const fs = require('fs')
const Remarkable = require('remarkable')
const md = new Remarkable()
const markRules = require('./plugins/mark-rules');
md.use(markRules);


// md.renderer.render = (tokens, options, env) => {
//     let str = ''
//     for (let i = 0; i < tokens.length; i++) {
//         if (tokens[i].type === 'inline') {
//             str += md.renderer.render(tokens[i].children, options, env);
//         } else {
//             console.log('content', tokens[i])
//             const content = tokens[i].content
//             str += (content || '')
//         }
//     }
//     return str
// }
$(document).ready(function(){
    $('.search-field').on('keyup click change',function(){
        if($(this).val() == ""){
            $('.search-icon').show();
        }else{
            $('.search-icon').hide();
        }
    })

    $('#document_file').on('change',function(){
        console.log($(this)[0].files[0]);
        fs.readFile($(this)[0].files[0].path, 'utf-8', function(err, data){
            if(err){
                console.log("Error: " + err);
            }
            $('.document-page').html(md.render(data));
        })
    })
})
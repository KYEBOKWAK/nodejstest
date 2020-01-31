module.exports = {
  HTML:function(title, body){
    return `
    <!doctype html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="utf-8">
    </head>
    <body>
      ${body}
    </body>
    </html>
    `;
  },
  input:function(title, name, placeholder){
    return `<div><span>${title}</span><input></input><div>`;
  },
  button:function(title, id, className){
    return `<button id='${id}' class='${className}'>${title}</button>`;
  },
  list:function(filelist){
    var list = '<ul>';
    var i = 0;
    while(i < filelist.length){
      list = list + `<li><a href="/?id=${filelist[i]}">${filelist[i]}</a></li>`;
      i = i + 1;
    }
    list = list+'</ul>';
    return list;
  }
}

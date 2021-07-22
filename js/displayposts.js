// finds all the blog posts and display's their previews in a a single column list. 
var fs = require('fs');
var files = fs.readdirSync('../blog/');
console.log(files);
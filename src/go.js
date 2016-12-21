var parse = require("./parser").makeParse();
var lex = require("./lexer").makeLex;
function go() {
    var string, tree;
    try {
        var tokens = lex();
        // var tokens = {};
        // console.log(tokens);
        tree = parse(tokens);
        string = JSON.stringify(tree, ['key', 'name', 'message',
            'value', 'arity', 'first', 'second', 'third', 'fourth'
        ], 4);
    } catch (e) {
        string = JSON.stringify(e, ['name', 'message', 'from', 'to', 'key',
            'value', 'arity', 'first', 'second', 'third', 'fourth'
        ], 4);
    }
    console.log(string);
}

// go("var make_parse = " + (make_parse.toSource ?
//     make_parse.toSource() : make_parse.toString()) + ";");

// document.getElementById('PARSE').onclick = function(e) {
//     go(document.getElementById('INPUT').value);
// };

go();
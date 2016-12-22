var parse = require("./parser").Parse();
var lex = require("./lexer").Lex();
var eval = require("./eval").Eval();

function go() {
    var string;
    try {
        var tokens = lex("test.py");
        var tree = parse(tokens);

        string = JSON.stringify(tree, ['key', 'name', 'message',
            'value', 'arity', 'first', 'second', 'third', 'fourth'
        ], 4);
        console.log(string);
        eval(tree);
    } catch (e) {
        string = JSON.stringify(e, ['name', 'message', 'from', 'to', 'key',
            'value', 'arity', 'first', 'second', 'third', 'fourth'
        ], 4);
    }


}

go();
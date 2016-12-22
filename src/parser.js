exports.Parse = function() {
    var symbol_table = {};
    var scope;
    var token;
    var tokens;
    var token_nr;

    //返回自身
    var itself = function() {
        return this;
    };

    //symbol原型
    var original_symbol = {
        nud: function() {
            Error('Undefined.');
        },
        led: function(left) {
            Error("Missing operator.");
        }
    };

    //获取特定id的symbol，如果table中没有该symbol，则创建一个
    var symbol = function(id, bp) {
        var s = symbol_table[id];
        bp = bp || 0;
        if (s) {
            if (bp >= s.lbp) {
                s.lbp = bp;
            }
        } else {
            s = Object.create(original_symbol);
            s.id = s.value = id;
            s.lbp = bp;
            symbol_table[id] = s;
        }
        return s;
    }

    symbol('(name)').nud = itself;
    symbol("(literal)").nud = itself;
    symbol('(end)');
    symbol('(newline)').nud = itself;
    symbol('(indent)');
    symbol('(dedent)');
    symbol(":");
    symbol(";");
    symbol(")");
    symbol("]");
    symbol("}");
    symbol(",");
    symbol("else");
    symbol("this").nud = function() {
        scope.reserve(this);
        this.arity = "this";
        return this;
    };

    //获取下一个token，如果传入id，则限定当前token的id为id，否则报错
    var advance = function(id) {
        var a, //arity
            o, //object
            t, //token
            v; //value

        if (id && token.id !== id) {
            Error('Expected "' + id + '".');
        }
        if (token_nr >= tokens.length) {
            token = symbol_table['(end)'];
            return;
        }

        t = tokens[token_nr];
        token_nr += 1;
        v = t.value;
        a = t.type;
        if (a === 'INDETIFIER') {
            o = scope.find(v);
            a = "name";
        } else if (a === 'OPERATOR') {
            o = symbol_table[v];
            a = "operator"
            if (!o) {
                Error('Unknown operator.');
            }
        } else if (a === "STRING" || a === "NUMBER") {
            a = 'literal';
            o = symbol_table['(literal)'];
        } else if (a === "CONTROL") {
            o = symbol_table['(' + v + ')'];
            if (!o) {
                Error('Unknown control.');
            }
            a = "control";
        } else {
            Error("Unexpected token.");
        }
        token = Object.create(o);
        token.value = v;
        token.arity = a;
        return token;
    };

    //scope原型
    var original_scope = {
        define: function(n) {
            var t = this.def[n.value];
            if (typeof t === 'obejct') {
                Error(t.reversed ? "Already reversed." : "Already defined.");
            }
            this.def[n.value] = n;
            n.reversed = false;
            n.nud = itself;
            n.led = null;
            n.std = null;
            n.lbp = 0;
            n.scope = scope;
            return n;
        },
        find: function(n) {
            var e = this,
                o;
            while (true) {
                o = e.def[n];
                if (o && typeof o !== 'function') {
                    return e.def[n];
                }
                e = e.parent;
                if (!e) {
                    o = symbol_table[n];
                    return o && typeof o !== 'function' ?
                        o : symbol_table["(name)"];
                }
            }
        },
        isLocal: function(n) {
            var e = this,
                o;
            o = e.def[n];
            if (o && typeof o !== 'function') {
                return true;
            } else {
                return false;
            }
        },
        pop: function() {
            scope = this.parent;
        },
        reverse: function(n) {
            if (n.arity !== "name" || n.reversed) {
                return;
            }
            var t = this.def[n.value];
            if (t) {
                if (t.reversed) {
                    return;
                }
                if (t.arity === "name") {
                    Error("Already defined.");
                }
            }
            this.def[n.value] = n;
            n.reversed = true;
        }
    };

    //新建一个作用域
    var new_scope = function() {
        var s = scope;
        scope = Object.create(original_scope);
        scope.def = {};
        scope.parent = s;
        return scope;
    };

    //解析表达式
    var expression = function(rbp) {
        var left;
        var t = token;
        advance();
        left = t.nud();
        while (rbp < token.lbp) {
            t = token;
            advance();
            left = t.led(left);
        }
        return left;
    };

    //设定中缀运算符
    var infix = function(id, bp, led) {
        var s = symbol(id, bp);
        s.led = led || function(left) {
            this.first = left;
            this.second = expression(bp);
            this.arity = "binary"
            return this;
        };
        return s;
    };
    infix("+", 50);
    infix("-", 50);
    infix("*", 60);
    infix("/", 60);
    infix("in", 30);

    infix(".", 80, function(left) {
        this.first = left;
        if (token.arity !== "name") {
            Error("Expected a property name.");
        }
        token.arity = "literal";
        this.second = token;
        this.arity = "binary";
        advance();
        return this;
    });

    infix("[", 80, function(left) {
        this.first = left;
        this.second = expression(0);
        this.arity = "binary";
        advance("]");
        return this;
    });

    infix("?", 20, function(left) {
        this.first = left;
        this.second = expression(0);
        advance(":");
        this.third = expression(0);
        this.arity = "ternary";
        return this;
    });

    infix("(", 50, function(left) {
        var a = [];
        if (left.id === "." || left.id === "[") {
            this.arity = "ternary";
            this.first = left.first;
            this.second = left.second;
            this.third = a;
        } else {
            this.arity = "binary";
            this.first = left;
            this.first.arity = "fname";
            this.second = a;
            if ((left.arity !== "unary" || left.id !== "function") &&
                left.arity !== "name" && left.id !== "(" &&
                left.id !== "&&" && left.id !== "||" && left.id !== "?") {
                Error("Expected a variable name");
            }
        }
        if (token.id !== ")") {
            while (true) {
                a.push(expression(0));
                if (token.id !== ",") {
                    break;
                }
                advance(",")
            }
        }
        advance(")");
        return this;
    })

    //设定右结合中缀运算符
    var infixr = function(id, bp, led) {
        var s = symbol(id, bp);
        s.led = led || function(left) {
            this.first = left;
            this.second = expression(bp - 1);
            this.arity = "binary";
            return this;
        };
        return s;
    };
    infixr("&&", 30);
    infixr("||", 30);
    infixr("==", 40);
    infixr("!=", 40);
    infixr("<", 40);
    infixr("<=", 40);
    infixr(">", 40);
    infixr(">=", 40);

    //设定前缀运算符
    var prefix = function(id, nud) {
        var s = symbol(id);
        s.nud = nud || function() {
            scope.reverse(this);
            this.first = expression(70);
            this.arity = "unary";
            return this;
        };
        return s;
    };
    prefix("!");
    prefix("-");
    prefix("(", function() {
        var e = expression(0);
        advance(")");
        return e;
    });

    prefix("[", function() {
        var a = [];
        if (token.id !== "]") {
            while (true) {
                a.push(expression(0));
                if (token.id !== ",") {
                    break;
                }
                advance(",");
            }
        }
        advance("]");
        this.first = a;
        this.arity = "unary";
        return this;
    });

    prefix("{", function() {
        var a = [],
            n, v;
        if (token.id !== "}") {
            while (true) {
                n = token;
                if (n.arity !== "name" && n.arity !== "literal") {
                    Error("Bad property name.");
                }
                advance();
                advance(":");
                v = expression(0);
                v.key = n.value;
                a.push(v);
                if (token.id !== ",") {
                    break;
                }
                advance(",");
            }
        }
        advance("}");
        this.first = a;
        this.arity = "unary";
        return this;
    });

    //设定赋值运算符符
    var assignment = function(id) {
        return infix(id, 10, function(left) {
            if (left.id !== "." && left.id !== "[" && left.arity !== "name") {
                Error("Bad lvalue.");
            }
            if (!scope.isLocal(left.value)) {
                scope.define(left.value);
            }
            this.first = left;
            this.second = expression(9);
            this.assignment = true;
            this.arity = "binary";
            return this;
        });
    };
    assignment("=");
    assignment("+=");
    assignment("-=");

    //设定常量
    var constant = function(s, v) {
        var x = symbol(s);
        x.nud = function() {
            scope.reverse(this);
            this.value = symbol_table[this.id].value;
            this.arity = "literal";
            return this;
        };
        x.value = v;
        return x;
    }

    constant("true", true);
    constant("false", false);
    constant("null", null);
    constant("pi", 3.141592653589793);
    constant("Object", {});
    constant("Array", []);


    //解析一条语句，根据是否为关键字将其用std或者expression解析
    var statement = function() {
        var n = token,
            v;
        if (n.std) {
            advance();
            scope.reverse(n);
            return n.std();
        }
        v = expression(0);
        if (!v.assignment && v.value !== "(" && v.value !== "==") {
            Error("Bad expression statement.");
        }
        advance("(newline)");
        return v;
    }

    //解析一个作用域下的多条语句
    var statements = function() {
        var a = [],
            s;
        while (true) {
            if (token.id === "(dedent)" || token.id === "(end)") {
                break;
            }
            s = statement();
            if (s) {
                a.push(s);
            }
        }
        return a.length === 0 ? null : a;
    };

    //解析语句块
    var block = function() {
        advance("(newline)");
        var t = token;
        advance("(indent)");
        return t.std();
    }

    //定义各个关键词的解析方式
    var stmt = function(s, f) {
        var x = symbol(s);
        x.std = f;
        return x;
    };

    stmt("(indent)", function() {
        new_scope();
        var a = statements();
        advance("(dedent)");
        scope.pop();
        return a;
    });

    stmt("while", function() {
        this.first = expression(0);
        advance(":");
        this.second = block();
        this.arity = "statement";
        return this;
    });

    stmt("if", function() {
        this.first = expression(0);
        advance(":");
        this.second = block();
        if (token.id === "else") {
            scope.reverse(token);
            advance();
            advance(":");
            this.third = block();
        } else if (token.id === "elif") {
            scope.reverse(token);
            this.third = statement();
        } else {
            this.third = null;
        }
        this.arity = "statement";
        return this;
    });

    stmt("elif", function() {
        this.first = expression(0);
        advance(":");
        this.second = block();
        if (token.id === "else") {
            scope.reverse(token);
            advance();
            advance(":");
            this.third = block();
        } else if (token.id === "elif") {
            scope.reverse(token);
            this.third = statement();
        } else {
            this.third = null;
        }
        this.arity = "statement";
        return this;
    });

    stmt("for", function() {
        this.first = expression(0);
        advance(":");
        this.second = block();
        this.arity = "statement";
        return this;
    })

    stmt("break", function() {
        advance("newline");
        if (token.id !== "(dedent)") {
            Error("Unreachable statement.");
        }
        this.arity = "statement";
        return this;
    });

    stmt("return", function() {
        if (token.id !== "newline") {
            this.first = expression(0);
        }
        advance("newline");
        if (token.id !== "(dedent)") {
            Error("Unreachable statement.");
        }
        this.arity = "statement";
        return this;
    });

    stmt("def", function() {
        var a = [];

        // advance();
        if (token.arity !== "name") {
            Error("Expected a function name.");
        }
        scope.define(token);
        this.name = token.value;
        advance();

        new_scope();
        advance("(");
        if (token.id !== ")") {
            while (true) {
                if (token.arity !== "name") {
                    Error("Expected a parameter name.");
                }
                scope.define(token);
                a.push(token);
                advance();
                if (token.id !== ",") {
                    break;
                }
                advance(",");
            }
        }
        this.first = a;
        advance(")");
        advance(":");
        advance("(newline)");
        advance("(indent)");
        this.second = statements();
        advance("(dedent)");
        this.arity = "statement";
        scope.pop();
        return this;
    });

    return function(source) {
        tokens = source;
        // console.log(tokens)
        token_nr = 0;
        new_scope();
        advance();
        var s = statements();
        advance("(end)");
        scope.pop();
        return s;
    }
}
exports.Eval = function() {
    var scope;

    var original_scope = {
        find_v: function(id) {
            var e = this,
                o;
            while (true) {
                o = e.v[id];
                if (o) {
                    return o;
                }
                e = e.parent;
                if (!e) {
                    this.v[id] = { id: id, value: null };
                    return this.v[id];
                }
            }
        },
        find_f: function(id) {
            var e = this,
                o;
            while (true) {
                o = e.f[id];
                if (o) {
                    return o;
                }
                e = e.parent;
                if (!e) {
                    Error("Nonexistent function " + id + "()");
                }
            }
        },
        def_f: function(id, value) {
            var o = this.f[id];
            if (o) {
                Error("Redefine function " + id + "()");
            }
            this.f[id] = { id: id, value: value };
            return this.f[id];
        },
        pop: function() {
            scope = this.parent;
        }
    };

    var new_scope = function() {
        var s = scope;
        scope = Object.create(original_scope);
        scope.v = {};
        scope.f = {};
        scope.parent = s;
        return scope;
    };

    var matchEval = function(tree) {
        switch (tree.arity) {
            case "binary":
                return eval_bina(tree);
            case "ternary":
                return eval_terna(tree);
            case "unary":
                return eval_una(tree);
            case "statement":
                return eval_stmt(tree);
            case "name":
                return scope.find_v(tree.value);
            case "fname":
                return scope.find_f(tree.value);
            case "literal":
                return tree;
            default:
                Error("Unknown arity: " + tree.arity);
        }
    };

    var eval_stmts = function(tree) {
        for (var i = 0; i < tree.length; i++) {
            matchEval(tree[i]);
        }
    };

    var eval_bina = function(tree) {
        switch (tree.value) {
            case "+":
                return getValue(tree.first) + getValue(tree.second);
            case "-":
                return getValue(tree.first) - getValue(tree.second);
            case "*":
                return getValue(tree.first) * getValue(tree.second);
            case "/":
                return getValue(tree.first) / getValue(tree.second);
            case "&&":
                return getValue(tree.first) && getValue(tree.second);
            case "||":
                return getValue(tree.first) || getValue(tree.second);
            case "==":
                return getValue(tree.first) === getValue(tree.second);
            case "!=":
                return getValue(tree.first) !== getValue(tree.second);
            case "<=":
                return getValue(tree.first) <= getValue(tree.second);
            case ">=":
                return getValue(tree.first) >= getValue(tree.second);
            case "<":
                return getValue(tree.first) < getValue(tree.second);
            case ">":
                return getValue(tree.first) > getValue(tree.second);
            case "=":
                return matchEval(tree.first).value = getValue(tree.second);
            case "+=":
                return matchEval(tree.first).value += getValue(tree.second);
            case "-=":
                return matchEval(tree.first).value -= getValue(tree.second);
            case "(":
                return eval_func(tree);
            default:
                Error("Unknown operator: " + tree.value);
        }
    };

    var eval_func = function(tree) {
        var func = matchEval(tree.first).value;
        var args = [];
        for (var i = 0; i < tree.second.length; i++) {
            args.push(getValue(tree.second[i]));
        }
        return func(args);
    };

    var eval_terna = function(tree) {
        switch (tree.value) {
            case "?":
                return getValue(tree.first) ? getValue(tree.second) : getValue(tree.third);
            default:
                Error("Unknown operator: " + tree.value);
        }
    };

    var eval_una = function(tree) {
        var list = [];
        var dic = {};
        switch (tree.value) {
            case "!":
                return !getValue(tree.first);
            case "-":
                return -getValue(tree.first);
            case "[":
                for (var i = 0; i < tree.first.length; i++) {
                    list.push(getValue(tree.first[i]));
                }
                return list;
            case "{":
                for (var i = 0; i < tree.first.length; i++) {
                    dic[first.key] = getValue(tree.first[i]);
                }
                return dic;
            default:
                Error("Unknown operator: " + tree.value);
        }
    };

    var eval_stmt = function(tree) {
        switch (tree.value) {
            case "def":
                return eval_def(tree);
            case "while":
                return eval_while(tree);
            case "if":
                return eval_if(tree);
            case "for":
                return eval_for(tree);
            case "break":
                return eval_break(tree);
            case "return":
                return eval_return(tree);
            default:
                Error("Unknown statement: " + tree.value);
        }
    };

    var eval_def = function(tree) {
        var func = function(args) {
            var rtn;
            new_scope();
            for (var i = 0; i < tree.first.length; i++) {
                scope.find_v(tree.first[i].value).value = args[i];
            }
            eval_stmts(tree.second);
            rtn = scope.find_v("rtn").value;
            scope.pop()
            return rtn;
        }
        scope.def_f(tree.name, func);
    };

    var eval_while = function(tree) {
        while (getValue(tree.first)) {
            new_scope();
            eval_stmts(tree.second);
            scope.pop();
        }
    };

    var eval_if = function(tree) {
        if (getValue(tree.first)) {
            eval_stmts(tree.second);
        } else if (tree.third !== null) {
            if (tree.third.value === "elif") {
                eval_if(tree.third);
            } else {
                eval_stmts(tree.third);
            }
        }
    };

    var eval_return = function(tree) {
        var first = matchEval(tree.first);
        var value = first.value ? first.value : first;
        scope.find_v("rtn").value = value;
    };

    var set_print = function() {
        var func = function(args) {
            console.log(args[0]);
        }
        scope.def_f("print", func);
    };

    var set_builtin = function() {
        set_print();
    };

    var getValue = function(tree) {
        var sec = matchEval(tree);
        if (sec.value === null || sec.value === undefined) {
            return sec;
        } else {
            return sec.value;
        }
    };

    return function(tree) {
        new_scope();
        set_builtin();
        eval_stmts(tree);
        scope.pop();
    };
}
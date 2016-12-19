

var keywords = new Array("def", "if", "else", "elif", "for", "while", "return");


var lex = function(input) {
    var tokens = [],
        c, i = 0;

    var advance = function() {
        return c = input[++i];
    };
    var addToken = function(type, value) {
        tokens.push({
            type: type,
            value: value
        });
    };

    var isOperator = function(c) {
        return /[+\-*\/\^%=(),\[\]:]/.test(c);
    },
    isDigit = function(c) {
        return /[0-9.]/.test(c);
    },
    isWhiteSpace = function(c) {
        return /\s/.test(c);
    },
    isString = function(c) {
        return typeof c === "string" && !isOperator(c) && !isWhiteSpace(c);
    },
    isKeyword = function(s) {
    	for(var i = 0; i < keywords.length; i += 1)
    	{
    		if(s == keywords[i])
    		{
    			addToken("keyword", s);
    			return true;
    		}
    	}
    	return false;
    };

    while (i < input.length) {
        c = input[i];
        if (isWhiteSpace(c)) advance();
        else if (isOperator(c)) {
            addToken("operator",c);
            advance();
        } else if(isDigit(c)){	
        	var dig = c;
        	while(isDigit(advance())) dig += c;
        	addToken("digit", dig);
        } else if (isString(c)) {
            var str = c;
            while (isString(advance())) str += c;
            if(isKeyword(str))
            	continue;
            addToken("string", str);
        } else throw "Unrecognized token.";
    }
    addToken("(end)", null);
    return tokens;
}

var str = "def aaa(arg1, arg2):";
var result = lex(str);
console.log(result);
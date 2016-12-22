var fs = require("fs");

var keywords = new Array("def", "if", "else", "elif",
    "for", "while", "return", "is", "not", "import",
    "from");

var lex = function(input) {
    var tokens = [],
        c, i = 0,
        TotalOfIndent = 0,
        lines = 1;

    var advance = function() {
        return c = input[++i];
    };
    var addToken = function(type, value) {
        tokens.push({
            type: type,
            value: value
        });
    };

    var isOperator = function(c, opr) {
            if(!opr){
                return /[+\-*\/\^%=(),:.!<>\[\]]/.test(c);
            }
            else if(/[!=+\-*\/\^%<>]/.test(opr)){
                return /[=]/.test(c);
            }
            else{
                return false;
            }
        },
        isDigit = function(c, mode = false) {
            if (mode == false)
                return /[0-9]/.test(c);
            else if (mode == true)
                return /[0-9.]/.test(c);
        },
        isWhiteSpace = function(c) {
            return /\s/.test(c);
        },
        isWord = function(c) {
            return typeof c === "string" && !isOperator(c) && !isWhiteSpace(c);
        },
        // isKeyword = function(s) {
        //     for (var i = 0; i < keywords.length; i++) {
        //         if (s == keywords[i]) {
        //             addToken("INDETIFIER", s);
        //             return true;
        //         }
        //     }
        //     return false;
        // },
        isNewline = function(c) {
            return /\n/.test(c);
        },
        isIndentation = function(c) {
            return /\t/.test(c);
        },
        isString = function(c, mode = "") {
            if (mode == "")
                return /['"]/.test(c);
            else if (mode == "'")
                return /[']/.test(c);
            else if (mode == '"')
                return /["]/.test(c);
        };

    var isCorrectNumber = function(num) {
        var numOfDot = 0;
        for (var count = 0; count < num.length; count++)
            if (num[count] == ".") numOfDot++;
        if (numOfDot > 1)
            return false;
        else
            return true;
    };

    while (i < input.length) {
        c = input[i];

        if (isNewline(c)) { //判断是否换行，如果换行则判断缩进变化
            lines++;
            addToken("CONTROL", "newline");
            advance();

            var subOfIndent = 0;
            while (isIndentation(c)) {
                subOfIndent++;
                advance();
            }
            while (subOfIndent > TotalOfIndent) {
                addToken("CONTROL", "indent");
                TotalOfIndent++;
            }
            while (subOfIndent < TotalOfIndent) {
                addToken("CONTROL", "dedent");
                TotalOfIndent--;
            }
        } else if (isWhiteSpace(c)) { //判断是否为空格
            advance();
        } else if (isOperator(c)) { //判断是否为操作符
            var opr = c;
            while (isOperator(advance(), opr)) opr += c;
            addToken("OPERATOR", opr);
        } else if (isString(c)) {
            var str = c;
            var mode = c;
            while (!isString(advance(), mode) && i < input.length) str += c;
            if (i >= input.length)
                throw "String error in line " + lines;
            str += c;
            addToken("STRING", str);
            advance();
        } else if (isDigit(c)) { //判断是否为数字
            var num = c;
            while (isDigit(advance(), true)) num += c;
            if (!isCorrectNumber(num))
                throw "Error number " + num + " in line " + lines;
            addToken("NUMBER", num);
        } else if (isWord(c)) { //判断是否为单词
            var word = c;
            while (isWord(advance())) word += c;
            // if (isKeyword(word))
            //     continue;
            addToken("INDETIFIER", word);
        } else throw "Unrecognized token.";
    }
    addToken("CONTROL", "newline");
    while(TotalOfIndent > 0){
        addToken("CONTROL", "dedent");
        TotalOfIndent--;
    }
    addToken("CONTROL", "end");
    return tokens;
};

exports.makeLex = function() {
    var data = fs.readFileSync("test.py");
    var result = lex(data.toString());
    // console.log(result);
    return result;
};

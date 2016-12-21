
var symbol_table = {};

var original_symbol = {
	nud: function() {
		this.error('Undefined.');
	},
	led: function(left) {
		this.error("Missing operator.");
	}
};

var symbol = function(id, bp) {
	var s = symbol_table[id];
	bp = bp || 0;
	if (s) {
		if (bp >= s.lbp) {
			s.lbp = bp;
		}
	}else {
		s = Object.create(original_symbol);
		s.id = s.value = id;
		s.lbp = bp;
		symbol_table[id] = s;
	}
	return s;
}

var advance = function(id) {
	var a,		//arity
		o,		//object
		t,		//token
		v;		//value

	if(id && token.id !== id){
		token.error('Expected "' + id + '".');
	}
	if(toekn_nr >= tokens.length){
		token = symbol_table['END'];
		return;
	}

	t=tokens[toekn_nr];
	toekn_nr += 1;
	v = t.value;
	a = t.type;
	if(a === 'INDENTIFIER'){
		o = scope.find(v);
		a = "name";
	}else if(a === 'OPERATOR'){
		o = symbol_table[v];
		a = "operator"
		if(!o) {
			t.error('Unknown operator.');
		}
	}else if(a === "STRING" || a === "NUMBER") {
		a = 'literal';
		o = symbol_table['LITERAL'];
	}else{
		t.error("Unexpected token.");
	}
	token = Object.create(o);
	token.value = v;
	toekn.arity = a;
	return token;
};

var scope;

var itself = function(){
	return this;
};

var original_scope = {
	define: function(n) {
		var t = this.def[n.value];
		if (typeof t === 'obejct') {
			n.error(t.reserved ? "Already reserved." : "Already defined.");
		}
		this.def[n.value] = n;
		n.reserved = false;
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
		while(true) {
			o=e.def[n];
			if(o && typeof o !== 'function') {
				return e.def[n];
			}
			e=e.parent;
			if(!e){
				o=symbol_table[n];
				return o && typeof o !== 'function' ?
							o : symbol_table["INDENTIFIER"];
			}
		}
	},
	pop: function(){
		scope = this.parent;
	}
	reserve: function(n) {
		if(n.arity !== "name" || n.reserved) {
			return;
		}
		var t = this.def[n.value];
		if(t){
			if(t.reserved){
				return;
			}
			if(t.arity === "name"){
				n.error("Already defined.");
			}
		}
		this.def[n.value] = n;
		n.reserved = true;
	}
};

var new_scope = function() {
	var s = scope;
	scope = Object.create(original_scope);
	scope.def = {};
	scope.parent = s;
	return scope;
}

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
}
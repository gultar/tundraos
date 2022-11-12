String.prototype.toHtmlEntities = function() {
    return this.replace(/./gm, function(s) {
        // return "&#" + s.charCodeAt(0) + ";";
        s = (s.match(/[a-z0-9\s]+/i)) ? s : "%" + s.charCodeAt(0)
        s = s.replace(" ","+")
        return s;
    });
};

const s = "J'aime les géniales fraises"

console.log(s.toHtmlEntities())


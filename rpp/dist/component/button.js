"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var View = (function () {
    function View(params) {
    }
    return View;
}());
var Text = (function () {
    function Text() {
    }
    return Text;
}());
var Image = (function () {
    function Image() {
    }
    return Image;
}());
var Button = (function () {
    function Button() {
    }
    Button.prototype.render = function () {
        return h(View, { id: 'xx' },
            h(Text, null, "xxxxxxxxx"),
            h(Text, null, "22"),
            h(Image, { src: "aafa11f122ff\u65B9\u6CD521" }));
    };
    return Button;
}());
exports.default = Button;

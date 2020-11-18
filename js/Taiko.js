
"use strict"

console.log("in Taiko.js");

class Taiko extends Pic {
    constructor(opts) {
        opts.width = opts.width || 100;
        opts.height = opts.height || 100;
        opts.url = "images/taiko.svg";
        super(opts);
    }
}

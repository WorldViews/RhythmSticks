"use strict"

class Garden extends CanvasTool.RectGraphic {
    constructor(opts) {
        super(opts);
        this.name = opts.name;
        this.gtool = gtool;
        this.font = "100px Arial";
        this.textStyle = "white";
        this.textAlign = "center";
    }

    draw(canvas, ctx) {
        super.draw(canvas, ctx);
        if (this.name)
            this.drawText(canvas, ctx, this.x, this.y, this.name, this.font);
    }

    // load Garden from a JSON object
    async load(obj) {
        console.log("loadGardenJSON");
        var gtool = this.gtool;
        var inst = this;
        if (obj.requirements) {
            window.MODS = {};
            for (var i=0; i<obj.requirements.length; i++) {
                let jsfile = obj.requirements[i];
                console.log("*** Loading", jsfile);
                try {
                    var module = await import(jsfile);
                    console.log("got", jsfile, module);
                    window.MODS[jsfile] = module;
                    //import * as myModule from '/modules/my-module.js';
                }
                catch (e) {
                    console.log("failed for "+jsfile+" error:"+e);
                }
            }
        }
        if (obj.pictures) {
            obj.pictures.forEach(pic => {
                gtool.addPic(pic);
            });
        }
        if (obj.items) {
            obj.items.forEach(item => {
                gtool.addItem(item);
            });
        }
    }

    onClick(e) {
        return false;
    }

}


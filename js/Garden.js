"use strict"

console.log("in PeaceTree.js");

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

    // load flowers from a JSON object
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
        if (obj.flowers) {
            obj.flowers.forEach(flower => {
                console.log("flower:", flower);
                gtool.addFlower(flower);
            });
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

class WildFlowers extends Garden {
    constructor(opts) {
        console.log("******* Bingo bingo .... WildFlowers...", opts);
        super(opts);
        this.gtool = opts.gtool;
        this.plantOnClick = opts.plantOnClick;
        if (this.plantOnClick == null)
            this.plantOnClick = true;
        var num = opts.maxNumWildFlowers || 10;
        this.xMin = this.x - this.width / 2;
        this.xMax = this.x + this.width / 2;
        this.yMin = this.y - this.height / 2;
        this.yMax = this.y + this.height / 2;
        this.timer = null;
        this.plants = [];
        this.startWildFlowers(num);
        window.WF = this;
        console.log("xLow xHigh", this.xLow, this.xHigh);
    }

    onClick(e) {
        console.log("WildFlowers.onClick", this.id, e);
        if (e.which != 1)
            return;
        var x = e.clientX;
        var y = e.clientY;
        var pt = this.gtool.getMousePos(e);
        if (!this.plantOnClick)
            return;
        console.log("new flower ", pt);
        var f = new Flower(pt);
        this.gtool.addGraphic(f);
        this.plants.push(f);

    }

    numPlants() { return this.plants.length; }

    startWildFlowers(maxNumWildFlowers) {
        var inst = this;
        inst.maxNumWildFlowers = maxNumWildFlowers;
        this.timer = setInterval(() => inst.addPlant(), 500);
    }

    async addPlant() {
        var inst = this;
        if (this.numPlants() < this.maxNumWildFlowers) {
            var x = uniform(this.xMin, this.xMax);
            var y = uniform(this.yMin, this.yMax);
            var opts = { x, y };
            //console.log("adding flower ", opts);
            var f = await this.gtool.addFlower(opts);
            this.plants.push(f);
        }
        if (this.numPlants() >= this.maxNumWildFlowers) {
            var f = this.plants[0];
            f.die(() => inst.removePlant(f));
            //this.removeFlower(this.flowers[0]);
        }
    }

    removePlant(f) {
        this.gtool.removeFlower(f);
        arrayRemove(this.plants, f);
    }
}


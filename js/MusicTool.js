
"use strict";


class MusicTool extends CanvasTool {
  constructor(name, opts) {
    super(name, opts);
    opts = opts || {};
    var ctx = this.ctx;
    ctx.strokeStyle = "white";
    /*
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowColor = "#333";
    */
    ctx.globalAlpha = .85;
    this.user = null;
    this.plantOnClick = false;
    this.initGUI();
    this.lockZoom = true;
    this.lockPan = true;
    this.taikoBox = null;
    this.wheelBox = null;
  }

  addTaiko() {
    var opts = {
      "type": "TaikoBox",
      "id": "taiko",
      "name": "Taiko Box",
      "lineWidth": 4,
      "fillStyle": "brown",
      "width": 800,
      "height": 800,
      "x": 0,
      "y": -60
    }
    var taikoBox = new TaikoBox(opts);
    this.taikoBox = taikoBox;
    this.addGraphic(taikoBox);
    taikoBox.addScorer();
  }

  addWheel() {
    var opts = {
      "type": "WheelBox",
      "id": "wheel",
      "name": "Wheel Box",
      "lineWidth": 4,
      "fillStyle": "brown",
      "width": 800,
      "height": 800,
      "x": 0,
      "y": 0
    }
    var wheelBox = new WheelBox(opts);
    this.wheelBox = wheelBox;
    this.addGraphic(wheelBox);
    wheelBox.addScorer();
  }

  addPiano() {
    var opts = {
      "type": "PianoBox",
      "id": "piano1",
      "name": "Piano Box",
      "lineWidth": 4,
      "fillStyle": "brown",
      "width": 800,
      "height": 800,
      "x": 0,
      "y": -100
    }
    var pianoBox = new PianoBox(opts);
    this.addGraphic(pianoBox);
  }

  clear() {
    super.clear();
  }

  initGUI() {
    var inst = this;
    $("#save").click(e => inst.downloadGardenObj());
    var dropzone = "#" + this.canvasName;
    $(dropzone).on('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    $(dropzone).on('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    $(dropzone).on('drop', (e) => inst.handleDrop(e));
  }

  start() {
    var inst = this;
    super.start();
  }

  mouseMove(e) {
    super.mouseMove(e);
  }

  tick() {
    super.tick();
    //console.log("MusicTool.tick");
    if (this.taikoBox)
      this.taikoBox.tick();
    if (this.wheelBox)
      this.wheelBox.tick();
  }

  async addItem(item) {
    console.log("addItem", item);
    item.gtool = this;
    var otype = item.type;
    var obj = await createObject(item);
    console.log("addItem got", obj);
    if (obj == null) {
      console.log("Couldn't create", item);
      return;
    }
    if (obj instanceof CanvasTool.Graphic) {
      console.log("obj is graphic");
      this.addGraphic(obj);
    }
  }

  handleMouseDown(e) {
    if (e.which != 1)
      return;
    var x = e.clientX;
    var y = e.clientY;
    var pt = this.getMousePos(e);
  }

  clearCanvas() {
    //var ctx = this.canvas.getContext('2d');
    var ctx = this.ctx;
    var canvas = this.canvas;
    //ctx.resetTransform(); // stupid -- internet explorer doesn't have this
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var drawBorder = false;
    if (drawBorder) {
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#999';
      ctx.fillStyle = this.background;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      //ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  handleDrop(e) {
    var inst = this;
    console.log("handleDrop", e);
    window.Exxx = e;
    e.preventDefault();
    e.stopPropagation();
    if (e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files.length) {
      console.log("handle fild data");
      e.preventDefault();
      e.stopPropagation();
      var files = e.originalEvent.dataTransfer.files;
      if (files.length > 1) {
        alert("Cannot handle multiple dropped files");
        return;
      }
      var file = files[0];
      console.log("file", file);
      console.log("files", e.originalEvent.dataTransfer.files)
      var reader = new FileReader();
      reader.onload = (e) => {
        var jstr = reader.result;
        console.log("got jstr", jstr);
        var data = JSON.parse(jstr);
        console.log("data", data);
        inst.clear();
        //inst.loadGarden(data);
      };
      var txt = reader.readAsText(file);
    }
    else {
      //alert("other drop event");
      const lines = e.originalEvent.dataTransfer.getData("text/uri-list").split("\n");
      lines.forEach(async line => {
        console.log("*** line", line);
        var url = line;
        //await inst.addURL(url);
      });
    }
  }


}


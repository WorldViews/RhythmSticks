
"use strict";

class MusicTool extends CanvasTool {
  constructor(name, opts) {
    super(name, opts);
    opts = opts || {};
    var ctx = this.ctx;
    ctx.strokeStyle = "white";
    ctx.globalAlpha = .85;
    this.lockZoom = true;
    this.lockPan = true;
    this.game = null;
  }

  addGame(opts) {
    var opts = {
      "type": "RhythmGame",
      "id": "game",
      "name": "Rhythm Toy",
      "lineWidth": 4,
      "fillStyle": "brown",
      "width": 800,
      "height": 800,
      "x": 0,
      "y": 0,
      songs: opts.songs,
      initialSong: opts.initialSong
    }
    var game = new RhythmGame(opts);
    this.game = game;
    game.tool = this;
    this.addGraphic(game);
    game.addScorer();
    return game;
  }

  handleMouseDown(e) {
    this.handleMouseDrag(e)
    /*
    if (e.which != 1)
      return;
    var x = e.clientX;
    var y = e.clientY;
    var pt = this.getMousePos(e);
    */
  }

  handleMouseUp(e) {
    //console.log("MusicTool.handleMouseUp");
    this.dragPanning = false;
  }

  handleMouseDrag(e) {
    var game = this.game;
    var pt = this.getMousePos(e);
    var a = Math.atan2(pt.y, pt.x);
    var r = Math.sqrt(pt.x * pt.x + pt.y * pt.y);
    //console.log("MusicTool.handleMouseDrag", r);
    if (r > game.rMax + 80) {
      // this is not a good mechanism, but is a quick and dirty way
      // to be able to get beat events by the user clicking in the
      // window far away from central things
      console.log("MusicTool noticeBeat");
      game.noticeBeat();
    }
    if (r > game.rMax && (e.shiftKey || game.allowScrub()))
      this.dragPanning = true;
    if (!this.dragPanning)
      return;
    //console.log("angle", a);
    var dur = game.mplayer.getDuration();
    var pt = dur * a / (2 * Math.PI);
    if (pt < 0)
      pt += dur;
    game.mplayer.setPlayTimeNearestP(pt);
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

}


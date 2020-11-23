
"use strict";


class Pic extends CanvasTool.ImageGraphic {
  constructor(opts) {
    super(opts);
    this.targetURL = opts.targetURL;
  }

  onClick(e) {
    if (!this.targetURL)
      return true;
    this.tool.showPage(this.targetURL);
    //$("#webView").src = this.targetURL;
    //window.open(this.targetURL, "webView");
    return true;
  }
}

//TODO: modify draw method of this to produce nice frame.
class FramedPic extends Pic {
  constructor(opts) {
    super(opts);
    this.fillStyle = "brown";
  }
  draw(canvas, ctx) {
    var bd = 4;
    this.drawRect(canvas, ctx,
      this.x, this.y,
      this.width + 2 * bd, this.height + 2 * bd);
    if (!this.image)
      return;
    ctx.drawImage(
      this.image,
      this.x - this.width / 2.0, this.y - this.height / 2.0,
      this.width, this.height);
  }
}

class Circle extends CanvasTool.Graphic {
  constructor(opts) {
    super(opts);
    console.log("Circle ", opts);
  }
}


class TaikoTool extends CanvasTool {
  constructor(name, opts) {
    super(name, opts);
    opts = opts || {};
    var ctx = this.ctx;
    ctx.strokeStyle = "white";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowColor = "#333";
    ctx.globalAlpha = .85;
    this.user = null;
    this.plantOnClick = false;
    this.initGUI();
  }

  addTaiko() {
    var opts = {
      "type": "TaikoBox",
      "id": "taiko",
      "name": "Taiko Box",
      "lineWidth": 4,
      "fillStyle": "brown",
      "width": 300,
      "height": 300,
      "x": 0,
      "y": 0
    }
    var taikoBox = new TaikoBox(opts);
    this.addGraphic(taikoBox);
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

  async initFirebase() {
    var inst = this;
    if (inst.firebase)
      return;
    var firebaseConfig = {
      apiKey: "AIzaSyABtA6MxppX03tvzqsyO7Mddc606DsHLT4",
      authDomain: "gardendatabase-1c073.firebaseapp.com",
      databaseURL: "https://gardendatabase-1c073.firebaseio.com",
      projectId: "gardendatabase-1c073",
      storageBucket: "gardendatabase-1c073.appspot.com",
      messagingSenderId: "601117522914",
      appId: "1:601117522914:web:90b28c88b798e45f5fd7bb"
    };

    // Initialize Firebase
    //TODO: move firebase initialization to early place before we
    // go to fetch data.
    firebase.initializeApp(firebaseConfig);
    inst.firebase = firebase;
    var db = firebase.database();
    inst.firebaseDB = db;

    firebase.auth().onAuthStateChanged(user => {
      console.log("authStateChange", user);
      inst.user = user;
      if (user) {
        // User is signed in.
        var displayName = user.displayName;
        var email = user.email;
        var emailVerified = user.emailVerified;
        var photoURL = user.photoURL;
        var isAnonymous = user.isAnonymous;
        var uid = user.uid;
        var providerData = user.providerData;
        $("#userInfo").html(user.displayName + " " + user.email);
        $("#login").html("signout");
        inst.heartBeater = setInterval(() => inst.produceHeartBeat(), 15000);
        // ...
      } else {
        // User is signed out.
        // ...
        $("#userInfo").html("guest");
        $("#login").html("login");
        if (inst.heartBeater) {
          clearInterval(inst.heartBeater);
          inst.heartBeater = null;
        }
      }
    });
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


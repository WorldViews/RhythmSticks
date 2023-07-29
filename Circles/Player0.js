//  Author:  Doc Zeno
//  Date:    Jan 1st. 2017
"use strict";

let synth = null;

function initSynth() {
    synth = new WebAudioTinySynth({ voices: 64 });
    for (var i = 0; i < 128; ++i) {
        var o = document.createElement("option");
        o.innerHTML = synth.getTimbreName(0, i);
        document.getElementById("prog").appendChild(o);
    }
    //this.SetProgram(116);
    setInterval(function () {
        var st = synth.getPlayStatus();
        document.getElementById("status").innerHTML = 
            "Play:" + st.play + "  Pos:" + st.curTick + "/" + st.maxTick;
    }, 100);
}

function keyStart(key=60) {
    console.log("keyStart", key);
    synth.noteOn(0, key, 100);
}

function keyStop(key=60) {
    console.log("keyStop", key);
    synth.noteOff(0, key);
}

// return time in seconds
function getTime() {
    return new Date().getTime() / 1000;
}

// linear interpolation between x0 and x1
// f is fraction between 0 and 1
function interp(x0, x1, f) {
    return x0*(1-f) + x1*f;
}

// ramp up from yLow to yHigh in interval from
// 0 to T/2, then ramp down from yHigh to yLow
// in interval from T/2 to T
function rampUpAndDown(t, T=20, yLow=1, yHigh=2)
{
    var y;
    let T2 = T/2;
    let s = t % T;
    if (s < T2) {
        y = interp(yLow, yHigh, s/T2);
    }
    else {
        y = interp(yHigh, yLow, (s - T2)/T2);
    }
    //console.log("rampUpAndDown", t, T, yLow, yHigh, y);
    return y;
}

let MNOTE = 40;

class Note {
    constructor(t, mnote) {
        this.t = t;
        this.state = "off";
        this.mnote = mnote;
    }

    setState(state) {
        if (this.state != state) {
            this.state = state;
            if (state == "on") {
                keyStart(this.mnote);
            } else {
                keyStop(this.mnote);
            }
        }
    }
}

class Part {
    constructor(i, cx, cy) {
        this.i = i;
        //this.speed = 0.5 * Math.pow(Math.sqrt(2), i);
        this.speed = 0.5 * Math.pow(2, 3-i);
        //this.speed = Math.pow(2, 3-i);
        this.T = 10;
        this.t = 0;
        this.r = 50 + i * 20;
        this.cx = cx;
        this.cy = cy;
        //this.notes = [new Note(0, MNOTE++), new Note(0.5, MNOTE++)];
        this.notes = [new Note(0, MNOTE), new Note(0.5, MNOTE+4)];
        MNOTE += 12;
        //this.notes = [0];
        this.nsectors = 4;
    }

    setSpeed(speed) {

    }

    setT(t) {
        this.t = t*this.speed;
    }

    getNoteGraphic(i) {
        let note = this.notes[i];
        let tn = this.t + this.T * note.t;
        let nrevs = tn / this.T;
        let nr = nrevs - Math.floor(nrevs);
        note.setState(nr < 0.1 ? "on" : "off");
        let th = 2 * Math.PI * nrevs;
        let x = this.cx + this.r * Math.sin(th);
        let y = this.cy - this.r * Math.cos(th);
        let color = note.state == "on" ? "green" : "gray";
        return {x,y, color}
    }
}

// class for circle animator
class Player {
    // constructor
    constructor(canvasId) {
        this.color = "gray";
        this.speed = 1;
        this.t = 0;
        this.prevT = null;
        this.playing = false;
        this.canvas = document.getElementById(canvasId);
        this.cx = this.canvas.width / 2;
        this.cy = this.canvas.height / 2;
        this.ctx = this.canvas.getContext("2d");
        this.parts = [];
        this.numParts = 4;
        for (let i = 0; i < this.numParts; i++) {
            this.parts.push(new Part(i, this.cx, this.cy));
        }
    }

    reset() {
        this.t0 = getTime();
        this.prevT = this.t0;
        this.t = 0;
        for (let i = 0; i < this.numParts; i++) {
            this.parts[i].setT(0);
        }
    }

    // start animation loop
    start() {
        // request animation frame
        this.reset();
        if (this.playing) {
            return;
        }
        this.playing = true;
        window.requestAnimationFrame(this.update.bind(this));
    }

    stop() {
        this.playing = false;
    }

    // updator called every frame
    update() {
        console.log("Player.update");
        if (!this.playing) {
            return;
        }
        let t = getTime();
        let dt = t - this.prevT;
        this.prevT = t;
        let twiddle = true;
        if (twiddle) {
            this.speed = rampUpAndDown(t - this.t0, 20, 1, 3);
        }
        $("#speed").html("speed:"+this.speed.toFixed(2));
        console.log("speed",  this.speed.toFixed(2), this.speed);
        this.t += this.speed * dt;
        // set t for each part
        for (let i = 0; i < this.numParts; i++) {
            this.parts[i].setT(this.t);
        }
        // draw the parts
        this.draw(this.ctx);
        // request animation frame
        window.requestAnimationFrame(this.update.bind(this));
    }

    // draw the animation frame
    draw(ctx) {
        // clear the canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // draw each part
        for (let i = 0; i < this.parts.length; i++) {
            this.drawPart(ctx, this.parts[i]);
        }
    }

    // draw circle i about center
    drawPart(ctx, part) {
        // draw circle
        let x = this.cx;
        let y = this.cy;
        ctx.beginPath();
        ctx.arc(x, y, part.r, 0, 2 * Math.PI, false);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#003366';
        ctx.stroke();
        for (let i = 0; i < part.notes.length; i++) {
            let ng = part.getNoteGraphic(i);
            //console.log(note);
            ctx.beginPath();
            ctx.arc(ng.x, ng.y, 5, 0, 2 * Math.PI, false);
            ctx.fillStyle = ng.color;
            ctx.fill();
        }
    }


}




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
    return synth;
}

function keyStart(key = 60, v=100) {
    //console.log("keyStart", key, v);
    synth.noteOn(0, key, v);
}

function keyStop(key = 60) {
    //console.log("keyStop", key);
    synth.noteOff(0, key);
}

// return time in seconds
function getTime() {
    return new Date().getTime() / 1000;
}

function log2(x) {
    return Math.log(x) / Math.log(2);
}

// linear interpolation between x0 and x1
// f is fraction between 0 and 1
function interp(x0, x1, f) {
    return x0 * (1 - f) + x1 * f;
}

// ramp up from yLow to yHigh in interval from
// 0 to T/2, then ramp down from yHigh to yLow
// in interval from T/2 to T
function rampUpAndDown(t, T = 20, yLow = 1, yHigh = 2) {
    var y;
    let T2 = T / 2;
    let s = t % T;
    if (s < T2) {
        y = interp(yLow, yHigh, s / T2);
    }
    else {
        y = interp(yHigh, yLow, (s - T2) / T2);
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
        this.v = 100;
    }

    setState(state, v) {
        if (this.state != state) {
            this.state = state;
            if (state == "on") {
                keyStart(this.mnote, v);
            } else {
                keyStop(this.mnote);
            }
        }
    }
}

class Part {
    constructor(i, cx, cy) {
        this.i = i;
        this.T = 10;
        this.t = 0;
        this.setS0(1);
        this.cx = cx;
        this.cy = cy;
        this.vel = 100;
        let major = [0, 2, 4, 5, 7, 9, 11, 12];
        let chromatic = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        let fixed = [0, 0, 0, 0, 0, 0, 0, 0];
        let melody = fixed;
        //melody = major;
        melody = chromatic;
        this.setNotes(melody);
    }

    setNotes(melody) {
        this.notes = [];
        let numSteps = melody.length;
        for (let i = 0; i < numSteps; i++) {
            this.notes.push(new Note(i / numSteps, MNOTE + melody[i]));
        }
    }

    // set the reference speed.  We are a power of 2 different
    // from that speed.
    setS0(s0) {
        this.speed = s0 * Math.pow(2, -this.i);
        this.r = 100 - log2(this.speed) * 30;
        this.setWeight();
    }

    incT(dt) {
        this.t += dt * this.speed;
    }

    setT(t) {
        this.t = t * this.speed;
    }

    setWeight() {
        let k = log2(this.speed);
        let d = k + 1;
        let w = 1/(1 + 4*d*d);
        this.vel = Math.floor(60 * w);
        this.w = w;
    }

    getNoteGraphic(i) {
        let note = this.notes[i];
        note.vel = this.vel;
        let tn = this.t + this.T * note.t;
        let nrevs = tn / this.T;
        let nr = nrevs - Math.floor(nrevs);
        note.setState(nr < 0.05 ? "on" : "off", this.vel);
        let th = 2 * Math.PI * nrevs;
        let x = this.cx + this.r * Math.sin(th);
        let y = this.cy - this.r * Math.cos(th);
        let a = this.w;
        //let color = note.state == "on" ? "rgb(0, 255, 0)" : "gray";
        let color = note.state == "on" ? `rgba(0, 255, 0, ${a})` :`rgba(100,100,100,${a})`;
        return { x, y, color }
    }
}

// class for circle animator
class Player {
    // constructor
    constructor(canvasId) {
        this.color = "gray";
        this.speed = 4;
        this.t = 0;
        this.prevT = null;
        this.playing = false;
        this.canvas = document.getElementById(canvasId);
        this.cx = this.canvas.width / 2;
        this.cy = this.canvas.height / 2;
        this.ctx = this.canvas.getContext("2d");
        this.parts = [];
        this.prevK = 0;
        this.prevK = Math.floor(log2(this.speed));
        let numParts = 5;
        for (let i = 0; i < numParts; i++) {
            this.parts.push(new Part(i - 1, this.cx, this.cy));
        }
    }

    reset() {
        this.t0 = getTime();
        this.prevT = this.t0;
        this.t = 0;
        for (let i = 0; i < this.parts.length; i++) {
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
        //console.log("Player.update");
        if (!this.playing) {
            return;
        }
        let t = getTime();
        let dt = t - this.prevT;
        this.prevT = t;
        let twiddle = 0;
        if (twiddle) {
            this.speed = rampUpAndDown(t - this.t0, 20, 1, 3);
        }
        this.speed *= 0.999;
        $("#speed").html("speed:" + this.speed.toFixed(2));
        let k = Math.floor(log2(this.speed));
        if (k != this.prevK) {
            //console.log("speed", this.speed, k);
            let part = new Part(k, this.cx, this.cy);
            part.setT(this.t);
            this.parts.push(part);
            this.parts.shift();
        }
        this.prevK = k;
        //console.log("speed",  this.speed.toFixed(2), this.speed);
        let f = 2;
        dt *= f;
        this.t += this.speed * dt;
        // set t for each part
        for (let i = 0; i < this.parts.length; i++) {
            let part = this.parts[i];
            part.setS0(this.speed);
            part.incT(dt);
            //this.parts[i].setT(this.t);
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
        let r = part.r;
        if (r < 0) {
            r = 0.5;
        }
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI, false);
        ctx.lineWidth = 1;
        ctx.lineWidth = part.w;
        ctx.strokeStyle = '#003366';
        ctx.stroke();
        let drawLabels = 1;
        if (drawLabels) {
            let str = "" + part.i+" "+part.vel+" "+part.w.toFixed(2);
            // write str as text at x,y+part.r
            ctx.font = "14px Arial";
            ctx.fillStyle = "black";
            ctx.fillText(str, x-5, y - (r + 5));
        }
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




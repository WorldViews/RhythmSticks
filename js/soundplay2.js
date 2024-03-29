
var USE_DEVICE = true;
var mouseIsDown = false; //DGK
var ppad = null;
var curProg = 0;
var curOct = 0;
var curNote = 60;
var curMidi = 0;
var midiPort = [];
var midiOutPort = [];
var outPort = null;
var currentPort = -1;

function dumpSong(synth) {
    console.log("===========================================");
    console.log("Midi dump");
    types = {
        0x80: "noteOn",
        0x90: "noteOff"
    }
    function tname(t) {
        if (types[t])
            return types[t];
        return t;
    }
    var song = synth.song;
    for (var key in song) {
        console.log(key, song[key]);
    }
    var events = song.ev;
    for (var i=0; i<events.length; i++) {
        var ev = events[i];
        var t = ev.m[0];
        console.log(ev.t, tname(t), ev.m);
    }
}

function Init() {
    InitMidi();
    synth = document.getElementById("tinysynth");
    kb = document.getElementById("kb");
    kb.addEventListener("change", KeyIn);
    var sh = document.getElementById("shot");
    ppad = document.getElementById("ppad");
    ppad.height = 300; // not sure why this is needed -- the canvas is specified as 300px
    synth.ready().then(() => {
        sh.addEventListener("mousedown", function () {
            synth.send([0x90 + curMidi, curNote, 100], 0);
        });
        sh.addEventListener("mouseup", function () {
            synth.send([0x80 + curMidi, curNote, 100], 0);
        });
        ppad.addEventListener("mousedown", function (e) {
            console.log("*** ppad down", e);
            mouseIsDown = true;
            UpdateFromPad(e);
        });
        ppad.addEventListener("mouseup", function (e) {
            console.log("*** ppad up", e);
            mouseIsDown = false;
            UpdateFromPad(e);
        });
        ppad.addEventListener("mousemove", function (e) {
            console.log("*** ppad up", e);
            if (!mouseIsDown)
                return;
            UpdateFromPad(e);
        });

        for (var i = 0; i < 128; ++i) {
            var o = document.createElement("option");
            o.innerHTML = (i + 1) + " : " + synth.getTimbreName(0, i);
            document.getElementById("prog").appendChild(o);
        }
        ProgChange(0);
    });
}

function MidiIn(e) {
    if (synth) {
        switch (e.data[0] & 0xf0) {
            case 0x90:
                kb.setNote(e.data[2] ? 1 : 0, e.data[1]);
                break;
            case 0x80:
                kb.setNote(0, e.data[1]);
        }
        e.data[1] = e.data[1] + curOct * 12;
        synth.send(e.data, 0);
    }
}

function SelectMidiOut(n) {
    console.log("Select Midi Out", n);
    outPort = midiOutPort[0].value;
}

function SendMsg(msg, t) {
    console.log("SendMsg", msg);
    try {
        SendOut(msg[0], msg[1], msg[2]);
    }
    catch (e) {
        console.log("error on play");
    }
}

function SendOut(com, note, velocity) {
    if (outPort == null) {
        console.log("No out port");
        return;
    }
    com = com || 144;
    note = note || 75;
    velocity = velocity;
    if (velocity == null)
        velocity = 10;
    var cmd = [com, note, velocity];
    console.log("cmd", cmd);
    outPort.send([com, note, velocity])
}

function SelectMidi(n) {
    //  console.log("Select Port:"+n+":"+(n>=0?midiPort[n].name:"none"));
    console.log(midiPort);
    document.getElementById("midiport").selectedIndex = n + 1;
    if (currentPort >= 0)
        midiPort[currentPort].removeEventListener("midimessage", MidiIn);
    currentPort = n;
    if (currentPort >= 0) {
        midiPort[currentPort].addEventListener("midimessage", MidiIn);
    }
}

var ACCESS = null;// for debugging

function InitMidi() {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess().then(
            function (access) {
                ACCESS = access;
                midiOutPort = [];
                console.log("MIDI ready.");
                setTimeout(function () {
                    var it = access.inputs.values();
                    for (var i = it.next(); !i.done; i = it.next()) {
                        var e = document.createElement("option");
                        e.innerHTML = i.value.name;
                        document.getElementById("midiport").appendChild(e);
                        midiPort.push(i.value);
                    }
                    if (midiPort.length > 0)
                        SelectMidi(0);
                    var ot = access.outputs.values();
                    console.log("ot", ot);
                    for (var o = ot.next(); !o.done; o = ot.next()) {
                        console.log("MidiOut ", o);
                        midiOutPort.push(o);
                    }
                    if (midiOutPort.length > 0) {
                        SelectMidiOut(0);
                    }
                }, 10);
            },
            function () {
                console.log("MIDI is not available.");
            }
        );
    }
}

function loadMidi(files) {
    var reader = new FileReader();
    reader.onload = function (e) {
        synth.loadMIDI(reader.result);
        dumpSong(synth);
    }
    reader.readAsArrayBuffer(files[0]);
}

function UpdateFromPad(e) {
    var x = e.offsetX;
    var y = e.offsetY;
    console.log("UpdateFromPad", x, y);
    console.log("canvas", ppad.width, ppad.height);
    var nx = x / 300;
    var ny = y / 300;
    //synth.masterVol = nx;
    //synth.reverbLev = ny;
    //document.getElementById("g1").value = pg.p[i].g;
    document.getElementById("t1").value = 5 * nx;
    document.getElementById("v1").value = 5 * ny;
    Edit();
    var ctx = ppad.getContext("2d");
    ctx.fillStyle = "pink";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, ppad.width, ppad.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "red";
    var r = 10;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
}

function Ctrl() {
    if (typeof (synth) != "undefined") {
        synth.masterVol = document.getElementById("vol").value;
        synth.reverbLev = document.getElementById("rev").value;
        synth.loop = document.getElementById("loop").value;
        console.log("vol", synth.masterVol);
        console.log("reverb", synth.reverbLev);
    }
}

function KeyIn(e) {
    curNote = e.note[1] + curOct * 12;
    document.getElementById("shot").innerHTML = curNote;
    if (e.note[0])
        synth.send([0x90 + curMidi, curNote, 100]);
    else
        synth.send([0x80 + curMidi, curNote, 0]);
    if (curMidi == 9) {
        var w = synth.drummap[curNote - 35];
        ViewParam(w);
    }
}

function ChChange(e) {
    curMidi = e.selectedIndex;
}

function ViewDef(pg) {
    var s = JSON.stringify(pg.p);
    s = s.replace(/}/g, ",}").replace(/\"([a-z])\"/g, "$1");
    var ss = ["g:0,", "t:1,", "f:0,", "v:0.5,", "a:0,", "h:0.01,", "d:0.01,", "s:0,", "r:0.05,", "p:1,", "q:1", "k:0"];
    for (p = 0; p < ss.length; ++p) {
        s = s.replace(ss[p], ",");
        s = s.replace(ss[p], ",");
        s = s.replace(ss[p], ",");
    }
    s = s.replace(/{,/g, "{");
    s = s.replace(/,+/g, ",");
    document.getElementById("patch").value = s;
}

function EnableRow() {
    oscs = document.getElementById("oscs").selectedIndex + 1;
    for (var i = 2; ; ++i) {
        var o = document.getElementById("osc" + i)
        if (!o)
            break;
        ids = ["g", "w", "v", "t", "f", "a", "h", "d", "s", "r", "p", "q", "k"];
        for (id = 0; id < ids.length; ++id) {
            document.getElementById(ids[id] + i).disabled = (oscs >= i) ? false : true;
            document.getElementById(ids[id] + i).style.background = (oscs >= i) ? "#fff" : "#ccc";
        }
    }
}

function Edit() {
    if (window.synth == undefined)
        return;
    var prog;
    if (curMidi == 9)
        prog = synth.drummap[curNote - 35];
    else
        prog = synth.program[curProg];
    var oscs = document.getElementById("oscs").selectedIndex + 1;
    EnableRow();
    if (prog.p.length > oscs)
        prog.p.length = oscs;
    if (prog.p.length < oscs)
        for (var i = oscs - prog.p.length; i >= 0; --i)
            prog.p.push({ g: 0, w: "sine", v: 0, t: 0, f: 0, a: 0, h: 0, d: 1, s: 0, r: 1, b: 0, c: 0, p: 1, q: 1, k: 0 });
    for (var i = 0; i < oscs; ++i) {
        prog.p[i].g = GetVal("g" + (i + 1));
        prog.p[i].w = document.getElementById("w" + (i + 1)).value;
        prog.p[i].v = GetVal("v" + (i + 1));
        prog.p[i].t = GetVal("t" + (i + 1));
        prog.p[i].f = GetVal("f" + (i + 1));
        prog.p[i].a = GetVal("a" + (i + 1));
        prog.p[i].h = GetVal("h" + (i + 1));
        prog.p[i].d = GetVal("d" + (i + 1));
        prog.p[i].s = GetVal("s" + (i + 1));
        prog.p[i].r = GetVal("r" + (i + 1));
        prog.p[i].p = GetVal("p" + (i + 1));
        prog.p[i].q = GetVal("q" + (i + 1));
        prog.p[i].k = GetVal("k" + (i + 1));
    }
    ViewDef(prog);
}

function ViewParam(pg) {
    if (!pg)
        return;
    var oscs = pg.p.length;
    document.getElementById("oscs").selectedIndex = oscs - 1;
    var o = document.getElementById("osc2").firstChild;
    while (o = o.nextSibling) {
        if (o.firstChild)
            o.firstChild.disabled = (oscs >= 2) ? false : true;
    }
    o = document.getElementById("osc3").firstChild;
    while (o = o.nextSibling) {
        if (o.firstChild)
            o.firstChild.disabled = (oscs >= 3) ? false : true;
    }
    o = document.getElementById("osc4").firstChild;
    while (o = o.nextSibling) {
        if (o.firstChild)
            o.firstChild.disabled = (oscs >= 4) ? false : true;
    }
    document.getElementById("name").innerHTML = pg.name + " : ";
    for (var i = 0; i < oscs; ++i) {
        document.getElementById("g" + (i + 1)).value = pg.p[i].g;
        document.getElementById("w" + (i + 1)).value = pg.p[i].w;
        document.getElementById("v" + (i + 1)).value = pg.p[i].v;
        document.getElementById("t" + (i + 1)).value = pg.p[i].t;
        document.getElementById("f" + (i + 1)).value = pg.p[i].f;
        document.getElementById("a" + (i + 1)).value = pg.p[i].a;
        document.getElementById("h" + (i + 1)).value = pg.p[i].h;
        document.getElementById("d" + (i + 1)).value = pg.p[i].d;
        document.getElementById("s" + (i + 1)).value = pg.p[i].s;
        document.getElementById("r" + (i + 1)).value = pg.p[i].r;
        document.getElementById("p" + (i + 1)).value = pg.p[i].p;
        document.getElementById("q" + (i + 1)).value = pg.p[i].q;
        document.getElementById("k" + (i + 1)).value = pg.p[i].k;
    }
    ViewDef(pg);
}

function OctChange(o) {
    curOct = o;
}

function ProgChange(p) {
    if (synth) {
        synth.send([0xc0, p]);
        if (curMidi != 9) {
            curProg = p;
            var pg = synth.program[curProg];
            ViewParam(pg);
        }
    }
}

function SetQuality(n) {
    var pg;
    synth.quality = n;
    if (curMidi == 9)
        pg = synth.drummap[curNote];
    else
        pg = synth.program[curProg];
    ViewParam(pg);
}

function GetVal(id) {
    var s = +document.getElementById(id).value;
    if (isNaN(s))
        s = 0;
    return s;
}

function OpenEditor() {
    var e = document.getElementById("soundeditor");
    if (e.style.display == "block")
        e.style.display = "none";
    else
        e.style.display = "block";
}

function Sustain(b) {
    synth.send([0xb0 + curMidi, 64, b ? 127 : 0], 0);
}

window.onload = () => {
    Init();
    document.addEventListener("keydown", function (e) {
        if (e.keyCode == 16) {
            document.getElementById("sus").checked = true;
            Sustain(true);
        }
    });
    document.addEventListener("keyup", function (e) {
        if (e.keyCode == 16) {
            document.getElementById("sus").checked = false;
            Sustain(false);
        }
    })
}

function About() {
    var el = document.getElementById("aboutcontents");
    console.log(el.style.height)
    if (el.style.height == "" || el.style.height == "0px") {
        el.style.height = "400px";
        el.style.padding = "20px 20px";
    }
    else {
        el.style.height = "0px";
        el.style.padding = "0px 20px";
    }
}

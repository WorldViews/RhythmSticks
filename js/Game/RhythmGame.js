
"use strict"

var ALIAS = { "rim": "cowbell", "center": "taiko" };
const SUN_MOON_STAR_SONG = "SUN_MOON_STAR";
const TAIKO_SONG = "TAIKO";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function contains(str, parts) {
    for (var i = 0; i < parts.length; i++)
        if (str.indexOf(parts[i]) >= 0)
            return true;
    return false;
}

const SHIKO = `moon - moon - | sun - sun - | moon - moon - | sun sun - - |
sun - star star | sun - star star | sun - star star | moon moon - -`;

const FANGA1 = `sun rest sun sun | rest sun moon moon | sun rest rest sun | sun rest moon moon`;

const DJEMBE3 = `sun moon moon | sun moon moon | moon moon star | moon - -`;

// this is a kind of player that uses midi.
class MPlayer extends MidiPlayTool {
    constructor(game, opts) {
        super(opts);
        this.game = game;
        this.midiPrefix = opts.midiPrefix || "midi/";
        this.setupTrackInfo();
        //this.loadInstrument("acoustic_grand_piano");
        this.startUpdates();
    }

    handleNote(t0, note) {
        //console.log("label", note.label);
        if (note.type == "marker")
            return;
        if (note.type == "metronome") {
            if (this.game.useMetronome()) {
                this.game.soundPlayer.playNote("cowbell", .1);
            }
            return;
        }
        if (this.game.useMidi()) {
            super.handleNote(t0, note);
        }
        else {
            var v = 3;
            var ALIAS = { "rim": "cowbell", "center": "taiko" };
            var label = note.label;
            if (ALIAS[label])
                label = ALIAS[label];
            this.game.soundPlayer.playNote(label, v);
        }
        this.game.observeNote(t0, note);
    }
}

class DrumPic extends CanvasTool.ImageGraphic {
    constructor(game, name, x, y, width, height, url) {
        var opts = { id: name, x, y, width, height, url };
        super(opts);
        this.label = name;
        this.game = game;
    }

    onClick(e) {
        console.log("**************** click on ", this.label);
        this.game.soundPlayer.playNote(this.label);
        this.game.strikeDrum("note");
    }
}

class RhythmGame extends CanvasTool.RectGraphic {

    constructor(opts) {
        opts = opts || {};
        opts.instrument = "acoustic_grand_piano";
        super(opts);
        var inst = this;
        //
        this.mplayer = new MPlayer(this, opts);
        //this.mplayer.noteObserver = (ch, pitch, v, dur, t) => this.observeNote(ch, pitch, v, dur, t);

        // for easier debugging in console
        window.MIDI_BOX = this;
        window.MPLAYER = this.mplayer;
        this.mplayer.stateObserver = state => inst.observeState(state);

        var instrument = opts.instrument || "taiko_drum";
        //this.loadInstrument(instrument);
        this.initMIDIDevices();

        // 
        this.soundPlayer = new SamplesPlayer();
        //this.fillStyle = "beige";
        this.fillStyle = null;
        this.strokeStyle = null;
        //this.notes = [];
        this.targets = {};
        this.midiParser = new MidiParser();
        this.useWheel = true;
        this.moveNotes = false;
        this.setupGUI();
        this.scorer = null;
        this.mplayer.setProgram(116);
        //this.mplayer.setProgram(0);
        // for debugging
        window.WHEEL_BOX = this;
        var icons = {}
        icons['sun'] = new CanvasTool.ImageGraphic({ url: "images/sun.png", width: 40, height: 40 });
        icons['moon'] = new CanvasTool.ImageGraphic({ url: "images/moon.png", width: 40, height: 40 });
        icons['star'] = new CanvasTool.ImageGraphic({ url: "images/star.png", width: 40, height: 40 });
        this.icons = icons;
        this.songType = SUN_MOON_STAR_SONG;
        this.setupDrumPics();
        this.rhythmStick = null;
        if (opts.initialSong)
            this.playSong(opts.initialSong, false);
    }

    setupGUI() {
        var inst = this;
        $("#kuchiShoga").keypress(e => inst.noticeSongKeypress(e));
        $("#kuchiShoga").change(e => inst.noticeNewSong());
        $("#ff1").click(e => inst.playFastAndFurious1());
        $("#ff2").click(e => inst.playFastAndFurious2());
        $("#shiko").click(e => inst.playSong(SHIKO));
        $("#fanga1").click(e => inst.playSong(FANGA1));
        $("#djembe3").click(e => inst.playSong(DJEMBE3));
        $("#matsuri").click(e => inst.playMatsuri());
        $("#useWheel").change(e => inst.toggleUseWheel(e));
        $("#moveNotes").change(e => inst.toggleMoveNotes(e));
        $("#bpmSlider").change(e => inst.handleBPMSlider(e));
        inst.handleBPMSlider();
    }

    /*
    onClick() {
        console.log("RhythmGame.onClick");
    }
    */

    playMidiNote(i) {
        console.log("MidiPlayer.playMidiNote", i);
        this.mplayer.noteOn(0, i, 100, 0);
        this.mplayer.noteOff(0, i, 100, 0.1);
    }

    useMidi() {
        return $("#useMidi").is(":checked");
    }

    useMetronome() {
        return $("#metronome").is(":checked");
    }

    collapseTracks() {
        return $("#collapse").is(":checked");
    }

    toggleUseWheel(e) {
        this.useWheel = $("#useWheel").is(":checked");
        this.setupDrumPics();
    }

    toggleMoveNotes(e) {
        this.moveNotes = $("#moveNotes").is(":checked");
    }

    handleBPMSlider(e) {
        var val = $("#bpmSlider").val();
        var bpm = Number(val);
        console.log("bpm", bpm);
        var p = this.mplayer.isPlaying;
        $("#bpmLabel").html("" + bpm + " BMP");
        this.mplayer.pausePlaying();
        this.mplayer.setBPM(bpm);
        if (p)
            this.mplayer.startPlaying();
    }

    getTime() {
        //return this.mplayer.getPlayTime();
        return getClockTime();
    }

    addScorer(scorer) {
        this.scorer = scorer || new Scorer(this.tool);
    }

    tick() {
        if (this.scorer)
            this.scorer.update(this.getTime());
    }


    playFastAndFurious1() {
        // https://drive.google.com/file/d/1ehq3Ndf1KEbuJZpi7xc-P-cFxjPh_b-Q/view
        var ff1 = `
        don don  don  don  ka doko doko doko
        ka  doko doko doko ka doko doko doko
        don don  don  don  ka doko doko doko
        ka  doko doko doko ka doko doko doko
        `;
        this.playSong(ff1);
    }

    playFastAndFurious2() {
        var ff2 = `
        ka doko kara doko ka   doko kara doko
        ka doko kara doko kara doko kara doko
        ka doko kara doko ka   doko kara doko
        ka doko kara doko kara doko kara doko
        `;
        this.playSong(ff2);
    }

    playMatsuri(autoStart) {
        this.playSong(MATSURI, false);
    }

    noticeSongKeypress(e) {
        var keycode = (e.keyCode ? e.keyCode : e.which);
        window.E = e;
        if (keycode == '13' && !e.shiftKey) {
            this.noticeNewSong();
        }
    }

    noticeNewSong() {
        var song = $("#kuchiShoga").val();
        console.log("noticeNewSong", song);
        this.playSong(song);
    }

    async playSong(song, autoStart) {
        var str = song.toLowerCase();
        if (contains(str, ["sun", "moon", "star"]))
            this.songType = SUN_MOON_STAR_SONG;
        if (contains(str, ["doko", "don", "ka"]))
            this.songType = TAIKO_SONG;
        console.log("playKuchiShoga", song, autoStart);
        this.setupDrumPics();
        song = song.trim();
        //$("#kuchiShoga").val(kuchiShoga);
        this.mplayer.pausePlaying();
        await sleep(0.5);
        this.midiParser.addKuchiShoga(song);
        var midiObj = this.midiParser.getMidiObj();
        await sleep(0.5);
        this.mplayer.playMidiObj(midiObj, autoStart);
    }

    // This is called when the midi player plays a note
    observeNote(t0, note) {
        //console.log("observeNote", ch, pitch, v, dur, t);
        if (this.scorer) {
            var pnote = { t: this.getTime() };
            this.scorer.observePlayedNote(pnote);
        }
        var ch = note.channel;
        var dur = 0.1;
        let target = this.targets[ch];
        if (target == null) {
            console.log("no target for channel", ch, note);
            return;
        }
        target.on = true;
        setTimeout(() => {
            //console.log("set style", i, prevStyle);
            target.on = false;
        }, dur * 1000);
    }

    observeState(state) {
        if (state == "play")
            this.scorer.reset();
    }

    draw(canvas, ctx) {
        if (this.useWheel)
            this.drawWheel(canvas, ctx);
        else
            this.drawBars(canvas, ctx);
        this.drawTargets(canvas, ctx);
    }

    drawTargets(canvas, ctx) {
        ctx.save();
        for (var ch in this.targets) {
            var target = this.targets[ch];
            if (!target.on)
                continue;
            ctx.fillStyle = "rgba(255,0,0,.3)";
            ctx.strokeStyle = "rgba(255,0,0,.3)";
            ctx.beginPath();
            ctx.arc(target.x, target.y, 20, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }


    // Draw the visualization in circular format
    drawWheel(canvas, ctx) {
        //super.draw(canvas, ctx);
        this.fillStyle = null;
        this.strokeStyle = "black";
        var r = 200;
        this.lineWidth = 2;
        // this.drawCircle(canvas, ctx, r, this.x, this.y);
        var a = 0;
        var pt = this.mplayer.getPlayTime();
        var dur = this.mplayer.getDuration();
        if (!this.moveNotes) {
            a = 2 * Math.PI * pt / dur;
        }
        this.drawRadialLine(canvas, ctx, a, 20, r + 10, 1);
        // now draw bars at beat times...
        //
        this.beatsPerSec = this.mplayer.beatsPerMin / 60;
        this.numBeats = dur * this.beatsPerSec;
        var rMin = this.getRadius(0) - 10;
        var rMax = this.getRadius(2) + 10;
        for (var b = 0; b < this.numBeats; b++) {
            var bt = b / this.beatsPerSec;
            if (this.moveNotes)
                bt -= pt;
            var a = bt * 2 * Math.PI / dur;
            this.drawRadialLine(canvas, ctx, a, rMin, rMax, 0.2);
        }
        // now draw the notes, as arcs
        this.drawNotesArcs(canvas, ctx);
    }

    drawRadialLine(canvas, ctx, a, r0, r1, wid) {
        var x0 = this.x + r0 * Math.cos(a);
        var y0 = this.y + r0 * Math.sin(a);
        var x1 = this.x + r1 * Math.cos(a);
        var y1 = this.y + r1 * Math.sin(a);
        this.lineWidth = wid;
        this.strokeStyle = "black";
        //console.log("drawRadLine", x0, y0, x1, y1);
        this.drawLine(canvas, ctx, x0, y0, x1, y1);
    }

    getRadius(ch) {
        this.radii = { 0: 150, 1: 170, 2: 190 };
        var r = this.radii[ch];
        if (this.collapseTracks())
            return 170;
        return r;
    }

    getTrackPos(ch) {
        this.trackPos = { 0: -100, 1: 0, 2: 100 };
        var d = this.trackPos[ch];
        if (d == null) {
            console.log("***** bad r", d, ch);
            d = 0;
        }
        return d;
    }

    drawNotesArcs(canvas, ctx) {
        // now draw notes
        var player = this.mplayer;
        var midiTrack = player.midiObj;
        if (!midiTrack)
            return;
        var pt = this.mplayer.getPlayTime();
        var groups = midiTrack.seq;
        //ctx.strokeStyle = null;
        this.clipNotes = true;
        var ystrike = this.y + 60;
        this.lineWidth = 1;
        this.strokeStyle = "gray";
        for (var i = 0; i < 3; i++) {
            this.drawCircle(canvas, ctx, this.getRadius(i), this.x, this.y);
        }
        ctx.save();
        ctx.lineWidth = 12;
        ctx.strokeStyle = "black";
        var songDur = this.mplayer.getDuration();
        if (songDur == null)
            return;
        var timeToAngle = 2 * Math.PI / songDur;
        //console.log("pt", pt);
        for (var i = 0; i < groups.length; i++) {
            //console.log("eventGroup i");
            var eventGroup = groups[i];
            var t0 = eventGroup[0];
            var events = eventGroup[1];
            for (var k = 0; k < events.length; k++) {
                var event = events[k];
                if (event.type != "note")
                    continue;
                var note = event;
                var pitch = note.pitch;
                var v = note.v;
                //var dur = note.dur/player.ticksPerBeat;
                var dur = note.dur / player.ticksPerSec;
                var t = (t0 / player.ticksPerSec);
                if (this.moveNotes)
                    t -= pt;
                if (t + dur < 0)
                    continue;
                //console.log(t0+" graphic for note pitch: "+pitch+" v:"+v+" dur: "+dur);
                //console.log("draw note", t, dur, pitch);
                var ki = pitch - 40;
                var r = this.getRadius(event.channel);
                //var icon = this.icons[event.channel];
                var icon = this.icons[event.label];
                var a0 = timeToAngle * t;
                var a1 = timeToAngle * (t + dur);
                if (icon) {
                    icon.x = this.x + r * Math.cos(a0);
                    icon.y = this.y + r * Math.sin(a0);
                    icon.draw(canvas, ctx);
                }
                else {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, r, a0, a1);
                    ctx.stroke();
                }
            }
        }
        ctx.restore();
    }

    // Draw the visualization in rectangular format
    drawBars(canvas, ctx) {
        super.draw(canvas, ctx);
        this.drawNotesBars(canvas, ctx);
    }

    drawNotesBars(canvas, ctx) {
        // now draw notes
        var player = this.mplayer;
        var midiTrack = player.midiObj;
        if (!midiTrack)
            return;
        var pt = this.mplayer.getPlayTime();
        var groups = midiTrack.seq;
        //ctx.strokeStyle = null;
        this.clipNotes = true;
        var ystrike = this.y;
        ctx.save();
        ctx.strokeStyle = "black";
        this.drawPolyLine(canvas, ctx,
            [{ x: this.x - 150, y: ystrike }, { x: this.x + 150, y: ystrike }]);
        if (this.clipNotes) {
            ctx.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
            //ctx.stroke();
            ctx.clip();
        }
        //console.log("pt", pt);
        for (var i = 0; i < groups.length; i++) {
            //console.log("eventGroup i");
            var eventGroup = groups[i];
            var t0 = eventGroup[0];
            var events = eventGroup[1];
            for (var k = 0; k < events.length; k++) {
                var event = events[k];
                if (event.type != "note")
                    continue;
                var note = event;
                var pitch = note.pitch;
                var v = note.v;
                //var dur = note.dur/player.ticksPerBeat;
                var dur = note.dur / player.ticksPerSec;
                var t = (t0 / player.ticksPerSec) - pt;
                if (t + dur < 0)
                    continue;
                //console.log(t0+" graphic for note pitch: "+pitch+" v:"+v+" dur: "+dur);
                //console.log("draw note", t, dur, pitch);
                /*
                var ki = pitch - 40;
                let target = this.targets[0];
                if (ki > 20)
                    target = this.targets[1];
                if (!target) {
                    //console.log("no key", i);
                    continue;
                }
                var heightPerSec = 50;
                var dx = 10;
                //console.log("addNote", t, dur, pitch);
                var x = target.x + 2 * ki;
                */
               var heightPerSec = 50;
                var x = this.getTrackPos(note.channel);
                var y = ystrike + t * heightPerSec;
                var h = dur * heightPerSec;
                var w = 6;
                ctx.lineWidth = 1;
                ctx.fillStyle = "green";
                ctx.beginPath();
                //if (this.fillStyle)
                //    ctx.fillRect(x - w / 2, y - h / 2, w, h);
                ctx.fillRect(x - w / 2, y, w, h);
                ctx.stroke();
                //this.drawRect(canvas, ctx, x, y, nwidth, height);
            }
        }
        ctx.restore();
    }

    async init() {
        if (this.started)
            return;
        this.started = true;
        this.playMySong();
    }

    // this is called when an event has been detected, such
    // as arduino tap or midi input event, which should cause
    // a drum strike.
    strikeDrum(label) {
        //var midi = MIDI;
        if (ALIAS[label])
            label = ALIAS[label];
        if (this.useMidi()) {
            var channel = 0;
            var pitch = 36;
            if (label == "center")
                pitch = 36;
            else
                pitch = 42;
            var v = 127;
            var t = 0;
            var dur = .2;
            console.log("strikeDrum", label, pitch);
            this.mplayer.noteOn(channel, pitch, v, t);
            this.mplayer.noteOff(channel, pitch, t + dur);
        }
        else {
            this.soundPlayer.playNote(label);
        }
        if (this.scorer) {
            var note = { t: this.getTime(), label };
            this.scorer.observeUserNote(note);
        }
    }

    async playMySong() {
        //this.mplayer.loadMidiFile("midi/sakura.mid");
        var midiObj = this.midiParser.getMidiObj();
        this.mplayer.playMidiObj(midiObj, true);
        //this.mplayer.playMidiObj(midiObj, false);
    }

    async playMidiFile() {
        var obj = await this.mplayer.loadMidiFile(url);
        console.log("playMidiFile returned", obj);
    }

    async setupDrumPics() {
        //await sleep(0.5);
        if (this.useWheel)
            this.setupDrumPicsCirc();
        else
            this.setupDrumPicsRectV();
    }

    setupDrumPicsCirc() {
        this.graphicsList = [];
        this.targets = {};
        if (this.songType == SUN_MOON_STAR_SONG) {
            var xspace = 100;
            var x = this.x - xspace;
            var y = this.y;
            var width = 80;
            var height = 80;
            this.sunPic = new DrumPic(this, "sun", x, y, width, height, "images/sun.png");
            this.targets[0] = {x,y};
            x += xspace;
            this.moonPic = new DrumPic(this, "moon", x, y, width, height, "images/moon.png");
            this.targets[1] = {x,y};
            x += xspace;
            this.starPic = new DrumPic(this, "star", x, y, width, height, "images/star.png");
            this.targets[2] = {x,y};
            this.addGraphic(this.sunPic);
            this.addGraphic(this.moonPic);
            this.addGraphic(this.starPic);
        }
        else {
            var x = this.x;
            var y = this.y;
            var width = 200;
            var height = 200;
            this.taikoPic = new DrumPic(this, "taiko", x, y, width, height, "images/taiko.svg");   
            this.addGraphic(this.taikoPic);
            y -= 50;    
            this.targets[0] = { x: x,    y };
            this.targets[1] = { x: x+25, y };
            this.targets[2] = { x: x+50, y };
        }
    }

    setupDrumPicsRectV() {
        this.graphicsList = [];
        this.targets = {};
        if (this.songType == SUN_MOON_STAR_SONG) {
            var xspace = 100;
            var x = this.x - xspace;
            var y = this.y - 100;
            var width = 80;
            var height = 80;
            this.sunPic = new DrumPic(this, "sun", x, y, width, height, "images/sun.png");
            this.targets[0] = {x,y};
            x += xspace;
            this.moonPic = new DrumPic(this, "moon", x, y, width, height, "images/moon.png");
            this.targets[1] = {x,y};
            x += xspace;
            this.starPic = new DrumPic(this, "star", x, y, width, height, "images/star.png");
            this.targets[2] = {x,y};
            this.addGraphic(this.sunPic);
            this.addGraphic(this.moonPic);
            this.addGraphic(this.starPic);
        }
        else {
            var x = this.x;
            var y = this.y - 100;
            var width = 200;
            var height = 200;
            this.taikoPic = new DrumPic(this, "taiko", x, y, width, height, "images/taiko.svg");   
            this.addGraphic(this.taikoPic);
            y -= 50;
            this.targets[0] = { x, y };
            this.targets[1] = { x: x+25, y };
            this.targets[2] = { x: x+50, y };
        }
    }

    // The remainder of functions are for using a MIDI input device
    // such as keyboard or drumpad if one is connected.
    initMIDIDevices(midiBox) {
        this.midi = null;
        var inst = this;
        // start talking to MIDI controller
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess({
                sysex: false
            }).then(md => inst.onMIDISuccess(md),
                () => inst.onMIDIFailure);
        } else {
            console.warn("No MIDI support in your browser")
        }
    }

    onMIDISuccess(midiData) {
        // this is all our MIDI data
        var inst = this;
        this.midi = midiData;
        var allInputs = this.midi.inputs.values();
        // loop over all available inputs and listen for any MIDI input
        for (var input = allInputs.next(); input && !input.done; input = allInputs.next()) {
            // when a MIDI value is received call the onMIDIMessage function
            input.value.onmidimessage = (data) => inst.onMIDImessage(data);
        }
    }

    // on failure
    onMIDIFailure() {
        console.warn("Not recognising MIDI controller")
    }

    onMIDImessage(message) {
        //console.log("midi msg", messageData);
        window.MMSG = message;
        var data = message.data;
        var midiId = data[0];
        var dsId = data[1];
        var vel = data[2];
        console.log("data: ", midiId, dsId, vel);
        if (vel != 64)
            this.playMidiNote(dsId);
    }
}

//# sourceURL=js/WheelBox.js

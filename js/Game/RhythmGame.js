
"use strict"

const MODE = {
    NORMAL: "Normal",
    REACTIVE: "Reactive"
};

var ALIAS = { "rim": "cowbell", "center": "taiko" };

function getSoundLabel(label) {
    if (ALIAS[label])
        label = ALIAS[label];
    return label;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// this is a kind of player that uses midi.
class MPlayer extends PlayTool_TinySynth {
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
        if (note.type == "metronome")
            return;
        if (this.game.useMidi() || this.game.songType == "MIDI") {
            //console.log("handleNote", note);
            super.handleNote(t0, note);
        }
        else {
            var v = 3;
            var label = getSoundLabel(note.label);
            this.game.soundPlayer.playNote(label, v);
            var stick = this.game.rhythmStick;
            if (stick) {
                stick.setColor(0, 0, 200);
                setTimeout(() => stick.setColor(0, 0, 0), 100);
            }
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
        console.log("*** click on ", this.label);
        //this.game.soundPlayer.playNote(this.label);
        //this.game.strikeDrum("note");
        this.game.strikeDrum(this.label);
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
        this.timeSigD = 4;
        this.timeSigN = 4;
        this.mode = MODE.NORMAL;
        this.songs = opts.songs || [];
        this.soundPlayer = new SamplesPlayer();
        //this.fillStyle = "beige";
        this.fillStyle = null;
        this.strokeStyle = null;
        //this.notes = [];
        this.targets = {};
        this.parser = new SongParser();
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
        //this.setupPics();
        this.rhythmStick = null;
        this.prevSong = null;
        this.radii = { 0: 150, 1: 170, 2: 190 };
        this.rMin = 150;
        this.rMax = 190;
        //this.playMidiJSON("sakura", false);
        //return;
        if (opts.initialSong)
            this.playSongSpec(opts.initialSong, false);
        this.setMode(MODE.NORMAL);
    }

    setupGUI() {
        var inst = this;
        $("#kuchiShoga").keypress(e => inst.noticeSongKeypress(e));
        $("#kuchiShoga").change(e => inst.noticeNewSong());
        $("#useWheel").change(e => inst.toggleUseWheel(e));
        $("#moveNotes").change(e => inst.toggleMoveNotes(e));
        $("#bpmSlider").change(e => inst.handleBPMSlider(e));
        $("#bpmSlider").on('input', e => inst.handleBPMSlider(e));
        $("#mode").change(e => inst.setMode($("#mode").val()));
        $("#reactivePad").click(e => inst.noticeBeat(e));
        inst.handleBPMSlider();
        //this.setupSongButtons();
        this.setupSongChoices();
    }

    setMode(mode) {
        console.log("**** setMode", mode);
        this.mplayer.pausePlaying();
        this.mplayer.setPlayTime(0);
        this.mode = mode;
        if (mode == MODE.REACTIVE) {
            $("#reactivePad").show();
            this.mplayer.pausePlaying();
            if (this.pseudoClock == null) {
                this.pseudoClock = new PseudoClock();
            }
            this.pseudoClock.setPlayTime(0);
            this.mplayer.setPlayTime(0);
        }
        else if (mode == MODE.NORMAL) {
            $("#reactivePad").hide();
            this.setBPM(100);
        }
        else {
            alert("Unknown mode", mode);
        }
    }

    setupSongButtons() {
        var inst = this;
        this.songs.forEach(song => {
            var button = $("<button>")
            button.html(song.name);
            button.addClass("songButton");
            button.click(e => {
                inst.playSong(song);
            });
            $("#songChoices").append(button);
        });
    }

    setupSongChoices() {
        var inst = this;
        var select = $("<select>").attr('id', 'songSelect');
        $("#songChoices").append(select);
        var i = 0;
        var option = $("<option>").html("Choose a Song").val(-1);
        option.addClass("songChoice");
        select.append(option);
        this.songs.forEach(song => {
            var option = $("<option>")
            option.html(song.name);
            option.val(i)
            option.addClass("songChoice");
            select.append(option);
            i++;
        });
        select.change(e => {
            var i = select.val();
            if (i < 0)
                return;
            var song = this.songs[i];
            inst.playSong(song);
        })
    }

    playMidiNote(i) {
        console.log("MidiPlayer.playMidiNote", i);
        this.mplayer.noteOn(0, i, 100, 0);
        this.mplayer.noteOff(0, i, 100, 0.1);
    }

    useColors() {
        return $("#useColors").is(":checked");
    }

    useMidi() {
        return $("#useMidi").is(":checked");
    }

    setMetronome(val) {
        $("#metronome").prop('checked', val ? true : false);
    }

    useMetronome() {
        return $("#metronome").is(":checked");
    }

    collapseTracks() {
        return $("#collapse").is(":checked");
    }

    allowScrub() {
        return $("#scrub").is(":checked");
    }

    toggleUseWheel(e) {
        this.useWheel = $("#useWheel").is(":checked");
        this.setupPics();
    }

    toggleMoveNotes(e) {
        this.moveNotes = $("#moveNotes").is(":checked");
    }

    setBPM(bpm) {
        this.setBPMSlider(bpm);
        this.handleBPMSlider();
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

    setBPMSlider(bpm) {
        $("#bpmSlider").val(bpm);
        $("#bpmLabel").html("" + Math.floor(bpm)+" BPM");
    }

    getTime() {
        //return this.mplayer.getPlayTime();
        return getClockTime();
    }

    addScorer(scorer) {
        this.scorer = scorer || new Scorer(this.tool);
    }

    tick() {
        this.checkMetronome();
        if (this.scorer)
            this.scorer.update(this.getTime());
        if (this.mode == MODE.REACTIVE) {
            this.pseudoClock.tick();
            this.mplayer.setPlayTime(this.pseudoClock.getPlayTime());
            this.setBPMSlider(this.pseudoClock.getBPM());
        }
        var dur = this.mplayer.getDuration();
        var t = this.mplayer.getPlayTime();
        if (dur) {
            var n = Math.floor(t/dur);
            var mt = t % dur;
            $("#playtime").html(sprintf(" %3d %8.2f %8.2f", (n+1), mt, t));
        }
        else {
            $("#playtime").html(sprintf(" %8.2f", this.mplayer.getPlayTime()));
        }
    }

    checkMetronome() {
        var numBeats = Math.floor(this.mplayer.getDuration() * this.beatsPerSec);
        var pt = this.mplayer.getPlayTime();
        var b = pt * this.mplayer.beatsPerMin / 60;
        var bn = Math.floor(b);
        if (bn != this.prevBn && bn != numBeats) {
            var vol = 0.1;
            if (this.timeSigN)
                if (bn % this.timeSigN == 0)
                    vol *= 6;
            if (this.useMetronome()) {
              this.soundPlayer.playNote("cowbell", vol);
            }

        }
        this.prevBn = bn;

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
        var song = {song: $("#kuchiShoga").val() };
        console.log("noticeNewSong", song);
        this.playSong(song);
    }

    async playSong(song, autoStart) {
        if (song.midi) {
            this.playMidiFile(song.midi, false);
        }
        else
            this.playSongSpec(song.song, autoStart);
        if (song.timeSignature) {
            this.timeSigN = song.timeSignature[0];
            this.timeSigD = song.timeSignature[1];
        }
        else {
            this.timeSigN = 0;
            this.timeSigD = 0;
        }
        if (song.bpm)
            this.setBPM(Number(song.bpm));
        this.setMetronome(song.metronome);
        if (song.infoURL) {
            console.log("*******************************************************************");
            console.log("info", song.infoURL);
            $("#infoLink").html(song.infoLabel);
            $("#infoLink").attr('href', song.infoURL);
        }
        else {
            $("#infoLink").html("");
        }
    }

    async playSongSpec(song, autoStart) {
        if (song == this.prevSong)
            autoStart = true;
        this.prevSong = song;
        console.log("playSong", song, autoStart);
        this.mplayer.pausePlaying();
        await sleep(0.5);
        $("#kuchiShoga").val(song);
        this.parser.addSong(song);
        var midiObj = this.parser.getMidiObj();
        this.songType = midiObj.songType;
        this.mplayer.playMidiObj(midiObj, false);
        this.setupPics();
        if (autoStart)
            this.mplayer.startPlaying();
    }

    async playMidiFile(url, autoStart) {
        this.songType = "MIDI";
        $("#kuchiShoga").val("");
        await this.mplayer.playMIDI(url, autoStart);
        this.setupPics();
    }

    async playMidiJSON(name, autoStart) {
        this.songType = "MIDI";
        this.setupPics();
        await this.mplayer.playMelody(name, autoStart);
        this.mplayer.setProgram(0);
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
        if (state == "stop" && this.mode == MODE.REACTIVE) {
            console.log("*** stop pseudoClock")
            if (this.pseudoClock)
                this.pseudoClock.stop();
            else {
                console.log("**** expected pseudoClock ***");
            }
        }
    }

    draw(canvas, ctx) {
        if (this._nodraw)
            return;
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
        this.lineWidth = 2;
        var a = 0;
        var pt = this.mplayer.getPlayTime();
        var dur = this.mplayer.getDuration();
        if (!this.moveNotes) {
            a = 2 * Math.PI * pt / dur;
        }
        this.drawRadialLine(canvas, ctx, a, this.rMin-15, this.rMax, 1);
        // now draw bars at beat times...
        //
        this.beatsPerSec = this.mplayer.beatsPerMin / 60;
        this.numBeats = dur * this.beatsPerSec;
        for (var b = 0; b < this.numBeats; b++) {
            var bt = b / this.beatsPerSec;
            if (this.moveNotes)
                bt -= pt;
            var a = bt * 2 * Math.PI / dur;
            var wid = 0.2;
            if (this.timeSigN)
                if (b % this.timeSigN == 0)
                    wid *= 5;
            this.drawRadialLine(canvas, ctx, a, this.rMin, this.rMax, wid);
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

    getColor(i) {
        if (!this.useColors())
            return "black";
        const colors = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"];
        const ncolors = colors.length;
        return colors[i % ncolors];
    }

    getRadius(i) {
        var r = this.radii[i];
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
        if (this.songType == "MIDI") {
           for (var i=this.info.nMin; i<=this.info.nMax; i++) {
               var r = this.getRadius(i);
               this.strokeStyle = this.getColor(i);
               this.drawCircle(canvas, ctx, r, this.x, this.y);
           }
        }
        else {
            for (var i = 0; i < 3; i++) {
                this.drawCircle(canvas, ctx, this.getRadius(i), this.x, this.y);
            }
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
                if (this.songType == "MIDI") {
                    //r = 60 + ki * 4;
                    r = this.getRadius(pitch);
                    ctx.strokeStyle = this.getColor(pitch);
                    dur = dur / 5;
                }
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
        //super.draw(canvas, ctx);
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
                var heightPerSec = 50;
                var x;
                if (this.songType == "MIDI") {
                    var ki = pitch - 40;
                    x = -100 + 5 * ki;
                }
                else {
                    x = this.getTrackPos(note.channel);
                }

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
        //this.playMySong();
    }

    // this is called when an event has been detected, such
    // as arduino tap or midi input event, which should cause
    // a drum strike.
    strikeDrum(label) {
        //var midi = MIDI;
        label = getSoundLabel(label);
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
        this.noticeBeat();
    }

    noticeBeat() {
        $("#reactivePad").css("background-color", "pink");
        setTimeout(() => {
            $("#reactivePad").css("background-color", "beige");
        }, 100);
        if (this.pseudoClock) {
            this.pseudoClock.noticeBeat();
        }
    }

    async playMySong() {
        //this.mplayer.loadMidiFile("midi/sakura.mid");
        var midiObj = this.parser.getMidiObj();
        this.mplayer.playMidiObj(midiObj, true);
        //this.mplayer.playMidiObj(midiObj, false);
    }

    //async playMidiFile() {
    //    var obj = await this.mplayer.loadMidiFile(url);
    //    console.log("playMidiFile returned", obj);
    //}

    async setupPics() {
        //await sleep(0.5);
        var info = this.examineEvents();
        this.info = info;
        var nMin = info.nMin;
        var nMax = info.nMax;
        console.log("nMin, nMax", nMin, nMax);
        this.radii = {};
        if (this.songType == "MIDI") {
            this.rMin = 60;
            this.rMax = 220;
            var k = nMax - nMin;
            var dr = (this.rMax-this.rMin)/k;
            for (var i=nMin; i<=nMax; i++) {
                var r = this.rMin + (i-nMin)*dr;
                //console.log("radius", i, r);
                this.radii[i] = r;
            }
        }
        else {
            this.rMin = 150;
            this.rMax = 190;
            this.radii = { 0: 150, 1: 170, 2: 190 };
        }
        var labels = info.labels.map(getSoundLabel);
        this.soundPlayer.loadBuffers(labels);
        if (this.useWheel)
            this.setupPicsCirc();
        else
            this.setupPicsRectV();
    }

    examineEvents() {
        var nMin = 1E10;
        var nMax = -1E10;
        var channels = {};
        var labels = {};
        var numNotes = 0;
        if (!this.mplayer.midiObj) {
            console.log("***** no midiObj");
            return null;
        }
        var groups = this.mplayer.midiObj.seq;
         for (var i = 0; i < groups.length; i++) {
            //console.log("eventGroup i");
            var eventGroup = groups[i];
            var events = eventGroup[1];
            for (var k = 0; k < events.length; k++) {
                var event = events[k];
                if (event.type != "note")
                    continue;
                var n = event.pitch;
                if (event.label)
                    labels[event.label] = 1;
                numNotes++;
                channels[event.channel] = 1;
                if (!n)
                    continue;
                nMin = Math.min(n, nMin);
                nMax = Math.max(n, nMax);
            }
        }
        labels = Object.keys(labels);
        var info =  {nMin, nMax, numNotes, channels, labels};
        console.log("****** Info: "+JSON.stringify(info, null, 3));
        return info;
    }

    setupPicsCirc() {
        this.graphicsList = [];
        this.targets = {};
        if (this.songType == SUN_MOON_STAR_SONG) {
            var xspace = 100;
            var x = this.x - xspace;
            var y = this.y;
            var width = 80;
            var height = 80;
            this.sunPic = new DrumPic(this, "sun", x, y, width, height, "images/sun.png");
            this.targets[0] = { x, y };
            x += xspace;
            this.moonPic = new DrumPic(this, "moon", x, y, width, height, "images/moon.png");
            this.targets[1] = { x, y };
            x += xspace;
            this.starPic = new DrumPic(this, "star", x, y, width, height, "images/star.png");
            this.targets[2] = { x, y };
            this.addGraphic(this.sunPic);
            this.addGraphic(this.moonPic);
            this.addGraphic(this.starPic);
        }
        else if (this.songType == FRAME_DRUM_SONG) {
            var x = this.x;
            var y = this.y;
            var width = 200;
            var height = 200;
            this.taikoPic = new DrumPic(this, "framedrum", x, y, width, height, "images/framedrum1.png");
            this.addGraphic(this.taikoPic);
            y += 50;
            this.targets[0] = { x: x - 60, y };
            this.targets[1] = { x: x + 60, y: y - 40 };
            this.targets[2] = { x: x + 50, y };
        }
        else if (this.songType == TAIKO_SONG) {
            var x = this.x;
            var y = this.y;
            var width = 200;
            var height = 200;
            this.taikoPic = new DrumPic(this, "taiko", x, y, width, height, "images/taiko.svg");
            this.addGraphic(this.taikoPic);
            y -= 50;
            this.targets[0] = { x: x, y };
            this.targets[1] = { x: x + 25, y };
            this.targets[2] = { x: x + 50, y };
        }
        else {
            this.targets[0] = { x: x, y };
            this.targets[1] = { x: x + 25, y };
            this.targets[2] = { x: x + 50, y };
        }
    }

    setupPicsRectV() {
        this.graphicsList = [];
        this.targets = {};
        if (this.songType == SUN_MOON_STAR_SONG) {
            var xspace = 100;
            var x = this.x - xspace;
            var y = this.y - 100;
            var width = 80;
            var height = 80;
            this.sunPic = new DrumPic(this, "sun", x, y, width, height, "images/sun.png");
            this.targets[0] = { x, y };
            x += xspace;
            this.moonPic = new DrumPic(this, "moon", x, y, width, height, "images/moon.png");
            this.targets[1] = { x, y };
            x += xspace;
            this.starPic = new DrumPic(this, "star", x, y, width, height, "images/star.png");
            this.targets[2] = { x, y };
            this.addGraphic(this.sunPic);
            this.addGraphic(this.moonPic);
            this.addGraphic(this.starPic);
        }
        else if (this.songType == FRAME_DRUM_SONG) {
            var x = this.x;
            var y = this.y - 100;
            var width = 200;
            var height = 200;
            this.taikoPic = new DrumPic(this, "framedrum", x, y, width, height, "images/framedrum1.png");
            this.addGraphic(this.taikoPic);
            y += 50;
            this.targets[0] = { x: x - 60, y };
            this.targets[1] = { x: x + 60, y: y - 40 };
            this.targets[2] = { x: x + 50, y };
        }
        else if (this.songType == TAIKO_SONG) {
            var x = this.x;
            var y = this.y - 100;
            var width = 200;
            var height = 200;
            this.taikoPic = new DrumPic(this, "taiko", x, y, width, height, "images/taiko.svg");
            this.addGraphic(this.taikoPic);
            y -= 50;
            this.targets[0] = { x, y };
            this.targets[1] = { x: x + 25, y };
            this.targets[2] = { x: x + 50, y };
        }
        else {

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
        if (vel != 64) {
            this.playMidiNote(dsId);
            this.noticeBeat();
        }
    }
}

//# sourceURL=js/RhythmGame.js

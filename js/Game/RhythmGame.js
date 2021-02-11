
"use strict"

var ALIAS = { "rim": "cowbell", "center": "taiko" };

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const FF1 = `
    don don  don  don  ka doko doko doko
    ka  doko doko doko ka doko doko doko
    don don  don  don  ka doko doko doko
    ka  doko doko doko ka doko doko doko
    `;

const FF2 = `
    ka doko kara doko ka   doko kara doko
    ka doko kara doko kara doko kara doko
    ka doko kara doko ka   doko kara doko
    ka doko kara doko kara doko kara doko
    `;

const SHIKO = `moon - moon - | sun - sun - | moon - moon - | sun sun - - |
sun - star star | sun - star star | sun - star star | moon moon - -`;

const FANGA1 = `sun rest sun sun | rest sun moon moon | sun rest rest sun | sun rest moon moon`;

const DJEMBE3 = `sun moon moon | sun moon moon | moon moon star | moon - -`;

const FRAME_EX1 = `dum - ki - ta - ki -    dum ki ta ki`;

const PARADIDDLE1 = `pa dum pa pa | dum pa dum dum`;

$("#wtc").click(e => inst.playMidiFile("midi/bach/wtc0.mid"));
$("#sakura").click(e => inst.playMidiFile("midi/sakura.mid"));

var SONGS = [
    {
        'name': 'Fast & Furious 1',
        'song': FF1,
        'infoLabel': 'South Bay Beat Institute',
        'infoURL': 'https://www.southbaybeatinstitute.com/'
    },
    {
        'name': 'Fast & Furious 2',
        'song': FF2,
        'infoLabel': 'South Bay Beat Institute',
        'infoURL': 'https://www.southbaybeatinstitute.com/'
    },
    {
        'name': 'Fanga',
        'song': FANGA1,
        'infoLabel': 'Sun Moon Stars',
        'infoURL': 'https://www.jamtown.com/products/j0181d'
    },
    {
        'name': 'Shiko',
        'song': SHIKO,
        'infoLabel': 'Reach and Teach',
        'infoURL': 'https://shop.reachandteach.com/'
    },
    {
        'name': 'Djembe 3 Beat',
        'song': DJEMBE3,
    },
    {
        'name': 'Frame Drum Exercise 1',
        'song': FRAME_EX1,
        'infoLabel': 'Fern Ferndale',
        'infoURL': 'https://www.facebook.com/fernsplace'
    },
    {
        'name': 'Frame Drum Paradiddle',
        'song': PARADIDDLE1
    },
    {
        'name': 'Matsuri',
        'song': MATSURI
    },
    {
        'name': 'Sakura',
        'midi': 'midi/sakura.mid'
    },
    {
        'name': 'Well Tempered Clavier',
        'midi': 'midi/Bach/wtc0.mid'
    },
    {
        'name': 'Frere Jacques',
        'midi': 'midi/frere-jacques-round.mid',
        'infoLabel': 'Free Midi',
        'infoURL': 'https://beatlabacademy.com/free-midi/'
    }
];

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
        /*
        if (note.type == "metronome") {
            if (this.game.useMetronome()) {
                this.game.soundPlayer.playNote("cowbell", .1);
            }
            return;
        }
        */
        if (this.game.useMidi() || this.game.songType == "MIDI") {
            console.log("handleNote", note);
            super.handleNote(t0, note);
        }
        else {
            var v = 3;
            var ALIAS = { "rim": "cowbell", "center": "taiko" };
            var label = note.label;
            if (ALIAS[label])
                label = ALIAS[label];
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
        this.setupPics();
        this.rhythmStick = null;
        this.prevSong = null;
        //this.playMidiJSON("sakura", false);
        //return;
        if (opts.initialSong)
            this.playSongSpec(opts.initialSong, false);
    }

    setupGUI() {
        var inst = this;
        $("#kuchiShoga").keypress(e => inst.noticeSongKeypress(e));
        $("#kuchiShoga").change(e => inst.noticeNewSong());
        $("#useWheel").change(e => inst.toggleUseWheel(e));
        $("#moveNotes").change(e => inst.toggleMoveNotes(e));
        $("#bpmSlider").change(e => inst.handleBPMSlider(e));
        $("#bpmSlider").on('input', e => inst.handleBPMSlider(e));
        inst.handleBPMSlider();
        //this.setupSongButtons();
        this.setupSongButtons();
    }

    setupSongButtons() {
        var inst = this;
        SONGS.forEach(song => {
            var button = $("<button>")
            button.html(song.name);
            button.addClass("songButton");
            button.click(e => {
                inst.playSong(song);
            });
            $("#songChoices").append(button);
        });
    }

    setupSongButtons() {
        var inst = this;
        var select = $("<select>");
        $("#songChoices").append(select);
        var i = 0;
        SONGS.forEach(song => {
            var option = $("<option>")
            option.html(song.name);
            option.val(i)
            option.addClass("songChoice");
            select.append(option);
            i++;
        });
        select.change(e => {
            var i = select.val();
            var song = SONGS[i];
            inst.playSong(song);
        })
    }

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
        this.setupPics();
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
        var pt = this.mplayer.getPlayTime();
        var b = pt * this.mplayer.beatsPerMin / 60;
        var bn = Math.floor(b);
        if (bn != this.prevBn) {
            console.log("**************************** BEAT **************************", bn);
            if (this.useMetronome()) {
              this.soundPlayer.playNote("cowbell", .1);
            }

        }
        this.prevBn = bn;
        if (this.scorer)
            this.scorer.update(this.getTime());
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
        /*
        var str = song.toLowerCase();
        if (contains(str, ["sun", "moon", "star"]))
            this.songType = SUN_MOON_STAR_SONG;
        if (contains(str, ["doko", "don", "ka"]))
            this.songType = TAIKO_SONG;
        if (contains(str, ["pa", "dum"]))
            this.songType = FRAME_DRUM_SONG;
        */
        console.log("playSong", song, autoStart);
        // this.setupPics();

        //$("#kuchiShoga").val(kuchiShoga);
        this.mplayer.pausePlaying();
        await sleep(0.5);
        $("#kuchiShoga").val(song);
        this.parser.addSong(song);
        var midiObj = this.parser.getMidiObj();
        this.songType = midiObj.songType;
        this.setupPics();
        await sleep(0.5);
        this.mplayer.playMidiObj(midiObj, autoStart);
    }

    async playMidiFile(url, autoStart) {
        this.songType = "MIDI";
        this.mplayer.playMIDI(url, autoStart);
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
        this.rMax = rMax;
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
        if (this.songType == "MIDI") {
            for (var i = 0; i < 24; i++) {
                var r = 130 + i * 4;
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
                    r = 60 + ki * 4;
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
        this.examineEvents();
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
        if (vel != 64)
            this.playMidiNote(dsId);
    }
}

//# sourceURL=js/RhythmGame.js

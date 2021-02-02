
"use strict"

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class WheelBox extends MidiBox {

    constructor(opts) {
        opts = opts || {};
        opts.instrument = "acoustic_grand_piano";
        super(opts);
        //this.fillStyle = "beige";
        this.fillStyle = null;
        this.strokeStyle = null;
        var inst = this;
        this.notes = [];
        this.targets = {};
        this.midiParser = new MidiParser();
        this.useWheel = true;
        this.moveNotes = false;
        $("#kuchiShoga").keypress(e => inst.noticeSongKeypress(e));
        $("#kuchiShoga").change(e => inst.noticeNewKuchiShoga());
        $("#ff1").click(e => inst.playFastAndFurious1());
        $("#ff2").click(e => inst.playFastAndFurious2());
        $("#matsuri").click(e => inst.playMatsuri());
        $("#useWheel").change(e => inst.toggleUseWheel(e));
        $("#moveNotes").change(e => inst.toggleMoveNotes(e));
        $("#bpmSlider").change(e => inst.handleBPMSlider(e));
        //this.playKuchiShoga(MATSURI, true);
        this.scorer = null;
        this.player.setProgram(116);
        //this.player.setProgram(0);
        // for debugging
        window.WHEEL_BOX = this;
        var icons = {}
        icons[0] = new CanvasTool.ImageGraphic({url: "images/sun1.png",  width: 40, height: 40});
        icons[1] = new CanvasTool.ImageGraphic({url: "images/moon1.png", width: 40, height: 40});
        icons[2] = new CanvasTool.ImageGraphic({url: "images/star1.png", width: 40, height: 40});
        this.icons = icons;
        if (opts.initialSong)
            this.playKuchiShoga(opts.initialSong, false);
    }

    toggleUseWheel(e) {
        this.useWheel = $("#useWheel").is(":checked");
    }

    toggleMoveNotes(e) {
        this.moveNotes = $("#moveNotes").is(":checked");
    }

    handleBPMSlider(e) {
        var val = $("#bpmSlider").val();
        var bpm = Number(val);
        console.log("bpm", bpm);
        var p = this.player.isPlaying;
        $("#bpmLabel").html("" + bpm + " BMP");
        this.player.pausePlaying();
        this.player.setBPM(bpm);
        if (p)
            this.player.startPlaying();
    }

    getTime() {
        //return this.player.getPlayTime();
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
        this.playKuchiShoga(ff1);
    }

    playFastAndFurious2() {
        var ff2 = `
        ka doko kara doko ka   doko kara doko
        ka doko kara doko kara doko kara doko
        ka doko kara doko ka   doko kara doko
        ka doko kara doko kara doko kara doko
        `;
        this.playKuchiShoga(ff2);
    }

    playMatsuri(autoStart) {
        this.playKuchiShoga(MATSURI, false);
    }

    noticeSongKeypress(e) {
        var keycode = (e.keyCode ? e.keyCode : e.which);
        window.E = e;
        if(keycode == '13' && !e.shiftKey){
            this.noticeNewKuchiShoga();
        }
    }

    noticeNewKuchiShoga() {
        var kuchiShoga = $("#kuchiShoga").val();
        console.log("kuchiShoga", kuchiShoga);
        this.playKuchiShoga(kuchiShoga);
    }

    async playKuchiShoga(kuchiShoga, autoStart) {
        console.log("playKuchiShoga", kuchiShoga, autoStart);
        kuchiShoga = kuchiShoga.trim();
        //$("#kuchiShoga").val(kuchiShoga);
        this.player.pausePlaying();
        await sleep(0.5);
        this.midiParser.addKuchiShoga(kuchiShoga);
        var midiObj = this.midiParser.getMidiObj();
        await sleep(0.5);
        this.player.playMidiObj(midiObj, autoStart);
    }

    // This is called when the midi player plays a note
    observeNote(ch, pitch, v, t, dur) {
        //console.log("observeNote", ch, pitch, v, dur, t);
        let target = this.targets[ch];
        if (target == null) {
            console.log("no target for channel", ch);
            return;
        }
        target.on = true;
        setTimeout(() => {
            //console.log("set style", i, prevStyle);
            target.on = false;
        }, dur * 1000);
        if (this.scorer) {
            var note = { t: this.getTime() };
            this.scorer.observePlayedNote(note);
        }
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
    }

    drawWheel(canvas, ctx) {
        //super.draw(canvas, ctx);
        this.fillStyle = null;
        this.strokeStyle = "black";
        var r = 200;
        this.lineWidth = 2;
       // this.drawCircle(canvas, ctx, r, this.x, this.y);
        var a = 0;
        var pt = this.player.getPlayTime();
        var dur = this.player.getDuration();
        if (!this.moveNotes) {
            a = 2 * Math.PI * pt / dur;
        }
        this.drawRadialLine(canvas, ctx, a, 20, r + 10, 1);
        // now draw bars at beat times...
        //
        this.beatsPerSec = this.player.beatsPerMin/60;
        this.numBeats = dur*this.beatsPerSec;
        for (var b=0; b<this.numBeats; b++) {
            var bt = b / this.beatsPerSec;
            if (this.moveNotes)
                bt -= pt;
            var a = bt * 2 * Math.PI / dur;
            this.drawRadialLine(canvas, ctx, a,  160, r, 0.2);
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

    drawNotesArcs(canvas, ctx) {
        // now draw notes
        var player = this.player;
        var midiTrack = player.midiObj;
        if (!midiTrack)
            return;
        var pt = this.player.getPlayTime();
        var groups = midiTrack.seq;
        //ctx.strokeStyle = null;
        this.clipNotes = true;
        var ystrike = this.y + 60;
        var r1 = 160;
        var r2 = 180;
        this.lineWidth = 1;
        this.strokeStyle = "gray";
        this.drawCircle(canvas, ctx, r1, this.x, this.y);
        this.drawCircle(canvas, ctx, r2, this.x, this.y);
        ctx.save();
        ctx.lineWidth = 12;
        ctx.strokeStyle = "black";
        var songDur = this.player.getDuration();
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
                var r = 160;
                var icon = this.icons[event.channel];
                if (ki > 20) {
                    r = 180;
                }
                if (ki > 21) {
                    r = 200;
                }
                var a0 = timeToAngle * t;
                var a1 = timeToAngle * (t+dur);
                ctx.beginPath();
                ctx.arc(this.x, this.y, r, a0, a1);
                ctx.stroke();
                // draw sun
                if (!icon)
                    continue;
                icon.x = this.x + r*Math.cos(a0);
                icon.y = this.y + r*Math.sin(a0);
                icon.draw(canvas, ctx);
            }
        }
        ctx.restore();
    }

    drawNotesBars(canvas, ctx) {
        // now draw notes
        var player = this.player;
        var midiTrack = player.midiObj;
        if (!midiTrack)
            return;
        var pt = this.player.getPlayTime();
        var groups = midiTrack.seq;
        //ctx.strokeStyle = null;
        this.clipNotes = true;
        var ystrike = this.y + 60;
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

    drawBars(canvas, ctx) {
        super.draw(canvas, ctx);
        if (this.pic)
            this.pic.draw(canvas, ctx);
        if (this.sun)
            this.sun.draw(canvas, ctx);
        ctx.save();
        for (var ch in this.targets) {
            var target = this.targets[ch];
            if (!target.on)
                continue;
            ctx.fillStyle = "rgba(255,0,0,.5)";
            ctx.strokeStyle = "rgba(255,0,0,.5)";
            ctx.beginPath();
            ctx.arc(target.x, target.y, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
        this.drawNotesBars(canvas, ctx);
    }

    onClick(e) {
        console.log("onClick", e);
        this.init();
        this.strikeDrum("center");
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
    strikeDrum(pos) {
        //var midi = MIDI;
        var channel = 0;
        var pitch = 36;
        if (pos == "center")
            pitch = 36;
        else
            pitch = 42;
        var v = 127;
        var t = 0;
        var dur = .2;
        console.log("strikeDrum", pos, pitch);
        this.player.noteOn(channel, pitch, v, t);
        this.player.noteOff(channel, pitch, t + dur);
        if (this.scorer) {
            var note = { t: this.getTime() };
            this.scorer.observeUserNote(note);
        }
    }

    async playMySong() {
        //this.player.loadMidiFile("midi/sakura.mid");
        var midiObj = this.midiParser.getMidiObj();
        this.player.playMidiObj(midiObj, true);
        //this.player.playMidiObj(midiObj, false);
    }

    async playMidiFile() {
        var obj = await this.player.loadMidiFile(url);
        console.log("playMidiFile returned", obj);
    }

    async addItems() {
        await sleep(0.5);
        console.log("WheelBox.addItems");
        var x = this.x + 20;
        var y = this.y - 40;
        var opts = {
            x, y, width: 200, height: 200,
            url: "images/taiko.svg",
            id: "wheelbox1"
        };
        this.pic = new CanvasTool.ImageGraphic(opts);
        x -= 8;
        y -= 55;
        this.targets = {
            0: { x, y },
            1: { x: x + 35, y }
        }
    }
}

//# sourceURL=js/WheelBox.js

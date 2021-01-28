
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
        $("#kuchiShoga").change(e => inst.noticeNewKuchiShoga());
        $("#ff1").click(e => inst.playFastAndFurious1());
        $("#ff2").click(e => inst.playFastAndFurious2());
        $("#matsuri").click(e => inst.playMatsuri());
        $("#useWheel").change(e => inst.toggleUseWheel(e));
        $("#moveNotes").change(e => inst.toggleMoveNotes(e));
        $("#bpmSlider").change(e => inst.handleSlider(e));
        this.playKuchiShoga(MATSURI, true);
        this.scorer = null;
        this.player.setProgram(116);
        //this.player.setProgram(0);
        // for debugging
        window.WHEEL_BOX = this; 
        this.playKuchiShoga(MATSURI, true);
    }

    toggleUseWheel(e) {
        this.useWheel = $("#useWheel").is(":checked");
    }

    toggleMoveNotes(e) {
        this.moveNotes = $("#moveNotes").is(":checked");
    }

    handleSlider(e) {
        var val = $("#bpmSlider").val();
        var bpm = Number(val);
        console.log("bpm", bpm);
        this.player.setBPM(bpm);
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

    playMatsuri() {
        this.playKuchiShoga(MATSURI);
    }

    noticeNewKuchiShoga() {
        var kuchiShoga = $("#kuchiShoga").val();
        console.log("kuchiShoga", kuchiShoga);
        this.playKuchiShoga(kuchiShoga);
    }

    async playKuchiShoga(kuchiShoga, paused) {
        kuchiShoga = kuchiShoga.trim();
        //$("#kuchiShoga").val(kuchiShoga);
        this.player.pausePlaying();
        await sleep(0.5);
        this.midiParser.addKuchiShoga(kuchiShoga);
        if (!paused) {
            var midiObj = this.midiParser.getMidiObj();
            await sleep(0.5);
            this.player.playMidiObj(midiObj, true);
        }
    }

    // This is called when the midi player plays a note
    observeNote(ch, pitch, v, t, dur) {
        //console.log("observeNote", ch, pitch, v, dur, t);
        let target = this.targets[ch];
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
        this.drawCircle(canvas, ctx, r, this.x, this.y);
        var a = 0;
        if (!this.moveNotes) {
            var t = this.player.getPlayTime();
            var dur = this.player.getDuration();
            a = 2*Math.PI*t/dur;
        }
        var x = this.x + r*Math.cos(a);
        var y = this.y + r*Math.sin(a);
        this.lineWidth = 1;
        this.strokeStyle = "black";
        this.drawLine(canvas, ctx, this.x, this.y, x, y);
        this.drawNotesArcs(canvas, ctx);
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
        ctx.lineWidth = 6;
        ctx.strokeStyle = "black";
        var songDur = this.player.getDuration();
        if (songDur == null)
            return;
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
                let target = this.targets[0];
                if (ki > 20)
                    r = 180;
                var heightPerSec = 50;
                var dx = 10;
                //console.log("addNote", t, dur, pitch);
                var a0 = 2*Math.PI * t / songDur;
                var a1 = 2*Math.PI * (t + dur) / songDur;
                //ctx.fillStyle = "green";
                ctx.beginPath();
                ctx.arc(this.x, this.y, r, a0, a1);
                ctx.stroke();
                //this.drawRect(canvas, ctx, x, y, nwidth, height);
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

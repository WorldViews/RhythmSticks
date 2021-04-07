/*
This is a version of MidiPlayTool using WebAudio_TinySynth
*/
"use strict"


// this is a hack so that some html buttons with strings for events can
// access instance of MidiPlayTool.
var _MIDI_PLAYER = null;

//
// We are subclassing this so that we can take advantage of the MIDI loader
// that is built in to TinySynth, without hacking its source code.
//
class MyWebAudioTinySynth extends WebAudioTinySynth {
    constructor(opts) {
        super(opts);
    }

    handleNoteOn(ch, n, v, t) {
        // n is midi number - pitch
        //console.log("handleNoteOn", t, ch, n, t);
        this.noteOn(ch, n, v, t);
    }

    handleEvent(ev, t) {
        console.log("handleEvent", ev, t);
        this.send(ev.m, t);
    }

    // load a MIDI file at given URL and return a promise
    // to get the parsed song.
    async asyncLoadMIDIUrl(url) {
        var inst = this;
        return new Promise((res, rej) => {
            console.log("Loading MIDI from", url);
            if (!url) {
                console.log("asyncLoadMIDIUrl no url")
                rej("no url");
            }
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.loadMIDI = this.loadMIDI.bind(this);
            xhr.onload = function (e) {
                if (this.status == 200) {
                    this.loadMIDI(this.response);
                    console.log("after loadMIDI, song", inst.song)
                    res(inst.song);
                }
                else {
                    console.log("Error reading", url, this.status);
                    rej(this.status);
                }
            };
            xhr.send();
        });
    }

    // this is based on the send(msg,t) method of synth
    processEvent(evt) {    /* send midi message */
        var t = evt.t;
        var msg = evt.m;
        const ch = msg[0] & 0xf;
        const cmd = msg[0] & ~0xf;
        if (cmd < 0x80 || cmd >= 0x100)
            return;
        //if (this.audioContext.state == "suspended") {
        //    this.audioContext.resume();
        //}
        evt.channel = ch;
        switch (cmd) {
            case 0xb0:  /* ctl change */
            /*
            switch (msg[1]) {
                case 1: this.setModulation(ch, msg[2], t); break;
                case 7: this.setChVol(ch, msg[2], t); break;
                case 10: this.setPan(ch, msg[2], t); break;
                case 11: this.setExpression(ch, msg[2], t); break;
                case 64: this.setSustain(ch, msg[2], t); break;
                case 98: case 99: this.rpnidx[ch] = 0x3fff; break; // nrpn lsb/msb
                case 100: this.rpnidx[ch] = (this.rpnidx[ch] & 0x3f80) | msg[2]; break; // rpn lsb
                case 101: this.rpnidx[ch] = (this.rpnidx[ch] & 0x7f) | (msg[2] << 7); break; // rpn msb
                case 6:  // data entry msb 
                    switch (this.rpnidx[ch]) {
                        case 0:
                            this.brange[ch] = (msg[2] << 7) + (this.brange[ch] & 0x7f);
                            break;
                        case 1:
                            this.tuningF[ch] = (msg[2] << 7) + ((this.tuningF[ch] + 0x2000) & 0x7f) - 0x2000;
                            break;
                        case 2:
                            this.tuningC[ch] = msg[2] - 0x40;
                            break;
                    }
                    break;
                case 38:  // data entry lsb 
                    switch (this.rpnidx[ch]) {
                        case 0:
                            this.brange[ch] = (this.brange[ch] & 0x3f80) | msg[2];
                            break;
                        case 1:
                            this.tuningF[ch] = ((this.tuningF[ch] + 0x2000) & 0x3f80) | msg[2] - 0x2000;
                            break;
                        case 2: break;
                    }
                    break;
                case 120:  // all sound off
                case 123:  // all notes off
                case 124: case 125: case 126: case 127: // omni off/on mono/poly
                    this.allSoundOff(ch);
                    break;
                case 121: this.resetAllControllers(ch); break;
            }
            break;
            */
            case 0xc0:
                //this.setProgram(ch, msg[1]);
                evt.type = 'setProgram'
                break;
            //case 0xe0: this.setBend(ch, (msg[1] + (msg[2] << 7)), t); break;
            case 0x90:
                //this.noteOn(ch, msg[1], msg[2], t);
                evt.type = 'noteOn';
                evt.type = 'note';
                evt.pitch = msg[1];
                evt.v = msg[2];
                evt.dur = 3;//*bogus
                break;
            case 0x80:
                //this.noteOff(ch, msg[1], t);
                evt.type = 'noteOff';
                evt.pitch = msg[1]
                break;
            case 0xf0:
                /*
                if (msg[0] == 0xff) {
                    this.reset();
                    break;
                }
                if (msg[0] != 254 && this.debug) {
                    var ds = [];
                    for (let ii = 0; ii < msg.length; ++ii)
                        ds.push(msg[ii].toString(16));
                }
                if (msg[0] == 0xf0) {
                    if (msg[1] == 0x7f && msg[3] == 4) {
                        if (msg[4] == 3 && msg.length >= 8) { // Master Fine Tuning
                            this.masterTuningF = msg[6] * 0x80 + msg[5] - 8192;
                        }
                        if (msg[4] == 4 && msg.length >= 8) { // Master Coarse Tuning
                            this.masterTuningC = msg[6] - 0x40;
                        }
                    }
                    if (msg[1] == 0x41 && msg[3] == 0x42 && msg[4] == 0x12 && msg[5] == 0x40) {
                        if ((msg[6] & 0xf0) == 0x10 && msg[7] == 0x15) {
                            const c = [9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15][msg[6] & 0xf];
                            this.rhythm[c] = msg[8];
                        }
                    }
                }
                */
                break;
        }
    }

    processSong(song) {
        song = song || this.song;
        var evts = song.ev;
        var pendingNotes = {};
        for (var i = 0; i < evts.length; i++) {
            var ev = evts[i];
            var t = ev.t;
            this.processEvent(ev);
            var ch = ev.channel;
            var pitch = ev.pitch;
            //var key = [ch,pitch];
            var key = ch + "_" + pitch;
            if (ev.type == 'note') {
                if (pendingNotes[key]) {
                    console.log("note overwrite", t, key);
                }
                pendingNotes[key] = ev;
            }
            if (ev.type == 'noteOff') {
                var noteEv = pendingNotes[key];
                if (noteEv) {
                    var dur = t - noteEv.t;
                    console.log("setting duration for note", key, t, dur);
                    noteEv.duration = dur;
                }
                else {
                    console.log("Note off for unstarted note", t, key);
                }
                delete pendingNotes[key];
            }
            //console.log(t, ev);
        }
        for (var key in pendingNotes) {
            console.log("Note was not turned off", t, key, pendingNotes[key]);
        }
        return song;
    }
}

class PlayTool_TinySynth {
    constructor() {
        var player = this;
        console.log("****** Using MidiPlayTool_TinySYnth");

        player.ticksPerSec = 1000;
        player.ticksPerBeat = 1200;
        player.beatsPerMin = 100;
        //player.delay0 = 1;
        player.delay0 = 0.0;
        player.isPlaying = false;
        player.distPerSec = 0.2;
        player.muted = {};
        player.midiObj = null;
        player.loadedInstruments = {};
        player.lastEventPlayTime = 0;
        player.lastEventClockTime = 0;
        player.instruments = {};
        player.loop = false;
        player.midiPrefix = "midi/";
        player.soundfontUrl = "soundfont/"
        player.prevPt = null;
        player.midiDivInitialized = false;
        player.stateObserver = null;
        player.compositions = [
            "Bach/wtc0",
            "Bach/passac",
            "Bach/bach_cello_suite",
            "Classical/chopin69",
            "Classical/beethovenSym5m1",
            "Classical/minute_waltz",
            "NewAge/DistantDrums",
            "NewAge/EarthandSky",
            "NewAge/silkroad",
            "NewAge/distdrums",
            //    "Risset/rissetBeat",
            "Shepard/shepard",
            "Shepard/shepard_cmajor",
            "BluesRhythm1",
            "jukebox",
            "shimauta1",
            "shores_of_persia"
        ];
        player.initGUI();
        var inst = this;
        this.synth = new MyWebAudioTinySynth({ voices: 64 });
        this.synth.playTool = this;
        //this.setProgram(116);
        //this.setProgram(0);
        var showStats = false;
        if (showStats)
            setInterval(() => inst.showStatus(), 100);
        _MIDI_PLAYER = this;
    }

    async playMIDI(url, play) {
        if (play == null)
            play = true;
        var song = await this.synth.asyncLoadMIDIUrl(url);
        console.log("Got song!!", song);
        //if (play)
        //    this.synth.playMIDI();
        var songObj = this.synth.processSong(song);
        var obj = this.convertTinySynthSong(songObj);
        window.MIDI_OBJ = obj;
        this.playMidiObj(obj, false)
        var useOurSeq = 1;
        if (play) {
            if (useOurSeq) {
                console.log("******* Using Our Synth ******");
                this.startPlaying();
            }
            else {
                console.log("******* Using TinySynth ******");
                this.synth.playMIDI();
            }
        }
        return songObj;
    }

    showStatus() {
        var st = this.synth.getPlayStatus();
        var str = "Play:" + st.play + "  Pos:" + st.curTick + "/" + st.maxTick;
        console.log(str);
    }

    setProgram(p) {
        console.log("SetProgram", p);
        this.synth.send([0xc0, p]);
    }

    startUpdates() {
        var player = this;
        var render = function () {
            //console.log("render n: "+steps);			  
            requestAnimationFrame(render);
            player.update();
        }
        render();
    }

    async startPlaying() {
        console.log("startPlaying");
        if (window.MIDI_BOX)
            await window.MIDI_BOX.init();
        if (this.midiObj == null) {
            console.log("No midi loaded");
            return;
        }
        $("#midiTogglePlaying").text("Pause");
        this.setupInstruments();
        this.playSync(this.midiObj);
        if (this.stateObserver)
            this.stateObserver('play');
    }

    pausePlaying() {
        console.log("Pause Playing", this.getPlayTime());
        this.isPlaying = false;
        var pt = this.getPlayTime();
        this.setPlayTime(pt);
        //var pt2 = this.getPlayTime();
        //console.log("pausePlaying", pt, pt2);
        $("#midiTogglePlaying").text("Play");
        if (this.stateObserver)
            this.stateObserver('stop');
    }

    stopPlaying() {
        this.pausePlaying();
    }

    togglePlaying() {
        console.log("togglePlaying pt", this.getPlayTime());
        if ($("#midiTogglePlaying").text() == "Play") {
            this.startPlaying();
        }
        else {
            this.pausePlaying();
        }
    }

    // this converts from the JSON format produced by ToneJS midi converter
    // to our own format produced using a Python midi package...
    convertToneJSMidi(obj) {
        console.log("==============================================================================")
        console.log("trying to convert", obj);
        var nobj = {
            "format": 0,
            "instruments": [],
            "resolution": 384,
            "channels": [
                0
            ],
            "tracks": [],
            "type": "MidiObj"
        };
        //console.log("nobj", nobj);
        //console.log("tracks", obj.tracks);
        for (var i = 0; i < obj.tracks.length; i++) {
            var track = obj.tracks[i];
            //console.log("track", i, track);
            var ntrack = {
                "instruments": [],
                "tMax": 68817,
                "channels": [
                    0
                ],
                "numNotes": 0,  //******BOGUS
                "tMax": 0,  //******BOGUS
                "type": "TrackObj",
                "seq": []
            }
            //console.log("notes", track.notes);
            for (var j = 0; j < track.notes.length; j++) {
                var note = track.notes[j];
                //console.log(" note", j, note);
                var t0 = note.ticks;
                var dur = note.durationTicks;
                var pitch = note.midi;
                var v = note.velocity;
                var nnote = [t0, [{ pitch, v, t0, dur, channel: 0, type: 'note' }]];
                //console.log("nnote", nnote);
                ntrack.seq.push(nnote);
            }
            ntrack.numNotes = ntrack.seq.length;
            ntrack.tMax = t0;
            nobj.tracks.push(ntrack);
        }
        window.NMIDOBJ = nobj;
        //console.log("NMIDIOBJ", JSON.stringify(nobj, null, 3));
        return nobj;
    }

    // convert a song object read in by TinySynth from a MIDI file
    // and convert to our own format.
    convertTinySynthSong(songObj) {
        console.log("==============================================================================")
        console.log("convertTinySynthSong", songObj);
        var tick2time = 4 * 60 / songObj.tempo / songObj.timebase;
        var res = 1 / tick2time;
        var obj = {
            "format": 0,
            "instruments": [],
            "resolution": res,
            "channels": [
                0
            ],
            "tracks": [],
            "type": "MidiObj"
        };
        //console.log("track", i, track);
        var track = {
            "instruments": [],
            "channels": [
                0
            ],
            "numNotes": 0,  //******BOGUS
            "tMax": 0,  //******BOGUS
            "type": "TrackObj",
            "seq": []
        }
        //console.log("notes", track.notes);
        var t0 = 0;
        for (var j = 0; j < songObj.ev.length; j++) {
            var event = songObj.ev[j];
            if (event.type != 'note')
                continue;
            //console.log(" note", j, note);
            t0 = event.t;
            var channel = event.channel;
            var dur = event.duration;
            var pitch = event.pitch;
            var v = event.v;
            var note = [t0, [{ pitch, v, t0, dur, channel: 0, type: 'note' }]];
            //console.log("nnote", nnote);
            track.seq.push(note);
            //t0 += dur;
        }
        console.log("bpm", this.beatsPerMin);
        console.log("ticksPerSec", this.ticksPerSec);
        console.log("ticksPerBeat", this.ticksPerBeat);
        console.log("resolution", obj.resolution);
        var durationTicks = t0;
        var duration = durationTicks / this.ticksPerSec;
        console.log("duration", duration);
        var numBeats = duration * this.beatsPerMin / 60;
        console.log("numBeats", numBeats);
        var totalBeats = t0 / this.ticksPerBeat;
        console.log("totalBeats", totalBeats);
        var paddingBeats = 0;
        if (paddingBeats) {
            t0 += paddingBeats * this.ticksPerBeat;
            var marker = [t0, [{ type: 'marker', name: 'end' }]];
            track.seq.push(marker);
        }
        track.numNotes = track.seq.length;
        track.tMax = t0;
        obj.tracks.push(track);
        window.NMIDOBJ = obj;
        //console.log("NMIDIOBJ", JSON.stringify(nobj, null, 3));
        return obj;
    }

    /*
    addPadding(obj, padding) {
        if (obj.tracks.length != 1) {
            alert("Can only adjust midi objs with one track");
        }
        var track = obj.tracks[0];
        var t0 = track.tMax + padding;
        var marker = [t0, [{type:'marker', name:'end'}]];
        track.seq.push(marker);
        track.numNotes = track.seq.length;
        track.tMax = t0;
    }
    */

    playMelody(name, autoStart) {
        this.loadMelody(name, autoStart);
    }

    // load a MIDI obj JSON file and prepare to play it
    async loadMelody(name, autoStart) {
        var inst = this;
        console.log("MidiPlayTool.loadMelody " + name + " autostart: " + autoStart);
        this.stopPlaying();
        var melodyUrl = this.midiPrefix + name + ".json";
        try {
            var obj = await loadJSON(melodyUrl);
            if (obj.type != "MidiObj")
                obj = this.convertToneJSMidi(obj);
            window.MIDI_OBJ = obj;
            inst.playMidiObj(obj, autoStart);
        }
        catch (e) {
            alert("Failed to load " + name);
            console.log("err:", e);
        }
    }


    fmt(t) { return "" + Math.floor(t * 1000) / 1000; }

    playMidiObj(obj, autoStart) {
        this.midiObj = this.processMidiObj(obj);
        //TODO: make this really wait until instruments are loaded.
        this.i = 0;
        this.prevPt = 0;
        this.setPlayTime(0);
        if (autoStart)
            this.startPlaying();
    }

    /*
    This takes a midiObj as returned by JSON and figures out what
    instruments are requred, and also arranges a sequence of events
    grouped by times.
     */
    processMidiObj(midiObj, opts) {
        var player = this;
        opts = opts || {};
        console.log("processMidiObj");
        if (midiObj.type != "MidiObj") {
            console.log("midiObj has unexpected type " + midiObj.type);
        }
        var tracks = midiObj.tracks;
        var ntracks = tracks.length;
        console.log("num tracks " + ntracks);
        console.log("Now merging " + ntracks + " tracks.");
        let seqTimes = [];
        let seqEvents = {};
        if (midiObj.resolution) {
             player.ticksPerBeat = midiObj.resolution;
        }
        else {
            console.log("**** WARNING NO RESOLUTON in the MidiObject ****");
            player.ticksPerBeat = 500;
        }

        var bpm = player.beatsPerMin;
        player.ticksPerSec = player.ticksPerBeat * bpm / 60;
        // This is just a guess... we will override if there is a tempo
        player.trackChannels = {};  // These are 'global' tracks which
        // arise from a given channel of a
        // midi track                      
        player.instruments = {};
        player.loop = false;
        if (midiObj.loop) {
            console.log("***set to loop");
            player.loop = true;
        }
        for (var trackNo = 0; trackNo < tracks.length; trackNo++) {
            var track = tracks[trackNo];
            var ntchs = 0;
            //if (track.numNotes === 0)
            //    continue;
            if (track.channels) {
                for (var k = 0; k < track.channels.length; k++) {
                    var ch = track.channels[k];
                    var gch = ch; // global channel assignment
                    //var tchName = "T"+i+"."+k+"_"+ch;
                    var tchName = "T" + trackNo + "_" + ch + "_" + gch;
                    player.trackChannels[tchName] = {
                        'id': tchName,
                        'channel': ch,
                        'track': track,
                        'trackNo': trackNo
                    };
                    ntchs++;
                }
            }
            if (ntchs == 0) {
                // No channels were assigned - we will use 0
                var ch = 0;
                var gch = 0; // 
                var tchName = "T" + trackNo + "_" + ch + "_" + gch;
                player.trackChannels[tchName] = {
                    'id': tchName,
                    'channel': ch,
                    'trackNo': trackNo,
                    'track': track
                };
            }
            if (track.instrument) {
                console.log("track.instrument: " + track.instrument);
                player.instruments[track.instrument] = 1;
            }
            else {
                player.instruments[0] = 1;
            }
            if (track.instruments) {
                console.log("track.instruments: " + track.instruments);
                for (var k = 0; k < player.instruments.length; k++) {
                    var inst = player.instruments[k];
                    player.instruments[inst] = 1;
                }
            }
            var evGroups = track.seq;
            for (var j = 0; j < evGroups.length; j++) {
                var evGroup = evGroups[j];
                var t0 = evGroup[0];
                var evs = evGroup[1];
                for (var k = 0; k < evs.length; k++) {
                    var ev = evs[k];
                    ev.track = trackNo;
                    if (ev.type == "tempo") {
                        var bpm = ev.bpm;
                        var mpqn = ev.mpqn;
                        //console.log("tempo bpm: " + bpm + " mpqn: " + mpqn);
                        if (midiObj.tempo)
                            midiObj.tempo.push(ev);
                        else
                            midiObj.tempo = [ev];
                    }
                    if (ev.type == "programChange") {
                        console.log(">>> programChange", ev);
                        var ch = ev.channel;
                        var gch = ch;
                        var inst = ev.instrument;
                        var tchName = "T" + trackNo + "_" + ch + "_" + gch;
                        console.log(">> " + tchName);
                        player.trackChannels[tchName].instrument = inst;
                    }
                    if (seqEvents[t0]) {
                        seqEvents[t0][1].push(ev);
                    }
                    else {
                        seqEvents[t0] = [t0, [ev]];
                        seqTimes.push(t0);
                    }
                }
            }
        }
        seqTimes.sort(function (a, b) { return a - b; });
        var seq = []
        var durationTicks = 0;
        for (var i = 0; i < seqTimes.length; i++) {
            var t = seqTimes[i];
            var evGroup = seqEvents[t];
            seq.push([t, evGroup[1]]);
            durationTicks = t;//
            //console.log("t: "+ t+ " nevents: "+evGroup.length);
        }
        midiObj.seq = seq;
        if (midiObj.durationTicks == null) {
            //alert("setting midiObj.durationTicks");
            midiObj.durationTicks = durationTicks;
        }
        else {
            if (midiObj.durationTicks != durationTicks) {
                alert("mismatched durationTicks");
                console.log("mismatch", midiObj.durationTicks, durationTicks);
                midiObj.durationTicks = durationTicks;
            }
        }
        midiObj.duration = midiObj.durationTicks / player.ticksPerSec;
        player.loadInstruments();
        if (!midiObj.tempo) {
            console.log("***** tempo unknown");
        }
        else {
            var tempos = midiObj.tempo;
            console.log("tempos: " + tempos.length);
            //console.log("tempos: "+JSON.stringify(tempos));
            if (tempos.length > 0) {
                var tempo = tempos[0];
                if (tempo.bpm) {
                    player.beatsPerMin = tempo.bpm;
                    player.ticksPerSec = player.ticksPerBeat * tempo.bpm / 60;
                    console.log("tempo bpm: " + tempo.bpm + " -> ticksPerSec: " + player.ticksPerSec);
                }
                if (tempo.mpqn) {
                    var mpqn = tempo.mpqn;
                    var spqn = mpqn / 1000000.0;
                    var qnps = 1 / spqn; //qnotes per sec
                    var bpqn = 1; // really depends on time signature
                    var bps = bpqn * qnps;
                    player.ticksPerSec = player.ticksPerBeat * bps;
                    console.log("tempo mpqn: " + tempo.mpqn + " -> bps: " + 60 * bps +
                        " ticksPerSec: " + player.ticksPerSec);
                }
            }
        }
        try {
            player.setupTrackInfo();
            player.showTempo();
        }
        catch (e) {
            console.log("err: " + e);
        }
        this.midiObj = midiObj;
        this.dump();
        console.log("processMidiObj returing", midiObj);
        this.events = midiObj.seq;
        return midiObj;
        //    return midiObj.tracks[ntracks-1];
    }

    dump() {
        console.log("---------------------------------------");
        console.log("bpm", this.beatsPerMin);
        console.log("ticksPerSec", this.ticksPerSec);
        console.log("ticksPerBeat", this.ticksPerBeat);
        if (this.midiObj) {
            console.log("resolution", this.midiObj.resolution);
            console.log("durationTicks", this.midiObj.durationTicks);
            console.log("duration", this.getDuration());
        }
        console.log("midiPrefix", this.midiPrefix);
        console.log("soundFontUrl", this.soundfontUrl);
        console.log("loaded instruments", this.loadedInstruments);
        var trackChannels = this.trackChannels;
        for (var tchName in trackChannels) {
            console.log("track ", tchName, trackChannels[tchName]);
        }
    }

    playSync(obj) {
        console.log("playSync");
        //this.i = 0;
        this.delay0 = 0;
        this.events = obj.seq;
        this.isPlaying = true;
    }

    getPlayTime() {
        if (this.pseudoClock)
            return this.pseudoClock.getPlayTime();
        var ct = getClockTime();
        if (this.isPlaying) {
            var t = this.lastEventPlayTime + (ct - this.lastEventClockTime);
            this.lastEventPlayTime = t;
            this.lastEventClockTime = ct;
            return t;
        }
        else {
            this.lastEventClockTime = ct;
            return this.lastEventPlayTime;
        }
    }

    setPlayTime(t) {
        var periodic = false;
        if (periodic && this.getDuration()) {
            t = t % this.getDuration();
        }
        if (this.pseudoClock)
            this.pseudoClock.setPlayTime(t);
        this.lastEventPlayTime = t;
        this.lastEventClockTime = getClockTime();
        //TODO: should set player.i to appopriate place...
    }

    nearestTimeP(t, t0, dur) {
        if (!dur)
            return t;
        //console.log(sprintf("spt dur: %.3f  t0: %.3f  t: %.3f", dur, t0, t));
        var tp = t % dur;
        var t0p = t0 % dur;
        var dt = tp - t0p;
        //console.log(sprintf("  t0p: %.3f  tp: %.3f  dt: %.3f", t0p, tp, dt));
        if (Math.abs(dt + dur) < Math.abs(dt)) {
            dt += dur;
        }
        else if (Math.abs(dt - dur) < Math.abs(dt)) {
            dt -= dur;
        }
        t = t0 + dt;
        //console.log(" t <-", t);
        return t;
    }

    // set play time, but choose the nearest instance of t+n*dur
    // to the previous play time.
    setPlayTimeNearestP(t) {
        t = this.nearestTimeP(t,)
        var t0 = this.getPlayTime();
        var dur = this.getDuration();
        t = this.nearestTimeP(t, t0, dur);
        if (this.pseudoClock)
            this.pseudoClock.setPlayTime(t);
        this.lastEventPlayTime = t;
        this.lastEventClockTime = getClockTime();
        //TODO: should set player.i to appopriate place...
    }

    rewind() {
        console.log("rewind");
        this.i = 0;
        this.prevPt = 0;
        this.setPlayTime(0);
    }

    getDuration() {
        if (this.midiObj)
            return this.midiObj.duration;
        return null;
    }

    //
    checkForEvent() {
        //console.log("playNextStep "+player.i);
        /*
        if (!this.isPlaying) {
            console.log("player stopped!");
            return;
        }
        */
        //console.log("checkForEvent");
        if (!this.events)
            return;
        var nevents = this.events.length;
        if (nevents == 0)
            return;
        if (!this.loop && this.i >= nevents) {
            this.i = 0;
            this.lastEventPlayTime = 0;
        }
        var pt = this.getPlayTime();
        var dur = this.getDuration();
        var n = Math.floor(this.i / nevents);
        var k = this.i % nevents;
        //console.log("checkForEvent i, n, k, pt, dur", this.i, n, k, pt, dur);
        var evGroup = this.events[k];
        var nextT0 = evGroup[0];
        //var nextPt = nextT0/this.ticksPerBeat;
        var nextPt = n * dur + nextT0 / this.ticksPerSec;
        nextPt = this.nearestTimeP(nextPt, pt, dur);
        //console.log("pt, n, dur, nextPt", pt, n, dur, nextPt);
        if (pt < nextPt) {
            if (this.i > 0) {
                var n = Math.floor((this.i - 1) / nevents);
                var k = (this.i - 1) % nevents;
                var evGroup = this.events[k];
                var prevT0 = evGroup[0];
                var prevPt = n * dur + prevT0 / this.ticksPerSec;
                prevPt = this.nearestTimeP(prevPt, pt, dur);
                //var prevPt = prevT0/this.ticksPerBeat;
                if (pt > prevPt)
                    return;
                console.log("PlayTool reverse");
                this.handleEventGroup(evGroup);
                this.i -= 1;
                if (this.i < 0)
                    this.i = 0;
            }
            return;
        }
        this.handleEventGroup(evGroup);
        this.i += 1;
        if (this.i >= nevents) {
            if (this.loop) {
                //console.log("Finished loop");
                //this.i = 0;
                //this.lastEventPlayTime = 0;
                return;
            }
            console.log("Finished playing");
            this.isPlaying = false;
            this.stopPlaying();
            return;
        }
    }

    // an event group is [t, events]
    // events could have several types.  For type "note" they look like
    // {channel, dur, pitch, t0, track, type, v}
    handleEventGroup(eventGroup) {
        var player = this;
        var t0 = eventGroup[0];
        var events = eventGroup[1];
        window.EVGRP = eventGroup;
        //console.log("handleEventGroup");
        for (var k = 0; k < events.length; k++) {
            var event = events[k];
            var etype = event.type;
            var t0_ = event.t0;
            var t = 0;
            if (etype == "tempo") {
                var bpm = event.bpm;
                var mpqn = event.mpqn;
                console.log("tempo bpm: " + bpm + "  mpqn: " + mpqn);
                continue;
            }
            var channel = event.channel;
            if (etype == "programChange") {
                var inst = event.instrument;
                //console.log("programChange ch: " + channel + " inst: " + inst);
                player.programChange(event.track, channel, inst);
                continue;
            }
            if (etype == "note") {
                if (player.muted[event.channel])
                    continue;
                if (t0_ != t0) {
                    console.log("*** mismatch t0: " + t0 + " t0_: " + t0_);
                }
                this.handleNote(t0, event);
                continue;
            }
            if (etype == "marker" || etype == "metronome") {
                this.handleNote(t0, event);
                continue;
            }
            console.log("*** unexpected etype: " + etype);
        }
    }

    handleNote(t0, note) {
        //console.log("note: ", note);
        if (note.type != 'note')
            return;
        var t = 0;
        var pitch = note.pitch;
        var v = note.v;
        var channel = note.channel;
        //var dur = note.dur/player.ticksPerBeat;
        var dur = note.dur / this.ticksPerSec;
        this.playNote(channel, pitch, v, t, dur);
        if (this.noteObserver)
            this.noteObserver(channel, pitch, v, t, dur);
    }

    playNote(channel, pitch, v, t, dur) {
        this.noteOn(channel, pitch, v, t);
        this.noteOff(channel, pitch, t + dur);
    }

    noteOn(channel, pitch, v, t) {
        if (t == null)
            t = 0;
        //console.log("noteOn", channel, pitch, v, t);
        var msg = [0x90, pitch, 100];
        //console.log("msg", msg);
        this.synth.send(msg, t * 1000);
    }

    noteOff(channel, pitch, t) {
        if (t == null)
            t = 0;
        //console.log("noteOff", channel, pitch, v, t);
        var msg = [0x80, pitch, 0];
        this.synth.send(msg, t * 1000);
    }

    programChange(trackNo, ch, inst) {
        //console.log("MidiPlayTool.programChange trackNo: " + trackNo + " ch: " + ch + " inst: " + inst);
        //console.log("**** ignoring programChange");
        return;
    }


    getInstName(inst) {
        if (typeof inst == typeof "str")
            return inst;
        return this.synth.getTimbreName(0, inst);
    }

    setupInstruments() {
        console.log("setupInstruments");
        for (var tchName in this.trackChannels) {
            var tch = this.trackChannels[tchName];
            if (tch.instrument) {
                this.programChange(tch.trackNo, tch.channel, tch.instrument)
            }
        }
    }

    loadInstruments(successFn) {
        var player = this;
        console.log("******** ignoring loadInstruments");
        return;
    }


    setupChannel(chNo, inst, successFn) {
        console.log("setupChannel", chNo, inst, successFn);
        console.log("**** ignoring setupChannel");
        return;
    }


    loadInstrument(instr, successFn) {
        console.log("loadInstrument " + instr);
        this.setupChannel(0, instr, successFn);
    }

    update() {
        //console.log("mplayer update");
        var pt = this.getPlayTime();
        if (this.isPlaying || pt != this.prevPt) {
            //console.log("update pt", pt);
            this.checkForEvent();
        }
        //if (this.prevPt && pt < this.prevPt) {
        //    console.log("**** pt < prevPt ****");
        //}
        this.prevPt = pt;
        //$("#midiStatus").html("Time: "+this.fmt(pt));
        $("#midiTime").val(this.fmt(pt));
    }

    //******************************************************************
    // These have to do with the Web GUI for midi control
    //
    muteCheckboxChanged(e, mute_id, tchName) {
        console.log("muteCheckboxChanged", mute_id, tchName);
        var trackChannel = this.trackChannels[tchName];
        var trackNo = trackChannel.trackNo;
        var ch = trackChannel.channel;
        var id = $("#" + mute_id).attr('id');
        //var i = id.lastIndexOf("_");
        //var ch = id.slice(i + 1);
        console.log("id: " + id + " ch: " + ch);
        var val = $("#" + mute_id).is(":checked");
        //var val = $("#"+mute_id).is(":checked");
        val = eval(val);
        console.log("mute_id: " + id + " ch: " + ch + "  val: " + val);
        //this.muted[trackNo] = val;
        this.muted[ch] = val;
    }

    instrumentChanged(e, select_id) {
        console.log("instrumentChanged")
        //var id = $(this).attr('id');
        var tchName = select_id.slice("select".length);
        var id = select_id;
        var i = id.lastIndexOf("_");
        var ch = id.slice(i + 1);
        var val = $("#" + select_id).val();
        val = eval(val);
        //val = val - 1; // indices start at 0 but names start at 1
        console.log("id: " + id + " ch: " + ch + "  val: " + val);
        this.setProgram(val);
        /*
        this.setupChannel(ch, val, () => {
            console.log("completed instrumentChanged", id, tchName, ch, val);
            this.trackChannels[tchName].instrument = val;
            this.dump();
        });
        */
    }

    s//etupMidiControlDiv() {
    initGUI() {
        var player = this;
        if (this.midiDivInitialized)
            return;
        this.midiDivInitialized = true;
        $("#midiCompositionSelection").change(e => player.compositionChanged(e));
        $("#midiBPM").change(e => player.timingChanged(e));
        $("#midiTPB").change(e => player.timingChanged(e));
    }

    setBPM(bpm) {
        this.beatsPerMin = bpm;
        var prevTPS = this.ticksPerSec;
        this.ticksPerSec = this.ticksPerBeat * this.beatsPerMin / 60;
        var pt = this.getPlayTime();
        var npt = pt * prevTPS / this.ticksPerSec;
        console.log("setBPM", pt, npt);
        this.setPlayTime(npt);
        //this.setPlayTime(pt * this.ticksPerSec / prevTPS);
        if (this.midiObj) {
            this.midiObj.duration = this.midiObj.durationTicks / this.ticksPerSec;
        }
        this.showTempo();
    }


    timingChanged(e) {
        console.log("*** tpbChanged");
        var bpm, tpb;
        try {
            bpm = eval($("#midiBPM").val());
            tpb = eval($("#midiTPB").val());
        }
        catch (e) {
            console.log("err: " + e);
            return;
        }
        console.log("tpb: " + tpb + " bpm: " + bpm);
        if (bpm)
            this.beatsPerMin = bpm;
        if (tpb)
            this.ticksPerBeat = tpb;
        this.ticksPerSec = this.ticksPerBeat * this.beatsPerMin / 60;
        this.showTempo();
    }

    showTempo() {
        $("#midiBPM").val(this.fmt(this.beatsPerMin));
        $("#midiTPS").val(this.fmt(this.ticksPerSec));
        $("#midiTPB").val(this.fmt(this.ticksPerBeat));
    }


    setupTrackInfo() {
        var player = this;
        console.log("setupTrackInfo");
        var d = $("#midiTrackInfo");
        /*
        if (d.length == 0) {
            console.log("**** No track info div found *****");
            this.setupMidiControlDiv();
        }
        */
        d.html('<table id="midiTable"></table>');
        $("#midiTable").append("<tr><th>Track</th><th>mute</th><th>instrument</th></tr>\n");
        for (let tchName in player.trackChannels) {
            var trackChannel = player.trackChannels[tchName];
            var ch = trackChannel.channel;
            if (trackChannel.track.numNotes == 0)
                continue;
            console.log("Tchannel: " + tchName + " ch: " + ch);
            let mute_id = "mute" + tchName;
            let select_id = "select" + tchName;
            console.log("mute_id: " + mute_id + "   select_id: " + select_id);
            var s = '<td>TCH_NAME</td>';
            s += '<td><input type="checkbox" id="MUTE_ID"></td>\n';
            s += '<td><select id="SELECT_ID"></select></td>\n';
            s = s.replace("TCH_NAME", tchName);
            s = s.replace("MUTE_ID", mute_id);
            s = s.replace("SELECT_ID", select_id);
            $("#midiTable").append("<tr>" + s + "</tr>");
            var cb = $("#" + mute_id);
            cb.change(e => player.muteCheckboxChanged(e, mute_id, tchName))
            var sel = $("#" + select_id);
            for (var i = 0; i < 128; i++) {
                var instObj = this.getInstObjById(i);
                var instName = i + " " + instObj.name;
                sel.append($('<option>', { value: i, text: instName }));
            }
            var inst = trackChannel.instrument;
            console.log("instrument: " + inst);
            if (inst) {
                sel.val(inst);
            }
            sel.change(e => player.instrumentChanged(e, select_id));
        }
        this.showTempo();
    }

    getInstObjById(id) {
        var name = this.getInstName(id);
        return { name, id }
    }

    noteObserver(channel, pitch, vel, t, dur) {
        //console.log("play note", channel, pitch, vel, dur, t);
    }

    toggleTracks() {
        console.log("toggleTracks");
        var d = $("#midiTrackInfo");
        if (d.is(":visible")) {
            $("#midiTrackInfo").hide();
        }
        else {
            $("#midiTrackInfo").show();
        }
    }

}
function newFunction(obj, i) {
    return obj.tracks[i];
}


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

    dumpSong(song) {
        song = song || this.song;
        var evts = song.ev;
        for (var i=0; i<evts.length; i++) {
            var ev = evts[i];
            var t = ev.t;
            console.log(t, ev.m);
        }
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
        //
        // Monkeypatch to override synth.loadMIDI
        /*
        this.synthLoadMIDI = this.synth.loadMIDI;
        this.synth.loadMIDI = data => {
            console.log("loadMIDI", data);
            inst.synthLoadMIDI(data);
            console.log("**** Loaded.  Got song", this.synth.song);
            inst.synth.playMIDI();
        }
        */
        //this.setProgram(116);
        //this.setProgram(0);
        var showStats = false;
        if (showStats)
            setInterval(() => inst.showStatus(), 100);
        _MIDI_PLAYER = this;
    }

    async playMIDI(url, play) {
        var song = await this.synth.asyncLoadMIDIUrl(url);
        console.log("Got song!!", song);
        if (play)
            this.synth.playMIDI();
        this.synth.dumpSong(song);
        return song;
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

    rewind() {
        console.log("rewind");
        this.i = 0;
        this.setPlayTime(0);
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
    convertMidiFormat(obj) {
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

    playMidi(url) {
        this.synth.playMidiU

    }

    playMelody(name, autoStart) {
        this.loadMelody(name, autoStart);
    }

    async loadMelody(name, autoStart) {
        var inst = this;
        console.log("MidiPlayTool.loadMelody " + name + " autostart: " + autoStart);
        this.stopPlaying();
        var melodyUrl = this.midiPrefix + name + ".json";
        try {
            var obj = await loadJSON(melodyUrl);
            if (obj.type != "MidiObj")
                obj = this.convertMidiFormat(obj);
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
        this.setPlayTime(0);
        if (autoStart)
            this.startPlaying();
    }

    /*
    This takes a midiObj as returned by JSON and figures out what
    instruments are requred, and also arranges a sequence of events
    grouped by times.
     */
    processMidiObj(midiObj) {
        var player = this;
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
        this.dump();
        console.log("projcessMidiObj returing", midiObj);
        return midiObj;
        //    return midiObj.tracks[ntracks-1];
    }

    dump() {
        console.log("---------------------------------------");
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
        console.log("setPlayTime t: " + t);
        if (this.pseudoClock)
            return this.pseudoClock.setPlayTime();
        this.lastEventPlayTime = t;
        this.lastEventClockTime = getClockTime();
        //TODO: should set player.i to appopriate place...
    }

    getDuration() {
        if (this.midiObj)
            return this.midiObj.duration;
        return null;
    }

    //
    checkForEvent() {
        //console.log("playNextStep "+player.i);
        if (!this.isPlaying) {
            console.log("player stopped!");
            return;
        }
        var pt = this.getPlayTime();
        var evGroup = this.events[this.i];
        var nextT0 = evGroup[0];
        //var nextPt = nextT0/this.ticksPerBeat;
        var nextPt = nextT0 / this.ticksPerSec;
        if (pt < nextPt) {
            if (this.i > 0) {
                var evGroup = this.events[this.i - 1];
                var prevT0 = evGroup[0];
                //var prevPt = prevT0/this.ticksPerBeat;
                var prevPt = prevT0 / this.ticksPerSec;
                if (pt > prevPt)
                    return;
                this.handleEventGroup(evGroup);
                this.i -= 1;
                if (this.i < 0)
                    this.i = 0;
            }
            return;
        }
        this.handleEventGroup(evGroup);
        this.i += 1;
        if (this.i >= this.events.length) {
            if (this.loop) {
                console.log("Finished loop");
                this.i = 0;
                this.lastEventPlayTime = 0;
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
                console.log("programChange ch: " + channel + " inst: " + inst);
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
        //console.log("note: "+JSON.stringify(note));
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
        //console.log("noteOn", channel, pitch, v, t);
        var msg = [0x90, pitch, 100];
        //console.log("msg", msg);
        this.synth.send(msg);
    }

    noteOff(channel, pitch, t) {
        //console.log("noteOff", channel, pitch, v, t);
        var msg = [0x80, pitch, 0];
        if (t) {
            var inst = this;
            setTimeout(() => inst.synth.send(msg), t * 1000);
        }
        else {
            this.synth.send([0x80, pitch, 0]);
        }
    }

    programChange(trackNo, ch, inst) {
        console.log("MidiPlayTool.programChange trackNo: " + trackNo + " ch: " + ch + " inst: " + inst);
        console.log("**** ignoring programChange");
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
        if (this.isPlaying) {
            //console.log("update pt", pt);
            this.checkForEvent();
        }
        if (this.prevPt && pt < this.prevPt) {
            console.log("**** pt < prevPt ****");
        }
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

    compositionChanged(e) {
        var name = $("#midiCompositionSelection").val();
        console.log("compositionChanged: " + name);
        this.loadMelody(name);
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
        player.showCompositions();
    }

    showCompositions() {
        console.log("showCompositions");
        var sel = $("#midiCompositionSelection");
        sel.html("");
        sel.append($('<option>', { value: "None", text: "(None)" }));
        for (var i = 0; i < this.compositions.length; i++) {
            var compName = this.compositions[i];
            console.log("**** adding comp " + compName);
            sel.append($('<option>', { value: compName, text: compName }));
        }
    }

    async loadCompositions(url) {
        console.log("LoadCompositions " + url);
        var inst = this;
        try {
            var obj = await loadJSON(url);
            this.compositionsLoaded(obj);
        }
        catch (e) {
            console.log("failed to load " + url);
        }
    }

    compositionsLoaded(obj) {
        console.log("compositionsLoaded");
        console.log("comps: " + obj);
        this.compositions = obj;
        this.showCompositions();
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
        console.log("tpbChanged");
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



"use strict"

var instMap = {
    0: "acoustic_grand_piano",
    1: "violin",
    2: "harpsichord",
    3: "voice_oohs",
    4: "steel_drun",
    5: "choir_aahs",
    6: "paradiddle",
    7: "pad_3_polysynth",
};
instMap = {};

// this is a hack so that some html buttons with strings for events can
// access instance of MidiPlayTool.
var _MIDI_PLAYER = null;

class MidiPlayTool_WMB {
    constructor() {
        var player = this;
        player.ticksPerSec = 1000;
        player.ticksPerBeat = 1200;
        player.beatsPerMin = 100;
        //player.delay0 = 1;
        player.delay0 = 0.0;
        player.isPlaying = false;
        player.distPerSec = 0.2;
        player.graphics = null;
        player.scene = null;
        player.graphicsScale = null;
        player.muted = {};
        player.midiObj = null;
        player.loadedInstruments = {};
        player.lastEventPlayTime = 0;
        player.lastEventClockTime = 0;
        player.seqNum = 0;
        player.graphicsX0 = -8;
        player.graphicsSpiral = true;
        player.instruments = {};
        player.loop = false;
        player.USE_NEW_METHOD = true;
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

        MIDI.loader = new sketch.ui.Timer; // this seems to be an override to show progress on loading
        _MIDI_PLAYER = this;
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
        console.log("Pause Playing");
        this.isPlaying = false;
        this.setPlayTime(this.getPlayTime());
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
        if ($("#midiTogglePlaying").text() == "Play") {
            this.startPlaying();
        }
        else {
            this.pausePlaying();
        }
    }

    playMelody(name) {
        this.loadMelody(name, true);
    }

    loadMelody(name, autoStart) {
        var inst = this;
        console.log("MidiPlayTool.loadMelody " + name + " autostart: " + autoStart);
        this.stopPlaying();
        var melodyUrl = this.midiPrefix + name + ".json";
        $.getJSON(melodyUrl, function (obj) { inst.playMidiObj(obj, autoStart) });
    }

    // This tries to play a midi file using code from
    // https://github.com/Tonejs/Midi
    // Note: this is not working yet, because the form of JSON object
    // it gets for a midi file is different than the one this player
    // is based on.
    async loadMidiFile(url) {
        var midiReader = new MidiReader();
        var obj = await midiReader.loadMidiFile(url);
        return obj;
    }

    async playMidiFile(url) {
        var midiReader = new MidiReader();
        var obj = await midiReader.loadMidiFile(url);
        this.playMidiObj(obj);
        return obj;
    }


    fmt(t) { return "" + Math.floor(t * 1000) / 1000; }

    playMidiObj(obj, autoStart) {
        this.midiObj = this.processMidiObj(obj);
        //TODO: make this really wait until instruments are loaded.
        this.i = 0;
        this.setPlayTime(0);
        if (this.scene) {
            console.log("***** adding Note Graphics ******");
            this.addNoteGraphics(this.scene, this.midiObj);
        }
        else {
            console.log("***** No registered scene so not adding Note Graphics ******");
        }
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

        var bpm = 100;
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
                    //console.log("ev: "+JSON.stringify(ev)+" "+ev.track);
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
        var maxTime = 0;
        for (var i = 0; i < seqTimes.length; i++) {
            var t = seqTimes[i];
            var evGroup = seqEvents[t];
            seq.push([t, evGroup[1]]);
            maxTime = t;//
            //console.log("t: "+ t+ " nevents: "+evGroup.length);
        }
        midiObj.seq = seq;
        //midiObj.duration = maxTime/player.ticksPerBeat;
        midiObj.duration = maxTime / player.ticksPerSec;
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

    /*
      This version starts a series of callbacks for each time
      that events must be started.  There is one callback for
      each time that one or more new notes are played.
     */
    playSync(obj) {
        console.log("playSync");
        this.seqNum += 1;
        //this.i = 0;
        this.delay0 = 0;
        this.events = obj.seq;
        this.isPlaying = true;
        //this.lastEventPlayTime = 0;
        //this.lastEventClockTime = Date.now()/1000.0;
        if (!this.USE_NEW_METHOD) {
            setTimeout(function () {
                this.playNextStep(this.seqNum)
            }, 0);
        }
    }

    getPlayTime() {
        var ct = Date.now() / 1000.0;
        if (this.isPlaying) {
            var t = this.lastEventPlayTime + (ct - this.lastEventClockTime);
            return t;
        }
        else {
            this.lastEventClockTime = ct;
            return this.lastEventPlayTime;
        }
    }

    setPlayTime(t) {
        console.log("setPlayTime t: " + t);
        this.lastEventPlayTime = t;
        this.lastEventClockTime = Date.now() / 1000.0;
        //TODO: should set player.i to appopriate place...
    }

    //
    // THis works and is self scheduling...
    playNextStep(seqNum) {
        var player = this;
        //console.log("playNextStep "+this.i);
        if (!this.isPlaying) {
            console.log("player stopped!");
            return;
        }
        if (seqNum != this.seqNum) {
            console.log("***** old sequence detected - dropping it *****");
            return
        }
        var evGroup = this.events[player.i];
        var t0 = evGroup[0];
        //var pt = t0/this.ticksPerBeat;
        var pt = t0 / this.ticksPerSec;
        this.lastEventPlayTime = pt;
        this.lastEventClockTime = Date.now() / 1000.0;
        this.handleEventGroup(evGroup);
        this.i += 1;
        if (this.i >= this.events.length) {
            if (this.loop) {
                console.log("Finished loop");
                this.i = 0;
                this.lastEventPlayTime = 0;
            }
            else {
                console.log("FInished playing");
                this.isPlaying = false;
                this.stopPlaying();
                return;
            }
        }
        var t1 = player.events[player.i][0];
        var dt = (t1 - t0) / player.ticksPerSec;
        setTimeout(function () {
            player.playNextStep(seqNum)
        }, dt * 1000);
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
                this.lastEventPlayTime = pt;
                this.lastEventClockTime = Date.now() / 1000.0;
                this.handleEventGroup(evGroup);
                this.i -= 1;
                if (this.i < 0)
                    this.i = 0;
            }
            return;
        }
        this.lastEventPlayTime = pt;
        this.lastEventClockTime = Date.now() / 1000.0;
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
                //console.log("tempo bpm: " + bpm + "  mpqn: " + mpqn);
                continue;
            }
            var channel = event.channel;
            if (etype == "programChange") {
                var inst = event.instrument;
                console.log("programChange ch: " + channel + " inst: " + inst);
                //MIDI.programChange(channel, inst);
                player.programChange(event.track, channel, inst);
                continue;
            }
            if (etype == "note") {
                if (player.muted[event.channel])
                    continue;
                var note = event;
                //console.log("note: "+JSON.stringify(note));
                var pitch = note.pitch;
                var v = note.v;
                //var dur = note.dur/player.ticksPerBeat;
                var dur = note.dur / player.ticksPerSec;
                if (t0_ != t0) {
                    console.log("*** mismatch t0: " + t0 + " t0_: " + t0_);
                }
                //console.log("noteOn "+channel+" "+pitch+" "+v+" "+t+player.delay0);
                //console.log("noteOff "+channel+" "+pitch+" "+v+" "+t+dur+player.delay0);
                MIDI.noteOn(channel, pitch, v, t + player.delay0);
                MIDI.noteOff(channel, pitch, v, t + dur + player.delay0);
                if (player.noteObserver)
                    player.noteObserver(channel, pitch, v, t, dur);
                continue;
            }
            console.log("*** unexpected etype: " + etype);
        }
    }

    programChange(trackNo, ch, inst) {
        console.log("MidiPlayTool.programChange trackNo: " + trackNo + " ch: " + ch + " inst: " + inst);
        MIDI.programChange(ch, inst);
        try {
            var selName = "selectT" + trackNo + "_" + ch + "_" + ch;
            console.log("programChange sel: " + selName + " " + inst);
            $("#" + selName).val(inst);
        }
        catch (e) {
            console.log("err: " + e);
        }
    }

    setProgram(inst) {
        this.programChange(0, 0, inst);
    }

    getInstName(inst) {
        if (typeof inst == typeof "str")
            return inst;
        var instObj = MIDI.GM.byId[inst];
        console.log("getInstName: " + JSON.stringify(instObj));
        if (instObj) {
            return instObj.id;
        }
        return inst;
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
        console.log("loadInstruments " + JSON.stringify(player.instruments));
        var instruments = [];
        for (var id in this.instruments) {
            var instObj = MIDI.GM.byId[id];
            instruments.push(instObj.id);
        }
        console.log("instruments: " + instruments);
        MIDI.loadPlugin({
            //soundfontUrl: "./soundfont/",
            //soundfontUrl: "/rhythm/soundfont/",
            soundfontUrl: this.soundfontUrl,
            instruments: instruments,
            onprogress: function (state, progress) {
                MIDI.loader.setValue(progress * 100);
            },
            onprogress: function (state, progress) {
                if (MIDI.loader)
                    MIDI.loader.setValue(progress * 100);
            },
            onsuccess: function () {
                console.log("** finished with loading instruments");
                for (var i = 0; i < instruments.length; i++) {
                    var inst = instruments[i];
                    console.log("loaded " + inst);
                    player.loadedInstruments[inst] = true;
                }
                player.dump();
                if (successFn)
                    successFn();
            }
        });
    }


    setupChannel(chNo, inst, successFn) {
        var player = this;
        var instName = player.getInstName(inst);
        if (chNo == 9) {
            console.log("Special Hack using gunshot");
            instName = "gunshot";
        }
        console.log("setupChannel chNo: " + chNo + " inst: " + inst + " name: " + instName);
        var instrument = instName;
        MIDI.loadPlugin({
            soundfontUrl: player.soundfontUrl,
            instrument: instName,
            onprogress: function (state, progress) {
                MIDI.loader.setValue(progress * 100);
            },
            onprogress: function (state, progress) {
                if (MIDI.loader)
                    MIDI.loader.setValue(progress * 100);
            },
            onsuccess: function () {
                player.loadedInstruments[instrument] = true;
                MIDI.programChange(chNo, instrument);
                console.log("completed setupChannel", chNo, inst);
                if (successFn)
                    successFn();
            }
        });
    }


    loadInstrument(instr, successFn) {
        console.log("loadInstrument " + instr);
        this.setupChannel(0, instr, successFn);
    }


    graphicsHandleEventGroup(scene, eventGroup) {
        var t0 = eventGroup[0];
        var events = eventGroup[1];
        for (var k = 0; k < events.length; k++) {
            var event = events[k];
            if (event.type != "note")
                continue;
            var note = event;
            var pitch = note.pitch;
            var v = note.v;
            //var dur = note.dur/this.ticksPerBeat;
            var dur = note.dur / this.ticksPerSec;
            //var t = t0/this.ticksPerBeat;
            var t = t0 / this.ticksPerSec;
            //console.log(t0+" graphic for note pitch: "+pitch+" v:"+v+" dur: "+dur);
            scene.addNote(t, dur, pitch);
        }
    }

    addNoteGraphics(scene, midiTrack) {
        scene.clearNotes();

        console.log("Adding note graphics...");
        var events = midiTrack.seq;
        for (var i = 0; i < events.length; i++) {
            this.graphicsHandleEventGroup(scene, events[i]);
        }
    }

    update() {
        if (this.isPlaying && this.USE_NEW_METHOD)
            this.checkForEvent();
        //var clockTime = Date.now() / 1000;
        var pt = this.getPlayTime();
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
        this.setupChannel(ch, val, () => {
            console.log("completed instrumentChanged", id, tchName, ch, val);
            this.trackChannels[tchName].instrument = val;
            this.dump();
        });
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
        /*
        console.log("setupMidiControlDiv");
        if ($("#midiControl").length == 0) {
            console.log("*** no midiControlDiv found ****");
            return;
        }
        var str = `
        <button onclick="_MIDI_PLAYER.toggleTracks()">&nbsp;</button>
        <button onclick="_MIDI_PLAYER.rewind()">|&#60; </button>
        <button id="midiTogglePlaying" onclick="_MIDI_PLAYER.togglePlaying()" style="width:60px;">Play</button>
        &nbsp;&nbsp;<select id="midiCompositionSelection"></select>
        &nbsp;&nbsp;Time: <input type="text" id="midiTime" size="5"></input>
        &nbsp;&nbsp;BPM: <input type="text" id="midiBPM" size="4"></input>
        &nbsp;&nbsp;TPS: <input type="text" id="midiTPS" size="4"></input>
        &nbsp;&nbsp;TPB: <input type="text" id="midiTPB" size="4"></input>
        <div id="midiTrackInfo">
        No Tracks Loaded<br>
        </div>`;

        var str = `
        <button onclick="_MIDI_PLAYER.toggleTracks()">&nbsp;</button>
        <button onclick="_MIDI_PLAYER.rewind()">|&#60; </button>
        <button id="midiTogglePlaying" onclick="_MIDI_PLAYER.togglePlaying()" xstyle="width:60px;">Play</button>
        &nbsp;&nbsp;Time: <input type="text" id="midiTime" size="5"></input>
        &nbsp;&nbsp;BPM: <input type="text" id="midiBPM" size="4"></input>
        <div id="midiTrackInfo">
        No Tracks Loaded<br>
        </div>`;

        $("#midiControl").html(str);
        */
       
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

    loadCompositions(url) {
        console.log("LoadCompositions " + url);
        var inst = this;
        $.getJSON(url, function (obj) { inst.compositionsLoaded(obj) });
    }

    compositionsLoaded(obj) {
        console.log("compositionsLoaded");
        console.log("comps: " + obj);
        this.compositions = obj;
        this.showCompositions();
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
        //console.log("trackChannels: "+JSON.stringify(this.trackChannels));
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
                var instObj = MIDI.GM.byId[i];
                //var instName = (i+1)+" "+instObj.name;
                var instName = i + " " + instObj.name;
                //sel.append($('<option>', { value: i+1, text: instName}));
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

    noteObserver(channel, pitch, vel, t, dur) {
        //console.log("play note", channel, pitch, vel, dur, t);
    }

    noteOn(channel, pitch, v, t) {
        MIDI.noteOn(channel, pitch, v, t);
    }

    noteOff(channel, pitch, v, t) {
        MIDI.noteOff(channel, pitch, v, t);
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

window.MidiPlayTool = MidiPlayTool_WMB;
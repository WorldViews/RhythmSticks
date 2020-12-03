
"use strict"


// There is also a class called MidiPlayTool that the
// subclasses of MidiBox use.   The methods in here could
// probably be replaced by methods in MidiPlayTool, and this
// class could be eliminated.
class MPlayer {
    constructor(opts) {
        opts = opts || {};
        console.log("**** MPlayer ****", opts);
        var instrument = opts.instrument || "taiko_drum";
        this.numNotesPlayed = 0;
        this.buffers = {};
        this.context = null;
        this.tStart = getClockTime();
        this.midiBox = opts.midiBox;
        MIDI.loader = new sketch.ui.Timer;
        //this.loadInstrument("harpsichord");
        this.loadInstrument(instrument);
        /*
                this.AudioContext = window.AudioContext || window.webkitAudioContext;
                if (this.AudioContext) {
                    this.context = new this.AudioContext();
                }
        */
    }

    playNote(instName) {
        instName = instName || "taiko";
        console.log("MidiPlayer.playNote", instName);
        var i = 21 + this.numNotesPlayed % 20;
        if (instName == "cowbell") {
            i = 50;
        }
        MIDI.noteOn(0, i, 100);
        MIDI.noteOff(0, i, .1);
        this.numNotesPlayed += 1;
    }

    playMidiNote(i) {
        console.log("MidiPlayer.playMidiNote", i);
        MIDI.noteOn(0, i, 100);
        MIDI.noteOff(0, i, .1);
        this.numNotesPlayed += 1;
    }

    loadInstrument(instr, successFn) {
        var instrument = instr;
        MIDI.loadPlugin({
            soundfontUrl: "soundfont/",
            instrument: instrument,
            onprogress: function (state, progress) {
                MIDI.loader.setValue(progress * 100);
            },
            onprogress: function (state, progress) {
                MIDI.loader.setValue(progress * 100);
            },
            onsuccess: function () {
                MIDI.programChange(0, instr);
                if (successFn)
                    successFn();
            }
        });
    }
}

//
// This is a class for accessing midi devices via web API.
// We use it to receive midi messages from MIDI controllers
// like drumsticks or keyboards
//
// based on example at https://codepen.io/Koenie/pen/qBEQJyK
//
var MMSG = null;

class MTool {
    constructor(midiBox) {
        this.midiBox = midiBox;
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
        MMSG = message;
        var data = message.data;
        var midiId = data[0];
        var dsId = data[1];
        var vel = data[2];
        console.log("data: ", midiId, dsId, vel);
        var sound = "taiko";
        if (dsId == 42 || dsId == 51)
            sound = "cowbell";
        this.midiBox.onMidiMessage(midiId, dsId, vel, sound);
    }
}

// This is a base class for canvas based GUI objects for using MIDI.
// By default it draws as a rectangle, but a midi box for a given
// instrument or application can override the draw method.
class MidiBox extends CanvasTool.RectGraphic {
    constructor(opts) {
        super(opts);
        this.name = opts.name;
        this.gtool = gtool;
        this.font = "100px Arial";
        this.textStyle = "white";
        this.textAlign = "center";
        opts.width = opts.width || 70;
        opts.height = opts.height || 100;
        opts.fillStyle = null;
        opts.midiTool = this;
        this.targetURL = opts.targetURL;
        this.x0 = opts.x0 || 0;
        this.y0 = opts.y0 || 0;
        this.spacing = opts.spacing || 100;
        this.ncols = opts.ncols || 5;
        this.mplayer = new MPlayer(opts);
        this.midiTool = new MTool(this);
        this.addItems();
    }

    onClick() {
        console.log("MidiBox.onClick");
        this.mplayer.playNote();
    }

    // should override
    async init() {
    }

    onMidiMessage(midiId, dsId, vel, sound) {
        console.log("MidiBox.onMidiMessage", dsId, vel, sound);
        if (vel != 64)
            this.mplayer.playMidiNote(dsId);
    }

    addItems() {
    }
}

window.MidiBox = MidiBox;
//# sourceURL=js/MidiBox.js


"use strict"

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
        this.targetURL = opts.targetURL;
        this.x0 = opts.x0 || 0;
        this.y0 = opts.y0 || 0;
        this.spacing = opts.spacing || 100;
        this.ncols = opts.ncols || 5;

        this.player = new MidiPlayTool();
        var player = this.player;
        player.midiPrefix = opts.midiPrefix || "midi/";
        //player.scene = this;

        player.setupTrackInfo();
        player.loadInstrument("acoustic_grand_piano");
        player.startUpdates();
        player.noteObserver = (ch, pitch, v, dur, t) => this.observeNote(ch,pitch, v, dur, t);

        // for easier debugging in console
        window.MIDI_BOX = this;
        window.MPLAYER = this.player;

        var instrument = opts.instrument || "taiko_drum";
        //this.loadInstrument(instrument);
        this.initMIDIDevices();
        this.addItems();
    }

    // subclasses should override
    async init() {
    }

    addItems() {
    }

    onClick() {
        console.log("MidiBox.onClick");
        this.playMidiNote(30);
    }

    playMidiNote(i) {
        console.log("MidiPlayer.playMidiNote", i);
        this.player.noteOn(0, i, 100, 0);
        this.player.noteOff(0, i, 100, 0.1);
        //MIDI.noteOn(0, i, 100);
        //MIDI.noteOff(0, i, .1);
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

//window.MidiBox = MidiBox;
//# sourceURL=js/MidiBox.js

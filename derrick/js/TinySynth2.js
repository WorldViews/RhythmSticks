
"use strict";

var MUTE_SYNTH = false;
var USE_DEVICE = true;
var MIDI_ACCESS = null;
var curMidi = 0;
var midiPort = [];
var midiOutPort = [];
var outPort = null;
var currentPort = -1;


class TinySynth {
    constructor() {
        this.synth = null;
        this.initMidiDevice();
    }

    playInSynth(val) {
        MUTE_SYNTH = !val;
    }

    playInDevice(val) {
        USE_DEVICE = val;
    }

    initMidiDevice() {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(
                function (access) {
                    MIDI_ACCESS = access;
                    midiOutPort = [];
                    console.log("MIDI ready.");
                    setTimeout(function () {
                        var it = access.inputs.values();
                        for (var i = it.next(); !i.done; i = it.next()) {
                            //var e = document.createElement("option");
                            //e.innerHTML = i.value.name;
                            //document.getElementById("midiport").appendChild(e);
                            midiPort.push(i.value);
                        }
                        //if (midiPort.length > 0)
                        //    SelectMidi(0);
                        var ot = access.outputs.values();
                        console.log("ot", ot);
                        for (var o = ot.next(); !o.done; o = ot.next()) {
                            console.log("MidiOut ", o);
                            midiOutPort.push(o);
                        }
                        if (midiOutPort.length > 0) {
                            console.log("Midi Out");
                            outPort = midiOutPort[0].value;
                            console.log("outPort", outPort);
                            if (outPort) {
                                var devName = outPort.name;
                                document.getElementById("midiDevName").innerHTML = devName;
                            }
                        }
                    }, 10);
                },
                function () {
                    console.log("MIDI is not available.");
                }
            );
        }
    }

    loadMidiUrl() {
        var url = "midi/sakura.mid";
        this.synth.loadMIDIUrl(url);
        document.getElementById("midiPath").innerHTML = url;
    }

    loadMidi(files) {
        var reader = new FileReader();
        this.FILES = files;
        reader.onload = (e) => {
            this.synth.loadMIDI(reader.result);
        }
        var file = files[0];
        reader.readAsArrayBuffer(file);
        document.getElementById("midiPath").innerHTML = file.name;
    }

    playMidi() {
        this.synth.playMIDI();
    }

    stopMidi() {
        this.synth.stopMIDI();
    }

    msend(msg) {
        if (!MUTE_SYNTH)
            this.synth.send(msg);
        if (USE_DEVICE)
            this.SendMsg(msg);
    }

    send(msg) {
        this.synth.send(msg);
    }

    SendMsg(msg) {
        try {
            this.SendMsg_(msg);
        }
        catch (e) {
            console.log("Error playing", msg);
        }
    }

    SendMsg_(msg) {
        console.log("SendMsg", msg);
        if (outPort == null) {
            console.log("No out port");
            return;
        }
        let com = msg[0];
        let note = msg[1];
        let velocity = msg[2];
        if (velocity == null)
            velocity = 10;
        var cmd = [com, note, velocity];
        console.log("cmd", cmd);
        outPort.send([com, note, velocity])
    }
    //SendMsg_(msg);

    SetProgram(p) {
        console.log("SetProgram", p);
        this.synth.send([0xc0, p]);
    }

    Init() {
        var inst = this;
        window.SendMsg = msg => inst.SendMsg(msg);

        this.synth = new WebAudioTinySynth({ voices: 64 });
        for (var i = 0; i < 128; ++i) {
            var o = document.createElement("option");
            o.innerHTML = this.synth.getTimbreName(0, i);
            document.getElementById("prog").appendChild(o);
        }
        //this.SetProgram(116);
        setInterval(function () {
            var st = inst.synth.getPlayStatus();
            document.getElementById("status").innerHTML = "Play:" + st.play + "  Pos:" + st.curTick + "/" + st.maxTick;
        }, 100);
    }

    Test() {
        var o = this.synth.getAudioContext().createOscillator();
        o.connect(this.synth.getAudioContext().destination);
        o.start(0);
        o.stop(this.synth.getAudioContext().currentTime + 1);
        console.log(this)
    }
}


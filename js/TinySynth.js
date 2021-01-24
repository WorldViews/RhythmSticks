
class TinySynth {
    constructor() {
        this.synth = null;
    }

    loadMidiUrl() {
        this.synth.loadMIDIUrl('ws.mid');
    }

    loadMidi(files) {
        var reader = new FileReader();
        reader.onload = (e) => {
            this.synth.loadMIDI(reader.result);
        }
        reader.readAsArrayBuffer(files[0]);
    }

    playMidi() {
        this.synth.playMIDI();
    }

    stopMidi() {
        this.synth.stopMIDI();
    }

    send(msg) {
        this.synth.send(msg);
    }

    SetProgram(p) {
        console.log("SetProgram", p);
        this.synth.send([0xc0, p]);
    }

    Init() {
        var inst = this;
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


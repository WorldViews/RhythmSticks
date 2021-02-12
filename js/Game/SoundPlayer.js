
// This plays notes from a specified instrument.
// It has no notion of timing.  It simply plays when
// playNote is called.
class SoundPlayer {
    constructor(app) {
        this.app = app;
    }
};

class SamplesPlayer extends SoundPlayer {
    constructor(app) {
        super(app);
        console.log("SoundPlayer constructor", app);
        this.soundPrefix = 'sounds/';
        this.buffers = {};
        this.context = null;
        this.AudioContext = window.AudioContext || window.webkitAudioContext;
        if (this.AudioContext) {
            this.context = new this.AudioContext();
        }
    }

    soundURL(instName) {
        this.ext = ".wav";
        if (instName == "taiko" || instName == "cowbell")
            this.ext = ".ogg";
        return this.soundPrefix + instName + this.ext;
    }

    playNote(instName, v) {
        instName = instName || "taiko";
        //this.app.beep("c4", "16n");
        //this.playSound(soundPrefix + instName + ".wav");
        this.playSound(this.soundURL(instName), v);
    }

    async loadBuffers(names) {
        console.log("SoundPlayer.loadBuffers", names);
        for (var i = 0; i < names.length; i++) {
            var url = this.soundURL(names[i]);
            try {
                await this.getBuffer(url);
            }
            catch (err) {
                alert("Cannot load audio " + url);
            }
        }
    }

    async getBuffer(url) {
        //console.log("getBuffer", url);
        var inst = this;
        return new Promise((res, rej) => {
            if (inst.buffers[url]) {
                //console.log("getBuffer using cached buffer");
                res(inst.buffers[url]);
                return;
            }
            console.log("getBuffer fetching", url);
            var req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.responseType = 'arraybuffer';
            req.onload = function () {
                inst.context.decodeAudioData(req.response,
                    function (buffer) {
                        inst.buffers[url] = buffer;
                        res(buffer);
                    },
                    function (err) {
                        console.log("Error loading " + url, err);
                        rej(err);
                    }
                );
            };
            req.send();
        })
    }

    async playSound(url, v) {
        //console.log("playSound", url, v);
        //console.log("playSound "+url);
        if (!this.AudioContext) {
            new Audio(url).play();
            return;
        }
        var buffer = await this.getBuffer(url);
        this.playBuffer(buffer, v);
    }

    playBuffer0(buffer) {
        var source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.context.destination);
        source.start();
    };

    playBuffer(buffer, v) {
        var source = this.context.createBufferSource();
        source.buffer = buffer;
        if (v == null) {
            source.connect(this.context.destination);
        }
        else {
            var gain = this.context.createGain();
            gain.gain.value = v;
            source.connect(gain);
            gain.connect(this.context.destination);
        }
        source.start();
    }
}


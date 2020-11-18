
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
        console.log("**** SoundPlayer ****", app);
        this.soundPrefix = 'sounds/';
        this.numNotesPlayed = 0;
        this.buffers = {};
        this.context = null;
        this.tStart = getClockTime();
        this.AudioContext = window.AudioContext || window.webkitAudioContext;
        if (this.AudioContext) {
            this.context = new this.AudioContext();
        }
    }

    playNote(instName) {
        instName = instName || "taiko";
        //this.app.beep("c4", "16n");
        //this.playSound(soundPrefix + instName + ".wav");
        this.ext = ".wav";
        if (instName == "taiko"  || instName == "cowbell")
            this.ext = ".ogg";
        this.playSound(this.soundPrefix + instName + this.ext);
    }

    playSound(url) {
        var inst = this;
        //console.log("playSound "+url);
        if (!this.AudioContext) {
            new Audio(url).play();
            return;
        }
        if (typeof (inst.buffers[url]) == 'undefined') {
            console.log("getting", url);
            inst.buffers[url] = null;
            var req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.responseType = 'arraybuffer';

            req.onload = function () {
                inst.context.decodeAudioData(req.response,
                    function (buffer) {
                        inst.buffers[url] = buffer;
                        playBuffer(buffer);
                    },
                    function (err) {
                        console.log("Error loading "+url, err);
                    }
                );
            };
            req.send();
        }
        function playBuffer(buffer) {
            var source = inst.context.createBufferSource();
            source.buffer = buffer;
            source.connect(inst.context.destination);
            source.start();
        };
        if (inst.buffers[url]) {
            playBuffer(inst.buffers[url]);
        }
    }
}

class BeatsPlayer {
    constructor(opts) {
        opts = opts || {};
        //this.soundPlayer = opts.soundPlayer || new SoundPlayer();
        this.soundPlayer = opts.soundPlayer || new SamplesPlayer();
        this.rvPlayer = null;
        this.app = opts.app;
        this.dynObjDB = null;
        var recsURL;
        if (this.app) {
            this.rvPlayer = app.player;
            recsURL = "/recordings/"+this.rvPlayer.recordingId+"/beats.json";
        }
        else {
            recsURL = "testBeats.json";
        }
        this.loadBeats(recsURL);
        var inst = this;
        // This is a very crude way of keeping things
        // synched between this player and the mail player.
        // Instead this should regiser as a controller or
        // something like that that gets called every frame
        this.rhythmTool = opts.rhythmTool;
        setInterval(() => inst.tick(), 50);
        this.tStart = getClockTime();
    }

    tick() {
        //console.log("RhtyhmPlayer.tick");
        if (!this.dynObjDB) {
            console.log("no dynObjDB");
            return;
        }
        var t;
        if (this.rvPlayer)
            t = this.rvPlayer.getPlayTime();
        else if (this.rhythmTool) {
            t = this.rhythmTool.getPlayTime();
        }
        else {
            t = getClockTime() - this.tStart;
        }
        this.setPlayTime(t);
    }

    setPlayTime(t)
    {
        //console.log("RythmPlayer t", t);
        this.dynObjDB.setPlayTime(t);
    }

    handleLabelMessage(msg) {
        console.log("label ", msg);
        $("#label").html(msg.label);
        this.numNotesPlayed++;
        var instName = "taiko";
        //if (this.numNotesPlayed % 3 == 0)
        //    instName = "cowbell";
        if (msg.label == "R") {
            console.log("R .. cowbell");
            instName = "cowbell";
        }
        this.soundPlayer.playNote(instName);
        if (msg.label == "finit!") {
            this.finishTrial();
        }
    }

    async loadBeats(recsURL) {
        console.log("RhythmPlayer.loadBeats "+recsURL);
        var inst = this;
        this.dynObjDB = new DynamicObjectDB("labels", inst.handleLabelMessage.bind(this));
        //this.dynObjDB.onEnd = (dynObj) => inst.noticeReachedEndLabels();
        try {
            await this.dynObjDB.load(recsURL);
            this.dynObjDB.dump();
            if (this.rhythmTool) {
                this.rhythmTool.loadFromDynObjDB(this.dynObjDB);
                //this.updateRhythmTool();
            }
        }
        catch (err) {
            console.log("Cannot get "+recsURL);
            console.log("err: ", err);
        }
    }

}


/*
Originally based on https://github.com/omgmog/beatmaker
although there is little remaining resemblance.
*/

'use strict';

/*
var SOUNDS = [
    'bass_drum.wav',
    'snare_drum.wav',
    'low_tom.wav',
    'mid_tom.wav',
    'hi_tom.wav',
    'rim_shot.wav',
    'hand_clap.wav',
    'cowbell.wav',
    'cymbal.wav',
    'o_hi_hat.wav',
    'cl_hi_hat.wav',
    'low_conga.wav',
    'mid_conga.wav',
    'hi_conga.wav',
    'claves.wav',
    'maracas.wav'
];

*/

var SOUNDS = [
    'count',
    'nihongo',
    'low_conga',
    'mid_conga',
    'hi_conga',
    'claves',
    'cowbell',
    'taiko'
];

/*
this.addSong("songs/triplets.json", "triplets");
this.addSong("songs/cowbells24.json", "cowbells24");
this.addSong("songs/cowbells33.json", "cowbells33");
this.addSong("songs/taikoEx1.json", "tex1", "Taiko Exercise 1");
this.addSong("songs/taikoEx2.json", "tex2", "Taiko Exercise 2");
this.addSong("songs/taikoEx3.json", "tex3", "Taiko Exercise 3");
this.addSong("songs/taikoEx4.json", "tex4", "Taiko Exercise 4");
*/
var SONGS = [
    {id: "triplets"},
    {id: "cowbells24"},
    {id: "taikoEx1"}
];

var buffers = {};
if (AudioContext) {
    var context = new AudioContext();
}

function getParameterByName(name, defaultVal) {
    //console.log("getParameterByName", name, defaultVal);
    if (typeof window === 'undefined') {
        console.log("***** getParameterByName called outside of browser...");
        return defaultVal;
    }
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    var val = match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    //console.log("val:", val);
    if (!val)
        return defaultVal;
    return val;
}

function downloadFromBrowser(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function getClockTime() {
    return new Date().getTime() / 1000.0;
}

// This is a version for uploading to a specified path that may
// not be a session.  (i.e. global configs, etc.)
function uploadToFile(dpath, obj, fileName) {
    return uploadDataToFile(dpath, JSON.stringify(obj, null, 3), fileName);
}

function warn(str) {
    //alert(str);
    console.log("Error: ", str);
}

function uploadDataToFile(dpath, data, fileName) {
    console.log("uploadDataToFile path " + dpath + "  fileName " + fileName);
    var formData = new FormData();
    formData.append('dir', dpath);
    let blob = new Blob([data], { type: 'application/json' });
    //  formData.append('data', blob, 'data.json');
    formData.append(fileName, blob, fileName);
    var request = new XMLHttpRequest();
    request.onload = function () {
        if (this.status == 200) {
            var r = JSON.parse(this.response);
            console.log(r);
            if (r.error) {
                warn('Error uploading: ' + r.error);
           }
        }
    };
    request.onerror = function (err) { warn('error uploading' + err) };
    request.upload.addEventListener("progress", function (evt) {
        if (evt.lengthComputable) {
            var pc = Math.floor((evt.loaded / evt.total) * 100);
            console.log(pc, '% uploaded');
        }
    }, false);
    request.open("POST", "/api/uploadfile");
    request.send(formData);
}

// This is a promise based version of code for getting
// JSON.
async function loadJSON(url) {
    console.log("loadJSON: " + url);
    return new Promise((res, rej) => {
        $.ajax({
            url: url,
            dataType: 'text',
            success: function (str) {
                var data;
                try {
                    data = JSON.parse(str);
                }
                catch (err) {
                    console.log("err: " + err);
                    alert("Error in json for: " + url + "\n" + err);
                    rej(err);
                }
                res(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("Failed to get JSON for " + url);
                rej(errorThrown);
            }
        });
    })
}

class RhythmGUI {
    constructor(tool) {
        this.tool = tool;
    }

    init() {
        this.setupGUI();
    }

    noticeState(r, c, v) {
    }

    setupGUI() {
        var tool = this.tool;
        $('#save').click(() => tool.saveRhythm());
        $('#random').click(() => tool.setRandomBeat());
        $('#clear').click(() => tool.clearBeat());
        //$('#beat').click(() => tool.hitBeat());
        $('#beat').mousedown(() => tool.hitBeat());
        this.setupDATGUI();
    }

    setupDATGUI() {
        var inst = this;
        var P = this.tool;
        var gui = new dat.GUI();
        this.tool.datgui = gui;
        if (this.tool.opts.allowMutations) {
            gui.add(P, 'pRandOn', 0, 1);
            gui.add(P, 'pMutate', 0, 1);
            gui.add(P, 'pAdd', 0, 1);
            gui.add(P, 'pRemove', 0, 1);
        }
        gui.add(P, "BPM", 0, 160).onChange((bpm) => inst.tool.updateBPM(bpm));
        //gui.add(P, "playing").onChange((v) => inst.tool.setPlaying(v));;
        gui.add(P, "scroll").onChange((v) => inst.scroll = v);
        gui.add(P, "tick");
        gui.close();
    }
}

// This is like the original HTML Buttom based version
// from https://github.com/omgmog/beatmaker
class ButtonGUI extends RhythmGUI {
    constructor(tool) {
        super(tool);
    }

    setupGUI() {
        super.setupGUI();
        this.beats = {};
        var inst = this;
        var tool = this.tool;
        var div = $("#beatsDiv");
        for (let r = 0; r < tool.numTracks; r++) {
            var beatDiv = div.append("<div class='beats'></div>");
            var soundname = tool.tracks[r].sound.split('.')[0];
            var id = soundname;
            beatDiv.append(sprintf("<input id='%s' type='button' value=' ' style='width:30px;height:30px;margin:4px'></input>", id));
            beatDiv.append(sprintf("%s", soundname));
            beatDiv.append("<br>");
            $("#" + id).click(e => tool.hitBeat(r));
            for (let c = 0; c < tool.TICKS; c++) {
                let id = sprintf("b_%s_%s", r, c);
                let beat = $(sprintf("<input type='button' class='beatsbutton' id='%s' value=''></input>", id));
                beatDiv.append(beat);
                beat.click((e) => tool.clickedOn(r, c));
                this.beats[(r, c)] = beat;
            }
            beatDiv.append("<p>");
        }
    }

    noticeState(r, c, v) {
        var bt = this.tool.getBeat(r, c);
        bt.css('background-color', v ? 'blue' : 'white');
    }

}


class RhythmTool {
    constructor(opts) {
        opts = opts || {};
        this.opts = opts;
        this.scorer = null;
        this.songs = {};
        this.states = {};
        this.muted = {};
        this.numTracks = 0;
        this.playing = false;
        this.scroll = false;
        this.BPM = 80;
        //this.TICKS = 16;
        this.beatsPerMeasure = 4;
        this.numMeasures = 4;
        this.TICKS = this.beatsPerMeasure * this.numMeasures;
        this.pRandOn = .3;
        this.pMutate = 0.001;
        this.pAdd = .02;
        this.pRemove = 0.02;
        this.t = 0;
        this.currentTick = 0;
        this.beatNum = 0;
        this.lastTick = this.TICKS - 1;
        this.tickTime = 1 / (4 * this.BPM / (60 * 1000));
        var guiClass = opts.guiClass || ButtonGUI;
        //console.log("class", guiClass);
        this.gui = new guiClass(this);
        this.initFromSounds(opts.sounds);
        this.gui.init();
        this.initJQ();
        //this.gui = new RhythmGUI(this);
        this.setRandomBeat();
        this.scorer = new Scorer(this);
        this.instrumentTool = null;
        var soundPlayerClass = opts.soundPlayerClass || SamplesPlayer;
        this.soundPlayer = new soundPlayerClass();
        var songs = opts.songs || SONGS;
        this.addSongs(songs);
    }

    initJQ() {
        console.log("initJQ");
        var inst = this;
        $("#playButton").click(e => {
            inst.setPlaying(!inst.playing);
        });
        $("#download").click(e => {
            // Start file download.
            inst.downloadSong(this.getRhythmSpec());
        });

        $("#songSelect").change(e => {
            let id = $("#songSelect").val();
            console.log("id", id);
            //console.log("text", $("#songSelect").text());
            inst.loadSong(id);
        });
        this.showButtonState();
    }

    initFromSounds(sounds) {
        sounds = sounds || SOUNDS;
        this.numTracks = sounds.length;
        this.tracks = [];
        for (var i = 0; i < this.numTracks; i++) {
            var name = sounds[i];
            var sound = name;
            if (name.indexOf('.') >= 0)
                name = name.split('.')[0];
            this.tracks[i] = { name, sound };
        }
    }

    start() {
        var inst = this;
        this.requestInterval();
    }

    setMuted(r, val) {
        console.log("setMuted", r, val);
        this.muted[r] = val;
    }

    playNote(instName) {
        console.log("playNote", instName);
        this.soundPlayer.playNote(instName);
    }

    requestInterval() {
        var inst = this;
        this.lastClockTime = getClockTime();
        this.iPrevBeatNum = -1;
        var handle = {};

        function loop() {
            if (inst.playing) {
                inst.updateBPM(inst.BPM);
            }
            handle.value = requestAnimationFrame(loop);
        }
        handle.value = requestAnimationFrame(loop);
        return handle;
    }

    setBeatNum(beatNum) {
        beatNum = beatNum % this.TICKS;
        this.beatNum = beatNum;
        $("#beatNum").html(sprintf("%.2f", this.beatNum));
        //console.log("beatNum", inst.beatNum);
        this.gui.noticeTime(beatNum);
        var iBeatNum = Math.floor(beatNum);
        this.lastTick = this.currentTick;
        this.currentTick = iBeatNum;
        if (iBeatNum != this.iPrevBeatNum) {
            this.handleBeat();
            this.iPrevBeatNum = iBeatNum;
        }
    }

    getBeatNum() {
        return this.beatNum;
    }

    getPlayTime() {
        return 60*this.beatNum/this.BPM;
    }

    handleBeat() {
        //this.gui.noticeTime(this.t);
        this.gui.activateBeat(this.currentTick);
        var notesPlayed = [];
        for (let i = 0; i < this.numTracks; i++) {
            this.setBeatBorder(i, this.lastTick, 'grey');
            this.setBeatBorder(i, this.currentTick, 'red');
            if (this.muted[i])
                continue;
            var v = this.getState(i, this.currentTick);
            if (v) {
                //console.log("tick play ", i, this.currentTick);
                this.playNote(this.tracks[i].sound);
                notesPlayed.push(i);
            }
            if (this.instrumentTool)
                this.instrumentTool.noticeState(i, v);
        }
        if (notesPlayed.length > 0 && this.scorer) { 
            this.scorer.observePlayedNote({t: this.lastClockTime, tracks: notesPlayed});
        }
        this.mutate();
    }

    setPlaying(v) {
        console.log("setPlaying", v);
        this.playing = v;
        if (this.playing) {
            this.lastClockTime = getClockTime();
            if (this.scorer)
                this.scorer.reset();
            this.updateBPM(this.BPM);
        }
        this.showButtonState();
    }

    showButtonState() {
        var v = this.playing;
        console.log("showButtonState", v);
        $("#playButton").html(v ? "Pause" : "Play");
    }

    // This is the main function that gets called every new frame
    // it should be renamed
    updateBPM(bpm) {
        //console.log(">bpm ", bpm, this);
        var t = getClockTime();
        //console.log(">bpm ", bpm, t);
        var delta = t - this.lastClockTime;
        this.lastClockTime = t;
        var beatDelay = 1 / (4 * bpm / 60.0);
        var beatNum = this.beatNum + delta / beatDelay;
        this.setBeatNum(beatNum);
        if (this.scorer)
            this.scorer.update();
    }

    // This could be called from a gui button (in DATGUI)
    // to advance one beat
    tick() {
        this.setBeatNum(this.beatNum + 1);
        console.log("tick...");
    }

    getBeat(r, c) {
        let id = sprintf("#b_%s_%s", r, c); ''
        return $(id);
    }

    setBeatBorder(r, c, color) {
        //console.log("setBeatBG", r, c);
        this.getBeat(r, c).css('border-color', color);
    }

    clear() {
        this.tracks = [];
        this.numTracks = 0;
        this.states = {};
    }

    clearBeat() {
        for (var r = 0; r < this.numTracks; r++) {
            for (var c = 0; c < this.TICKS; c++) {
                this.setState(r, c, false);
            }
        }
    }

    setRandomBeat() {
        this.clearBeat();
        for (var r = 0; r < this.numTracks; r++) {
            for (var c = 0; c < this.TICKS; c++) {
                if (Math.random() < this.pRandOn) {
                    this.setState(r, c, true);
                }
            }
        }
    }

    getState(r, c) {
        return this.states[r + "_" + c];
    }

    setState(r, c, v) {
        //console.log("setState", r, c, v);
        this.states[r + "_" + c] = v;
        this.gui.noticeState(r, c, v);
        //var bt = this.getBeat(r,c);
        //bt.css('background-color', v ? 'blue' : 'white');
    }

    toggleState(r, c) {
        //console.log("toggleState", r,c);
        this.setState(r, c, !this.getState(r, c));
    }

    mutate() {
        if (Math.random() > this.pMutate) {
            return;
        }
        //console.log("mutate");
        for (var r = 0; r < this.numTracks; r++) {
            for (var c = 0; c < this.TICKS; c++) {
                if (this.getState(r, c)) {
                    if (Math.random() < this.pRemove) {
                        this.setState(r, c, false);
                        console.log("remove r,c", r, c);
                    }
                }
                else {
                    if (Math.random() < this.pAdd) {
                        this.setState(r, c, true);
                        console.log("add r,c", r, c);
                    }
                }
            }
        }
    }

    hitBeat(sound) {
        if (sound == null) {
            var i = this.numTracks - 1;
            sound = this.tracks[i].sound;
        }
        console.log("hitBeat ", sound);
        this.playNote(sound);
        this.gui.noticeUserBeat(this.beatNum);
        if (this.scorer)
            this.scorer.observeUserNote({t: getClockTime(), name: "BUTTON"});
    }

    loadData(id, spec) {
        console.log("loadData", id, spec);
        HALFBEATS = spec.HALFBEATS || false;
        var tracks = spec.tracks;
        this.numMeasures = spec.numMeasures || 4;
        this.beatsPerMeasure = spec.beatsPerMeasure || 4;
        this.TICKS = this.numMeasures * this.beatsPerMeasure;
        this.clear();
        for (var r = 0; r < tracks.length; r++) {
            var track = tracks[r];
            if (!track.sound) {
                //track.sound = track.name + ".wav";
                track.sound = track.name;
            }
            //var soundname = track.sound;
            //var fname = soundname+".wav";
            this.tracks.push(track);
            this.numTracks = this.tracks.length;
            console.log("track", r, track.name);
            var beats = track.beats;
            if (!beats) {
                beats = this.genBeats(this.numMeasures, this.beatsPerMeasure);
            }
            if (typeof beats == "string") {
                beats = this.genBeatsFromStr(beats, this.numMeasures, this.beatsPerMeasure);
            }
            let c = 0;
            for (var i = 0; i < this.numMeasures; i++) {
                var bar = beats[i];
                console.log(" ", i, bar);
                for (var j = 0; j < this.beatsPerMeasure; j++) {
                    this.setState(r, c, bar[j]);
                    c++;
                }
            }
        }
        this.gui.updateSong();
        if (this.instrumentTool)
            this.instrumentTool.updateSong();
        if (this.scorer)
            this.scorer.reset();
    }

    loadFromDynObjDB(dynObjDB) {
        console.log("loadFromDynObjDB", dynObjDB);
        HALFBEATS = false;
        //var tracks = []];
        this.beatsPerMeasure = 4;
        var tMax = dynObjDB.maxTime;
        this.TICKS = Math.ceil(tMax);
        this.numMeasures = Math.ceil(this.TICKS/this.beatsPerMeasure);
        //this.TICKS = this.numMeasures * this.beatsPerMeasure;
        this.clear();
        this.gui.updateSongFromDynObj(dynObjDB);
    }

    async loadSong(id) {
        console.log("loadSong", id);
        var specOrURL = this.songs[id].specOrURL;
        var name = this.songs[id].name;
        $("#songTitle").html(name);
        if (typeof specOrURL == "string") {
            console.log("load song from URL", specOrURL);
            var spec = await loadJSON(specOrURL);
            this.loadData(id, spec);
        }
        else {
            this.loadData(id, specOrURL);
        }
    }

    genBeats(numMeasures, beatsPerMeasure, bvec) {
        var beats = [];
        var k=0;
        for (var i = 0; i < numMeasures; i++) {
            beats[i] = [];
            for (var j = 0; j < beatsPerMeasure; j++) {
                beats[i][j] = bvec ? bvec[k] : 0;
                k++;
            }
        }
        return beats;
    }

    genBeatsFromStr(beats, nMeasures, beatsPerMeasure)
    {
        console.log("getBeatsFromStr:", beats);
        beats = beats.split(/[ ,]+/);
        var bvec = beats.map(b => parseInt(b));
        console.log("bvec", bvec);
        beats = this.genBeats(nMeasures, beatsPerMeasure, bvec);
        console.log("beats", beats);
        return beats;
    }

    getRhythmSpec() {
        console.log("getRhythmSpec");
        var spec = { tracks: [] };
        var inst = this;
        // for each row (sound)
        for (let r = 0; r < this.numTracks; r++) {
            var sound = this.tracks[r].sound;
            // get the soundname, without .wav
            var soundname = sound.split('.')[0];
            // create arrays
            var beatsStr = "";
            for (let c = 0; c < this.TICKS; c++) {
                // if it's on, the value is 1
                if (this.getState(r, c))
                    beatsStr += "1 ";
                else
                    beatsStr += "0 ";
                if (c % 4 == 3)
                    beatsStr += " ";
            }
            beatsStr = beatsStr.trim();
            // update the object
            var track = { name: soundname, beats: beatsStr };
            spec.tracks.push(track);
        }
        return spec;
    }

    getUniqueId(stype) {
        stype = stype || "song";
        var n = Object.keys(this.songs).length + 1;
        var id = stype + n;
        return id;
    }

    saveRhythm() {
        console.log("saveRhythm");
        var spec = this.getRhythmSpec();
        // create an object so we can jsonify it later
        var specStr = JSON.stringify(spec, null, 3)
        console.log("spec:\n" + specStr);
        var id = this.getUniqueId();
        var fileName = id + ".json"
        this.addSong(spec, id);
        uploadToFile("songSpecs", spec, fileName);
        this.downloadSong(spec, fileName);
    }

    downloadSong(spec, fileName) {
        if (!fileName) {
            var id = this.getUniqueId();
            fileName = id + ".json"
        }
        var specStr = JSON.stringify(spec, null, 3)
        downloadFromBrowser(fileName, specStr);
    }

    addSongs(songs) {
        songs.forEach(spec => {
            if (typeof spec == "string") {
                console.log("converting string to spec");
                spec = {id: spec};
            }
            console.log("addSong spec", spec);
            var id = spec.id;
            var name = spec.name || id;
            var url = spec.url || sprintf("songs/%s.json", id);
            this.addSong(url, id, name);
        })
    }

    async addSong(specOrURL, id, name) {
        name = name || id;
        this.songs[id] = { specOrURL, name };
        //this.addSongButton(id);
        this.addSongOption(id, name);
    }

    async addSongOption(id, name) {
        $('#songSelect')
            .append($('<option>', { value: id })
                .text(name).click(async e => {
                }));
    }

    async addSongButton(id) {
        $("#songs").append(sprintf("<button id='%s'>%s</button>", id, id));
        var inst = this;
        $("#" + id).click(async e => {
            console.log("clicked song ", id);
            inst.loadSong(id);
        });
    }

    clickedOn(r, c) {
        console.log(sprintf("clickedOn r: %s c: %s", r, c));
        this.toggleState(r, c);
    }

}

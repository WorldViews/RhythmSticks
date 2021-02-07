/*
This takes a song description text, and produces a JSON Object describing the song
and suitable for our rhythm sequencer.  It is a similar structure to one produced
when we read MIDI files.

*/
"use strict"

const SUN_MOON_STAR_SONG = "SUN_MOON_STAR";
const FRAME_DRUM_SONG = "FRAME_DRUM_SONG";
const TAIKO_SONG = "TAIKO";

function splitStr(str) {
    return str.split(/(\s+)/).filter(function (e) { return e.trim().length > 0; });
}

function stringContains(str, parts) {
    for (var i = 0; i < parts.length; i++)
        if (str.indexOf(parts[i]) >= 0)
            return true;
    return false;
}

const MATSURI_OLD = `
su   su   su   su |

don  su   don  su  don kara ka ka |
don  don  su   don don kara ka ka |
su   don  su   don don kara ka ta |
doko su   kara don don kara ka ta |
doko kara don  don don kara ka ta |
`;

const MATSURI = `
su   su   su   su |

don   -   don   -  don kara ka ka |
don  don  su   don don kara ka ka |
su   don  su   don don kara ka ka |
doro  -   kara don don kara ka ka |
doro kara don  don don kara ka ka |
`;

// This class is for constructiong a midi event sequence
// from a given string representation, such as Kuchi Shoga
//
class SongParser {
    constructor() {
        this.beatDur = 200;
        this.songType = null;
        this.reset();
    }

    reset() {
        this.t = 0;
        this.events = [];
    }

    guessSongType(str) {
        var songType = null;
        if (stringContains(str, ["sun", "moon", "star"]))
            songType = SUN_MOON_STAR_SONG;
        if (stringContains(str, ["doko", "don", "ka"]))
            songType = TAIKO_SONG;
        if (stringContains(str, ["pa", "dum"]))
            songType = FRAME_DRUM_SONG;
        return songType;
    }

    addSong(song, songType) {
        var str = song.trim();
        str = str.toLowerCase();
        this.songType = songType || this.guessSongType(str);
        console.log("adding for kuchi shoga", str);
        var parts = splitStr(str);
        str = parts.join(" ");
        //$("#kuchiShoga").val(str);
        //str = str.replace(/\r?\n|\r/g, " ");
        //str = str.replace(/  /g, " ");
        this.reset();
        this.setInstruments([116, 115]);
        var parts = str.split(/[ ,]+/);
        console.log("parts", parts);
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part == '')
                continue;
            if (part == '|')
                continue;
            //console.log("part", part);
            if (part == "don") {
                this.addNote(1);
                continue;
            }
            if (part == "sun" || part == "moon" || part == "star") {
                this.addNote(1, part);
                continue;
            }
            if (part == "pa" || part == "dum" || part == "ki") {
                this.addNote(1, part);
                continue;
            }
            if (part == "doko" || part == "doro") {
                this.addNote(0.5);
                this.addNote(0.5);
                continue;
            }
            if (part == "ka" || part == "ta") {
                this.addNote(1, "rim");
                continue;
            }
            if (part == "kara" || part == "kata" || part == "kaka") {
                this.addNote(0.5, "rim");
                this.addNote(0.5, "rim");
                continue;
            }
            if (part == "su" || part == "rest" || part == '_' || part == '-') {
                //console.log("su add", this.beatDur);
                this.t += this.beatDur;
                continue;
            }
            alert("bad kuchi shoga part: '" + part + "'");
            return;
        }
        this.addMarkerEvent("end");
    }

    setInstruments(instruments) {
        var event = [this.t, []];
        for (var i = 0; i < instruments.length; i++) {
            event[1].push({
                channel: i,
                instrument: instruments[i],
                type: 'programChange',
                t0: this.t
            })
        }
        this.events.push(event);
    }

    addNote(beats, target, v) {
        target = target || "center";
        if (v == null)
            v = 120;
        var ch = 0;
        var pitch = 60;
        if (target == "rim" || target == "moon") {
            pitch = 62;
            ch = 1;
        }
        if (target == "pa") {
            pitch = 55;
            ch = 0;
        }
        if (target == "ki") {
            pitch = 55;
            ch = 0;
        }
        if (target == "dum") {
            pitch = 63;
            ch = 1;
        }
        if (target == "star") {
            pitch = 63;
            ch = 2;
        }
        if (beats == null)
            beats = 1;
        var event = [
            this.t,
            [
                {
                    "pitch": pitch,
                    "t0": this.t,
                    "v": v,
                    "dur": 30,
                    "type": "note",
                    "channel": ch,
                    "label": target
                }
            ]
        ];
        this.events.push(event);
        this.t += beats * this.beatDur;
    }

    addMarkerEvent(name) {
        var event = [
            this.t,
            [
                {
                    "t0": this.t,
                    "type": "marker",
                    "name": name
                }
            ]
        ];
        this.events.push(event);
    }

    addMetronomeEvents() {
        for (var bt = 0; bt < this.t; bt += this.beatDur) {
            var event = [
                bt,
                [{ 't0': bt, 'type': 'metronome', 'label': 'cowbell' }]
            ];
            console.log(bt, "=====================================================================");
            this.events.push(event);
        }
    }

    getMidiObj() {
        var resolution = this.beatDur;
        var midiObj = {
            format: 0,
            channels: [0, 1, 2],
            instruments: [116, 115, 116],
            resolution, // this is ticksPerBeat
            durationTicks: this.t,
            type: "MidiObj",
            loop: true,
            songType: this.songType,
            tracks: [
                {
                    channels: [0, 1, 2],
                    seq: []
                }
            ]
        };
        this.addMetronomeEvents();
        midiObj.tracks[0].seq = this.events;
        return midiObj;
    }

    dump() {
        var midiObj = this.getMidiObj();
        var jstr = JSON.stringify(midiObj, null, 3);
        console.log("midiObj", jstr);
    }
}



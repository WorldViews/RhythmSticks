
"use strict"

function splitStr(str) {
    return str.split(/(\s+)/).filter(function (e) { return e.trim().length > 0; });
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
class MidiParser {
    constructor() {
        this.beatDur = 200;
        this.reset();
    }

    reset() {
        this.t = 200;
        this.events = [];
    }

    addKuchiShoga(str) {
        console.log("adding for kuchi shoga", str);
        var parts = splitStr(str);
        str = parts.join(" ");
        $("#kuchiShoga").val(str);
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
        if (target == "rim") {
            pitch = 62;
            ch = 1;
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
                    "channel": ch
                }
            ]
        ];
        this.events.push(event);
        this.t += beats * this.beatDur;
    }

    getMidiObj() {
        var midiObj = {
            format: 0,
            channels: [0, 1],
            instruments: [116, 115],
            resolution: 384,
            type: "MidiObj",
            loop: true,
            tracks: [
                {
                    channels: [0, 1],
                    seq: []
                }
            ]
        };
        midiObj.tracks[0].seq = this.events;
        return midiObj;
    }

    dump() {
        var midiObj = this.getMidiObj();
        var jstr = JSON.stringify(midiObj, null, 3);
        console.log("midiObj", jstr);
    }
}



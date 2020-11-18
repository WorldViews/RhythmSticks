
'use strict';

class Scorer {
    constructor(tool) {
        this.tool = tool;
        this.reset();
    }

    reset() {
        this.playedNotes = [];  // notes in the song
        this.userNotes = [];    // notes played by user
        this.missedNotes = 0;
        this.extraneousNotes = 0;
        this.matchedNotes = 0;
    }

    observeUserNote(note) {
        console.log("scorer observer userPlayedNote", note);
        this.userNotes.push(note);
    }

    observePlayedNote(note) {
        this.dumpStats();
        //console.log("scorer observe playedNote", note);
        this.playedNotes.push(note);
    }

    // this is called every frame and tries to match
    // notes played from the score, and user played notes.
    update()
    {
        //this.dump();
        let inst = this;
        var t = getClockTime();
        var MAX_DELAY = 1.0;
        var MAX_TIME_ERROR = 0.5;
        var tMin = t - MAX_DELAY;
        this.prune(this.playedNotes, tMin, note => {
            console.log("** missed note", note);
            inst.missedNotes++
        });
        this.prune(this.userNotes, tMin, note => {
            console.log("** extraneous note", note);
            inst.extraneousNotes++;
        });
        for (var i=0; i<this.playedNotes.length; i++) {
            var playedNote = this.playedNotes[i];
            var userNote = this.findNearestNote(this.userNotes, playedNote.t);
            if (!userNote)
                continue;
            var dt = userNote.t - playedNote.t;
            if (Math.abs(dt) < MAX_TIME_ERROR) {
                console.log("** matched note", userNote, playedNote);
                inst.matchedNotes++;
                this.removeNote(this.playedNotes, playedNote);
                this.removeNote(this.userNotes, userNote);
                break;
            }
        }
    }

    removeNote(notes, note) {
        var i = notes.indexOf(note);
        if (i < 0) {
            console.log("*****ERROR: note not in list");
            return;
        }
        notes.splice(i, 1);
    }

    findNearestNote(notes, t) {
        var nearestNote = null;
        var nearestDeltaT = 1.0E100;
        notes.forEach(note => {
            var dt = Math.abs(note.t - t);
            if (dt < nearestDeltaT) {
                nearestDeltaT = dt;
                nearestNote = note;
            }
        });
        return nearestNote;
    }

    prune(notes, tMin, rmFun) {
        //console.log("prune", label, tMin);
        while (notes.length > 0) {
            var note = notes[0];
            if (note.t > tMin)
                break;
            rmFun(note);
            notes.shift();
        }
    }

    dumpStats() {
        console.log("extra notes:", this.extraneousNotes);
        console.log("missed notes: ", this.missedNotes);
        console.log("matched notes:", this.matchedNotes);
        var str = sprintf("extra: %d missed: %d matched: %d",
            this.extraneousNotes, this.missedNotes, this.matchedNotes);
        $("#scoreStats").html(str);

    }

    dump() {
        if (this.playedNotes.length)
            console.log("playedNotes:");
        this.playedNotes.forEach( note => {
            console.log(JSON.stringify(note));
        });
        if (this.userNotes.length)
            console.log("userPlayedNotes:");
        this.userNotes.forEach(note=> {
            console.log(JSON.stringify(note));
        });
    }
}


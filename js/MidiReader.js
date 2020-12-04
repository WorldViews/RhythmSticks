
"use strict"

// This tries to play a midi file using code from
// https://github.com/Tonejs/Midi
// Note: this is not working yet, because the form of JSON object
// it gets for a midi file is different than the one this player
// is based on.

class MidiReader {
    constructor() {
    }

    getInstrumentNumber(instName) {
        instName = instName.replace(" ", "_");
        instName = instName.replace(" ", "_");
        instName = instName.replace(" ", "_");
        instName = instName.replace(" ", "_");
        if (instName == "standard_kit")
            return 9;
        var inst = MIDI.GM.byName[instName];
        if (!inst) {
            alert("No instrument named " + instName);
            return 0;
        }
        return inst.program;
    }

    async loadMidiFile(url) {
        // load a midi file in the browser
        url = url || "midi/shimauta1.mid";
        const midi = await Midi.fromUrl(url);
        //const midi = await Midi.fromUrl("midi/sakura.mid");
        //the file name decoded from the first track
        const name = midi.name
        //get the tracks
        midi.tracks.forEach(track => {
            //tracks have notes and controlChanges
            //notes are an array
            const notes = track.notes
            notes.forEach(note => {
                //note.midi, note.time, note.duration, note.name
            })
            /*
            //the control changes are an object
            //the keys are the CC number
            track.controlChanges[64]
            //they are also aliased to the CC number's common name (if it has one)
            track.controlChanges.sustain.forEach(cc => {
                // cc.ticks, cc.value, cc.time
            })
            */
            //the track also has a channel and instrument
            //track.instrument.name
        });
        var midiObjV2 = midi;
        console.log("=================================================");
        //console.log(JSON.stringify(midiObjV2, null, 3));
        console.log("midiObjV2:");
        console.log(midiObjV2);
        var midiObj = this.convertMidiObjV2(midiObjV2);
        console.log("midiObj:");
        console.log(midiObj);
        console.log("=================================================");
        return midiObj;
    }

    ticksToTime(ticks) {
        return ticks;
    }

    convertMidiObjV2(midiObjV2) {
        var inst = this;
        var ntracks = [];
        var channels = [];
        var instruments = [];
        midiObjV2.tracks.forEach(track => {
            var ntrack = {};
            ntrack.seq = [];
            var channel = track.channel;
            ntrack.channels = [channel];
            var instrumentName = track.instrument.name;
            var instrument = track.instrument.number;
            //var instrument = inst.getInstrumentNumber(instrumentName);
            instruments.push(instrument);
            channels.push(track.channel);
            track.notes.forEach(note => {
                var t = this.ticksToTime(note.ticks);
                var v = Math.floor(note.velocity * 127);
                var event = [t, [
                    {
                        channel,
                        v,
                        pitch: note.midi,
                        t0: t,
                        dur: note.durationTicks,
                        type: "note",
                    }
                ]];
                ntrack.seq.push(event);
            });
            ntracks.push(ntrack);
        })
        var midiObj = {
            format: 0,
            resolution: 384,
            channels: channels,
            instruments: instruments,
            type: "MidiObj",
            loop: true,
            tracks: ntracks
        };
        return midiObj;
    }
}


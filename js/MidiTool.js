//
// based on example at https://codepen.io/Koenie/pen/qBEQJyK
//
/*
This class is for accessing a midi instrument such as keyboard
connected to the device.
*/
var MMSG = null;

class MidiTool {
    constructor(rhythmTool) {
        this.rhythmTool = rhythmTool;
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
      MMSG = message;
      var data = message.data;
      var midiId = data[0];
      var dsId = data[1];
      var vel = data[2];
      console.log("data: ", midiId, dsId, vel);
      var sound = "taiko";
      if (dsId == 42 || dsId == 51)
        sound = "cowbell";
      if (vel > 0) {
        this.rhythmTool.hitBeat(sound);
      }
    }
}

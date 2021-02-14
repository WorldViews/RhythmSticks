
var DATAFEED_WEBHOOK = "https://io.adafruit.com/api/v2/webhooks/feed/M383TjgC5uNb2Aui56DCSTXPxUAd";

if ("serial" in navigator) {
  console.log("serial available");
}
else {
  console.log("Cannot access serial");
  //alert("Cannot access serial");
}

// sent data value to webhook for adafruit data feed
function sendValue(val) {
  console.log("sendValue", val);
  //$("#status").html(val);
  var url = DATAFEED_WEBHOOK;
  var obj = { 'value': val };
  console.log("post", obj, url);
  $.post(url, obj, val => {
    console.log("receieved", val)
  });
}

function strToByteArray(str) {
  console.log("strToByteArray", str);
  var bytes = []; // char codes
  for (var i = 0; i < str.length; ++i) {
    var code = str.charCodeAt(i);
    bytes = bytes.concat([code]);
  }
  console.log(" bytes:", bytes);
  const data = new Uint8Array(bytes); // hello
  console.log(" data:", data);
  return data;
}

// see https://smartsensordevices.com/%E2%80%8Bplotting-real-time-graph-from-bluetooth-5-0-device-to-google-chrome/
/*
  LineParser

  This class is used to chunk input into complete lines.  It's necessary because when
  strings come over the serial line, they may come in chunks that are incomplete lines.
  This will accumulate the input chunks, and call a hander for each line when it is
  complete.
 */
class LineParser {
  constructor(handler) {
    // A container for holding stream data until a new line.
    this.container = "";
    this.handler = handler;
  }

  transform(chunk) {
    // Handle incoming chunk
    var inst = this;
    this.container += chunk;
    const lines = this.container.split("\r\n");
    this.container = lines.pop();
    lines.forEach((line) => inst.handler.handleLine(line));
  }

  flush() {
    // Flush the stream.
    this.handler.handleLine(this.container);
  }
}

class RhythmStick {
  constructor(opts) {
    opts = opts || {};
    this.port = null;
    this.writer = null;
    this.numMatches = 0;
    this.numMisses = 0;
    this.lineParser = new LineParser(this);
    this.taikoBox = opts.taikoBox;
  }

  async read(port) {
    console.log("starting reader for port");
    const reader = port.readable.getReader();
    const decoder = new TextDecoder("utf-8");
    var inst = this;
    // Listen to data coming from the serial device.
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        // Allow the serial port to be closed later.
        reader.releaseLock();
        inst.lineParser.flush();
        break;
      }
      // bytes is a Uint8Array.
      //console.log("bytes:", value);
      //var uint8array = new TextEncoder("utf-8").encode("¢");
      var str = decoder.decode(value);
      //console.log("received:", str)
      $("#log").append(str);
      inst.lineParser.transform(str);
    }
  }

  async write(str) {
    if (!this.writer) {
      console.log("Cannot write without a writer");
      return;
    }
    var data = strToByteArray(str+"\r");
    await this.writer.write(data);
  }

  handleLine(line) {
    console.log("handleLine", line);
    line = line.trim();
    let parts = line.split(" ");
    if (parts.length < 1) {
      console.log("empty line");
      return;
    }
    let com = parts[0].trim();
    if (com == "mode") {
      console.log("-------------------------------------------------")
      this.numMatches = 0
      this.numMisses = 0
    }
    this.showScore();
    if (com == "strike")
      this.handleStrike(parts);
    if (com == "clear")
      this.handleClear(parts);
    if (com == "color")
      this.handleColor(parts);
    if (com == "match")
      this.handleMatch(parts);
    if (com == "miss")
      this.handleMiss(parts);
    if (com == "tap")
      this.handleTap(parts);
    //console.log(parts)
  }

  handleTap(parts) {
    console.log("tap", parts);
    var taikoBox = window.TAIKO_BOX;
    if (!taikoBox) {
      taikoBox = window.GAME;
      if (taikoBox)
        taikoBox.rhythmStick = this;
    }
    var ay = Number(parts[2])
    console.log("ay", ay);
    if (taikoBox) {
      if (ay > 0)
        taikoBox.strikeDrum("center");
      else
        taikoBox.strikeDrum("rim");
    }
  }

  handleStrike(parts) {
    console.log("handleStrike", parts)
    //$("#tab").css('background', 'red');
  }

  handleClear(parts) {
    //$("#tab").css('background', 'white');
  }

  handleMatch(parts) {
    this.numMatches++;
    console.log("handleMatch", this.numMatches);
    this.showScore();
  }

  handleMiss(parts) {
    this.numMisses++;
    console.log("handleMiss", this.numMisses);
    this.showScore();
  }

  showScore() {
    $("#score").html("" + this.numMatches + " " + this.numMisses);
  }

  handleColor(parts) {
    var r = Number(parts[1]) * 2;
    var g = Number(parts[2]) * 2;
    var b = Number(parts[3]) * 2;
    var color = "rgb(" + r + "," + g + "," + b + ")";
    $("#tab").css('background', color);
  }

  setColor(r,g,b) {
    this.write("color "+r+" "+g+" "+b);
  }

  async setup() {
    // Prompt user to select any serial port.
    console.log("setup");
    let port = await navigator.serial.requestPort();
    this.port = port;
    const info = port.getInfo();
    const { usbProductId, usbVendorId } = info;
    console.log("info", info);
    console.log("usbProductId", usbProductId);
    // Wait for the serial port to open.
    console.log("opening");
    //await port.open({ baudRate: 9600 });
    await port.open({ baudRate: 115200 });
    console.log("opened")
    this.writer = port.writable.getWriter();
    this.read(port);
    this.write("mode SILENT");
  }
}


/*
let stick = null
let stick2 = null;

$(document).ready(() => {
  stick = new RhythmStick();
  stick2 = new RhythmStick();
  $("#start").click(() =>  {
    stick.setup();
  });
  $("#start2").click(() =>  {
      stick2.setup();
  });
});
*/



class GamePad {
    constructor() {
        console.log("GamepatTool()");
        this.controller = null;
        this.buttons = {};
        var inst = this;
        window.addEventListener("gamepadconnected", e => {
            //this.controller = e.gamepad;
            console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
                e.gamepad.index, e.gamepad.id,
                e.gamepad.buttons.length, e.gamepad.axes.length);
            inst.scanGamepads();
        });
        setInterval(() => inst.queryState(), 10);
    }

    onButtonChange(i, val, ts) {
        console.log("********* hit button", i, val, ts);
    }

    queryState() {
        this.scanGamepads();
        var controller = this.controller;
        if (!controller) {
            //console.log("no controller");
            return;
        }
        var ts = controller.timestamp;
        for (var i = 0; i < controller.buttons.length; i++) {
            var val = controller.buttons[i];
            var pressed = val == 1.0;
            if (typeof(val) == "object") {
              pressed = val.pressed;
              val = val.value;
            }
            if (pressed != this.buttons[i]) {
                this.onButtonChange(i, val, ts);
            }
            this.buttons[i] = pressed;
        }
        //console.log("timestamp", ts);
        //console.log("buttons", this.buttons);
    }

    scanGamepads() {
        //console.log("listGamepads");
        var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
        //console.log("gamepads", gamepads);
        for (var i = 0; i < gamepads.length; i++) {
            //console.log("i", i);
            var gp = gamepads[i];
            //console.log("gp", gp);
            if (!gp)
                continue;
            this.controller = gp;
            var str = "Gamepad connected at index " + gp.index + ": " + gp.id +
                ". It has " + gp.buttons.length + " buttons and " + gp.axes.length + " axes.";
            //console.log(str);
            $("#gamepadInfo").html(str);
        }
    }
}

class TaikoGamePad extends GamePad {
    onButtonChange(i, val, ts) {
        console.log("********* hit button", i, val, ts);
        if ((i == 10 || i == 11) && val)
            this.onStrike(i, ts);
        if ((i == 6 || i == 7) && val)
            this.onStrike(i, ts);
    }

    onStrike(i, ts) {
        console.log("**** DOOO ****")
    }

}

class TaikoControl extends TaikoGamePad {
    constructor(rhythmTool) {
        super();
        this.rhythmTool = rhythmTool;
    }

    onStrike(bid, ts) {
        console.log("onStrike", bid);
        var soundName = "taiko";
        if (bid == 6 || bid == 7)
            soundName = "cowbell";
        this.rhythmTool.hitBeat(soundName);
    }
}



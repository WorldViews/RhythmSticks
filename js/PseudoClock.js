
class PseudoClock {
    constructor() {
        console.log("PseudoClock.constructor");
        var inst = this;
        this.t0 = getClockTime();
        this.playSpeed = 0.0;
        this.setPlayTime(0);
        this.lastBeatTime = null;
        this.state = "STOPPED";
        this.timer = setInterval(() => inst.tick(), 50);
    }

    tick() {
        if (!this.lastBeatTime)
            return;
        var t = getClockTime();
        var dt = t - this.lastBeatTime;
        var bpm = 60*1.0/dt;
        if (bpm < 10) {
            this.stop();
        }
    }

    start() {
        if (this.state != "RUNNING")
            console.log("PseudoClock RUNNING");
        this.state = "RUNNING";
        this.playSpeed = 1;
    }

    stop() {
        if (this.state != "STOPPED")
            console.log("PseudoClock STOP");
        this.state = "STOPPED";
        this.playSpeed = 0;
    }

    noticeBeat() {
        var t = getClockTime();
        console.log("PseudoClock.noticeBeat", t);
       if (this.lastBeatTime != null) {
            var dt = t - this.lastBeatTime;
            var bpm = 60*1.0/dt;
            console.log("bpm", bpm);
        }
        this.lastBeatTime = t;
        var state = this.state;
        if (state == "STOPPED") {
            console.log("PseudoClock STARTING");
            this.state = "STARTING";
            return;
        }
        if (state == "STARTING") {
            this.playSpeed = bpm/100.0;
            console.log("PseudoClock RUNNING");
            this.state == "RUNNING";
        }
        this.setBPM(bpm);
     }

     setBPM(bpm) {
         this.prevBPM = bpm;
         this.playSpeed = bpm/100.0;
     }

    setPlayTime(t) {
        this.lastPlayTime = t;
        this.lastClockTime = getClockTime();
    }

    getPlayTime() {
        var t = getClockTime();
        var dt = t - this.lastClockTime;
        var pt = this.lastPlayTime + dt*this.playSpeed;
        this.lastPlayTime = pt;
        this.lastClockTime = t;
        return pt;
    }

    setPlaySpeed(speed) {
        this.playSpeed = speed;
    }

}
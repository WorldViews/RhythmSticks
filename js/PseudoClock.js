
class PseudoClock {
    constructor() {
        this.t0 = getClockTime();
        this.playSpeed = 1;
        this.setPlayTime(0);
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
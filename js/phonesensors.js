

class Sensors {
    constructor() {
        this.is_running = false;
        this.eventCount = 0;
    }

    show(fieldName, value, precision = 10) {
        if (value != null)
            $("#"+fieldName).html(value.toFixed(precision));
    }

    motionHandler(event) {
        this.eventCount++;
        var acc = event.accelerationIncludingGravity;
        var { x, y, z } = acc;
        var mag = x * x + y * y + z * z;
        this.show('Accelerometer_gx', x);
        this.show('Accelerometer_gy', y);
        this.show('Accelerometer_gz', z);
        this.show('mag', mag);
        var taikoBox = window.TAIKO_BOX;
        if (mag > 500) {
            if (taikoBox)
                taikoBox.strikeDrum("center");
            else
                toneOn();
        }
        else {
            if (!taikoBox)
                toneOff();
        }
        this.show('Accelerometer_x', event.acceleration.x);
        this.show('Accelerometer_y', event.acceleration.y);
        this.show('Accelerometer_z', event.acceleration.z);

        this.show('Accelerometer_i', event.interval, 2);

        this.show("num-observed-events", this.eventCount);

    }


    start(e) {
        var inst = this;
        this.handleMotion = e => inst.motionHandler(e);
        // Request permission for iOS 13+ devices
        if (
            DeviceMotionEvent &&
            typeof DeviceMotionEvent.requestPermission === "function"
        ) {
            DeviceMotionEvent.requestPermission();
        }
        var button = $("#button");
        if (this.is_running) {
            window.removeEventListener("devicemotion", this.handleMotion);
            button.html("Start demo");
            demo_button.classList.add('btn-success');
            demo_button.classList.remove('btn-danger');
            this.is_running = false;
        } else {
            window.addEventListener("devicemotion", this.handleMotion);
            button.html("Stop demo");
            this.is_running = true;
        }
    }
}




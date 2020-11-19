
#from adafruit_circuitplayground.express import cpx
import time

# states of motion
STILL = "STILL"
TAP = "TAP"

# modes
PLAY = "PLAY"       # we have some melody or sequence to play
LISTEN = "LISTEN"   # We are just watching for beats

# Note that time.time() only returns an int, not
# a float with fractional seconds, so we must use this
def nstime():
    return time.monotonic_ns()/1000000000.0

class RhythmTool:
    def __init__(self, cpx):
        self.cpx = cpx
        self.cp = cpx
        self.t0 = nstime()
        self.n = 0
        self.state = STILL
        self.mode = "noplay"

    def setMode(self, mode):
        if mode == self.mode:
            return
        print("mode", mode)
        self.mode = mode

    def tick(self):
        self.n += 1
        t = nstime()
        rt = t - self.t0
        mag0 = 300
        if self.cp.button_a:
            self.setMode(PLAY)
        if self.cp.button_b:
            self.setMode(LISTEN)

        x, y, z = self.cpx.acceleration  # read the accelerometer values
        mag = x*x + y*y + z*z
        if mag > mag0:
            print ("strike", self.n, rt, mag, x, y, z)
            #print("t: %.3f   rt: %.3f" % (t, rt))
            self.tap()
            self.setState(TAP)
        else:
            self.reset()
        if self.mode == PLAY:
            f = rt % 1
            if f < .1:
                self.setColor((100,100,100))
            else:
                self.setColor((0,0,0))

    def setColor(self, rgb):
        for i in range(10):
            self.cpx.pixels[i] = (rgb)
  
    def setState(self, state):
        if self.state == state:
            return
        print("state", state)
        self.state = state

    def reset(self):
        self.cpx.stop_tone()
        self.setColor((0,0,0))
        self.setState(STILL)

    def flash(self):
        #print ("flash")
        baseFreq = 100
        self.cpx.start_tone(300)
        self.setColor((100,100,0))

    def beep(self):
        print ("beep")

    def tap(self):
        self.flash()

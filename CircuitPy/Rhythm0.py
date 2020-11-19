
#from adafruit_circuitplayground.express import cpx
import time

class RhythmTool:
    def __init__(self, cpx):
        self.cpx = cpx
        self.t0 = time.time()
        self.n = 0
        self.state = "still"

    def tick(self):
        self.n += 1
        t = time.time()
        rt = t - self.t0
        mag0 = 300
        x, y, z = self.cpx.acceleration  # read the accelerometer values
        mag = x*x + y*y + z*z
        if mag > mag0:
            print ("strike", self.n, rt, mag, x, y, z)
            self.tap()
            self.state = "active"
        else:
            self.reset()
        
    def reset(self):
        self.cpx.stop_tone()
        for i in range(10):
            self.cpx.pixels[i] = ((0, 0, 0))
        if self.state == "active":
            print("clear")
        self.state = "still"

    def flash(self):
        #print ("flash")
        baseFreq = 100
        self.cpx.start_tone(baseFreq)
        RGB = (100,100,100)
 
        for i in range(10):
            self.cpx.pixels[i] = (RGB)

    def beep(self):
        print ("beep")

    def tap(self):
        self.flash()

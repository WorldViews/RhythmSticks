 
import time
import Rhythm

from adafruit_circuitplayground.express import cpx
#from adafruit_circuitplayground import cp


stick = Rhythm.RhythmTool(cpx)
 
t0 = time.time()

# Main loop gets x, y and z axis acceleration, prints the values, and turns on
# lights if the UFO is upside down, plays tones
i = 0
while True:
    stick.tick()
    #print("a", cp.button_a)
    #("b", cp.button_b)

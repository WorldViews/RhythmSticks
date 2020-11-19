 
import time
 
from adafruit_circuitplayground.express import cpx
 
t0 = time.time()

# Main loop gets x, y and z axis acceleration, prints the values, and turns on
# lights if the UFO is upside down, plays tones
i = 0
while True:
    i += 1
    t = time.time()
    rt = t - t0
    mag0 = 100
    x, y, z = cpx.acceleration  # read the accelerometer values
    mag = x*x + y*y + z*z
    if mag > mag0:
       print (i, rt, mag, x, y, z)
 

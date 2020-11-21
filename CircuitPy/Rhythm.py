
import time
import supervisor
from Song import Song
# states of motion
STILL = "STILL"
TAP = "TAP"

# modes
PLAY = "PLAY"       # we have some melody or sequence to play
LISTEN = "LISTEN"   # We are just watching for beats
SILENT = "SILENT"

# Note that time.time() only returns an int, not
# a float with fractional seconds, so we must use this
def nstime():
    return time.monotonic_ns()/1000000000.0

QDUR = .25

SONGS = [
    Song("C D E F G A B C5"),

    Song("""
don  su   don  su  don kara ka ka |
don  don  su   don don kara ka ka |
su   don  su   don don kara ka ta |
doko su   kara don don kara ka ta |
doko kara don  don don kara ka ta"""),

    Song("C D E/2 F/2 G A B C5"),

    Song([
            {'t': 0,   'dur': QDUR, 'f': 400},
            {'t': 1,   'dur': QDUR, 'f': 400},
            {'t': 2,   'dur': QDUR, 'f': 800},
            {'t': 2.5, 'dur': QDUR, 'f': 800},
            {'t': 3,   'dur': QDUR, 'f': 600}
        ]), 

    Song([
            {'t': 0,   'dur': QDUR, 'f': 200},
            {'t': 1,   'dur': QDUR, 'f': 300},
            {'t': 2,   'dur': QDUR, 'f': 800},
            {'t': 2.5, 'dur': QDUR, 'f': 800},
            {'t': 3,   'dur': QDUR, 'f': 600},
            {'t': 3.5, 'dur': QDUR, 'f': 500}
        ])
]

class RhythmTool:
    def __init__(self, cpx):
        self.cp = cpx
        self.songs = SONGS
        self.songNum = 0
        self.song = self.songs[0]
        self.t0 = nstime()
        self.prevTime = self.t0
        self.playTime = 0
        self.speed = 2.0
        self.n = 0
        self.state = STILL
        self.mode = LISTEN
        self.toneVal = None
        self.color = None
        self.a_val = None
        self.b_val = None
        self.note = None
        self.noteMatched = False

    def tick(self):
        self.n += 1
        t = nstime()
        dt = t - self.prevTime
        self.prevTime = t
        self.playTime += self.speed * dt
        mag0 = 450

        if supervisor.runtime.serial_bytes_available:
            print("getting input..")
            str = input().strip()
            self.handleInput(str)

        # check button a
        a_val = self.cp.button_a
        if a_val != self.a_val:
            if a_val:
                self.setMode(PLAY)
        self.a_val = a_val

        # check button b
        b_val = self.cp.button_b
        if b_val != self.b_val:
            if b_val:
                mode = self.mode
                if mode == PLAY:
                    self.setMode(LISTEN)
                elif mode == LISTEN:
                    self.setMode(SILENT)
                elif mode == SILENT:
                    self.setMode(PLAY)
        self.b_val = b_val

        x, y, z = self.cp.acceleration  # read the accelerometer values
        mag = x*x + y*y + z*z
        if mag > mag0:
            #print ("strike", self.n, rt, mag, x, y, z)
            #print("t: %.3f   rt: %.3f" % (t, rt))
            self.setState(TAP)
        else:
            self.setState(STILL)
        if self.mode == PLAY:
            self.playTime, note = self.song.update(self.playTime)
            #noteOn = (self.playTime % 1) < 0.2
            if note:
                self.note = note
                color = (100,100,100)
                if self.state == TAP:
                    if not self.noteMatched:
                        print("match")
                    self.noteMatched = True
                if self.noteMatched:
                    self.setColor((0,100,0))
                else:
                    self.setColor(color)
                #self.setTone(600)
                self.setTone(note['f'])
            else:
                if self.note and not self.noteMatched:
                    print("miss")
                self.note = None
                self.noteMatched = None
                self.setColor((0,0,0))
                self.setTone(None)

    def handleInput(self, str):
        print("got input", str)
        parts = str.split()
        print("parts", parts)
        if len(parts) < 2:
            print("not enough parts.  parts:", parts)
            return
        if parts[0] == "mode":
            self.setMode(parts[1])

    def setMode(self, mode):
        #if mode == self.mode:
        #    return
        print("setMode", mode)
        self.mode = mode
        if mode == PLAY:
            self.songNum += 1
            self.playTime = 0
            self.song = self.songs[self.songNum % len(self.songs)]

    def setColor(self, rgb):
        if self.color == rgb:
            return
        self.color = rgb
        #print("color", rgb[0], rgb[1], rgb[2], "xxx")
        print("color", rgb[0], rgb[1], rgb[2])
        for i in range(10):
            self.cp.pixels[i] = (rgb)
  
    def setState(self, state):
        if self.state == state:
            return
        print("state", state)
        self.state = state
        if state == TAP:
            self.tap()
        if state == STILL:
            self.reset()

    def setTone(self, val):
        if val == self.toneVal:
            return
        self.toneVal = val
        if val:
            self.cp.start_tone(val)
        else:
            self.cp.stop_tone()

    def reset(self):
        print("reset")
        self.setState(STILL)
        if self.mode == LISTEN or self.mode == SILENT:
            self.setColor((0,0,0))
            self.setTone(None)
    
    def tap(self):
        print("tap")
        if self.mode == LISTEN:
            self.setTone(600)
        if self.mode == LISTEN or self.mode == SILENT:
            self.setColor((100,100,0))

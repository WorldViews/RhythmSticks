
from math import pow
import re

note2steps = {
    'C': 0,
    'D': 2,
    'E': 4,
    'F': 5,
    'G': 7,
    'A': 9,
    'B': 11
}

"""
note2num_oct4 = {
    'C4': 60,
    'D4': 62,
    'E4': 64,
    'F4': 65,
    'G4': 67,
    'A4': 69,
    'B4': 71,
    'C5': 72
}
"""

def note2num(noteName):
    note = noteName[0]
    octave = int(noteName[1])
    num = (octave + 1)*12 + note2steps[note]
    return num


def num2freq(n):
    return pow(2, (n-69)/12.0) * 440

class Song:
    def __init__(self, notes):
        self.notes = notes
        self.tMax = 4
        if type(notes) == type("str"):
            self.setNotes(notes)
   
    def setNotes(self, str):
        str = re.sub(r"  ",   " ", str)
        str = re.sub(r"kara", "ka ra", str)
        str = re.sub(r"kata", "ka ra", str)
        str = re.sub(r"doko", "do ko", str)
        nreps = str.split()
        t = 0
        ddur = 1.0
        donNote = "D4"
        kaNote = "E5"
        notes = []
        for nrep in nreps:
            print(nrep)
            if nrep == "|":
                continue
            if nrep.find("*") > 0:
                parts = nrep.split("*")
                note = parts[0]
                f = float(parts[1])
                dur = ddur*f
            elif nrep.find("/") > 0:
                parts = nrep.split("/")
                note = parts[0]
                f = float(parts[1])
                dur = ddur/f
            else:
                note = nrep
                dur = ddur
            #
            # handle kuchi shoga cases
            #
            if note == "don":
                note = donNote
            if note == "do" or note == "ko":
                note = donNote
                dur /= 2
            if note == "ka" or note == "ta" or note == "ra":
                note = kaNote
                dur /= 2
            
            #
            # process the note (or rest)
            #
            if note == "-" or note == "su" or note == "suh":
                t += dur
                continue
            if len(note) == 1:
                note = note+"4"
            note = note.upper()
            num = note2num(note)
            f = num2freq(num)
            fn = 0.8
            obj = {'t': t, 'dur': dur*fn, 'f': f, 'mnote': note, 'rep': nrep}
            notes.append(obj)
            t += dur
        self.tMax = t
        self.notes = notes
        print(notes)

    def update(self, pt):
        t = pt % self.tMax
        note = None
        for nt in self.notes:
            if t >= nt['t'] and t < nt['t'] + nt['dur']:
                note = nt
                break
        return t, note

    def dump(self):
        i = 0
        for note in self.notes:
            i += 1
            print("%3d %6.1f %4.2f %7.1f %3s %6s" %\
                (i, note['t'], note['dur'], note['f'], note['mnote'], note['rep']))

if __name__ == "__main__":
    QDIR = 0.25
    s = Song("a b c d a*2 b*2 a/2 a/2")
    s.dump()
    print(60*"-")
    s = Song("don don don ka ta ka ta | do  do su do do ka ta ka ta")
    s.dump()
    print(60*"-")

    s = Song('''
    su   su   su   su |

 don  su   don  su  don kara ka ka |
 don  don  su   don don kara ka ka |
 su   don  su   don don kara ka ta |
 doko su   kara don don kara ka ta |
 doko kara don  don don kara ka ta |
 ''')
    s.dump()
    print(60*"-")

    s = Song("""
don  su   don  su  don kara ka ka |
 don  don  su   don don kara ka ka |
 su   don  su   don don kara ka ta |
 doko su   kara don don kara ka ta |
 doko kara don  don don kara ka ta""")
    s.dump()





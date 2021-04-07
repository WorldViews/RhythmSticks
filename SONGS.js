
const FF1 = `
    don don  don  don  ka doko doko doko
    ka  doko doko doko ka doko doko doko
    don don  don  don  ka doko doko doko
    ka  doko doko doko ka doko doko doko
    `;

const FF2 = `
    ka doko kara doko ka   doko kara doko
    ka doko kara doko kara doko kara doko
    ka doko kara doko ka   doko kara doko
    ka doko kara doko kara doko kara doko
    `;

const SHIKO = `moon - moon - | sun - sun - | moon - moon - | sun sun - - |
sun - star star | sun - star star | sun - star star | moon moon - -`;

const FANGA1 = `sun rest sun sun | rest sun moon moon | sun rest rest sun | sun rest moon moon`;

const DJEMBE3 = `sun moon moon | sun moon moon | moon moon star | moon - -`;

const FRAME_EX1 = `dum - ki - ta - ki -    dum ki ta ki`;

const PARADIDDLE1 = `pa dum pa pa | dum pa dum dum`;

const FOUR_MEASURES_4 = `- - - - | - - - - | - - - - | - - - - |`;

const EIGHT_MEASURES_2 = `- - | - - | - - | - - | - - | - - | - - | - - |`;

var SONGS = [
    {
        'name': '8 measures of 2/4',
        'song': EIGHT_MEASURES_2,
        'timeSignature': [2, 4],
        'metronome': 1
    },
    {
        'name': '4 measures of 4/4',
        'song': FOUR_MEASURES_4,
        'timeSignature': [4, 4],
        'metronome': 1
    },
    {
        'name': 'Fast & Furious 1',
        'song': FF1,
        'infoLabel': 'South Bay Beat Institute',
        'infoURL': 'https://www.southbaybeatinstitute.com/'
    },
    {
        'name': 'Fast & Furious 2',
        'song': FF2,
        'infoLabel': 'South Bay Beat Institute',
        'infoURL': 'https://www.southbaybeatinstitute.com/'
    },
    {
        'name': 'Fanga',
        'song': FANGA1,
        'infoLabel': 'Sun Moon Stars',
        'infoURL': 'https://www.jamtown.com/products/j0181d'
    },
    {
        'name': 'Shiko',
        'song': SHIKO,
        'infoLabel': 'Reach and Teach',
        'infoURL': 'https://shop.reachandteach.com/'
    },
    {
        'name': 'Djembe 3 Beat',
        'song': DJEMBE3,
    },
    {
        'name': 'Frame Drum Exercise 1',
        'song': FRAME_EX1,
        'infoLabel': 'Fern Ferndale',
        'infoURL': 'https://www.facebook.com/fernsplace'
    },
    {
        'name': 'Frame Drum Paradiddle',
        'song': PARADIDDLE1
    },
    {
        'name': 'Matsuri',
        'song': MATSURI
    },
    {
        'name': 'Sakura',
        'midi': 'midi/sakura.mid'
    },
    {
        'name': 'Well Tempered Clavier',
        'midi': 'midi/Bach/wtc0.mid'
    },
    {
        'name': 'Amazing Grace',
        'midi': 'midi/amazing_grace.mid'
    },
    {
        'name': 'Amazing Grace Piano',
        //'midi': 'midi/amazing_grace_piano.mid',
        'midi': 'midi/amazing_grace_BPNO.mid'
    },
    {
        'name': 'Row Your Boat (simple)',
        'midi': 'midi/row_your_boat_0.mid'
    },
    {
        'name': 'Row Your Boat (chords)',
        'midi': 'midi/row_your_boat_1.mid'
    },
    {
        'name': 'Row Your Boat (round)',
        'midi': 'midi/row_your_boat_round.mid'
    },
    {
        'name': 'Tinsagu No Hana',
        'bpm': 60,
        'midi': 'midi/Tinsagu_No_Hana.mid'

    },
    //{
    //    'name': 'Shima Uta',
    //    'midi': 'midi/shimauta1.mid'
    //},
    {
        'name': 'Frere Jacques',
        'midi': 'midi/frere-jacques-round.mid',
        'infoLabel': 'Free Midi',
        'infoURL': 'https://beatlabacademy.com/free-midi/'
    }
];


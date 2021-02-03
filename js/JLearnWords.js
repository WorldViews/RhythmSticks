
"use strict";


var PHRASE_LIST = {
    "id1": {
        "kanji": "野菜",
        "kana": "ベジタブル",
        "romanji": "yasai",
        "english": "vegetable"
    },
    "id2": {
        "kanji": "果物",
        "kana": "フルーツ",
        "romanji": "Furūtsu",
        "english": "fruit"
    },
    "id3": {
        "kanji": "私",
        "kana": "あたし",
        "romanji": "watashi",
        "english": "I"
    }
};

class WordListTable {
    constructor(tool) {
        this.tool = tool;
        this.vowels = tool.vowels;
        this.groups = tool.groups;
        this.init();
    }

    // create a phrase table
    init() {
        var inst = this;
        var tool = inst.tool;
        var tab = $("#phraseList");
        var phrases = PHRASE_LIST;
        for (var id in phrases) {
            var phrase = phrases[id];
            var kanji = phrase.kanji;
            var kana = phrase.kana;
            var rom = phrase.romanji;
            var eng = phrase.english;
            var tr = $("<tr>");
            //
            /*
            var td = $("<td>");
            var tid = "pt_id_" + id;
            td.attr("id", tid);
            td.css('border-width', 0);
            td.html(id);
            tr.append(td);
            */
            //
            var td = $("<td>");
            var kid = "pt__kanji" + id;
            td.attr("id", kid);
            td.css('border-width', 0);
            td.html(kanji);
            tr.append(td);
            //
            var td = $("<td>");
            var rid = "pt_romanji" + id;
            td.attr("id", rid);
            td.css('border-width', 0);
            td.html(rom);
            tr.append(td);
            //
            var td = $("<td>");
            var pid = "pt_kana" + id;
            td.attr("id", pid);
            td.css('border-width', 0);
            td.html(kana);
            tr.append(td);
            //
            var td = $("<td>");
            var eid = "pt_english" + id;
            td.attr("id", eid);
            td.css('border-width', 0);
            td.html(eng);
            tr.append(td);
            //
            tab.append(tr);
        }
        //$("td").click(e => inst.clickCell(e, $(this)));
        //$("td").mouseover(e => inst.mouseOver(e, $(this)));
        this.update();
    }

    update() {
    }

    clickCell(e, item) {
        window.E = e;
        window.ITEM = item;
        console.log("click... this", e, item);
        // i must not have used $(this) correction.
        var item = $(e.target);
        console.log("item", item);
        window.IT = item;
        var id = item.attr("id");
        var rom = id.slice(3);
        this.tool.select(rom, !this.tool.selected[rom]);
    }

    mouseOver(e, item) {
        var item = $(e.target);
        var id = item.attr("id");
        if (!id)
            return;
        var kid = id.slice(3);
        var t = getClockTime();
        var counts = this.tool.counters.data[kid];
        var hir = this.tool.kidToHiragana[kid];
        var kat = this.tool.kidToKatakana[kid];
        var r = counts.numRight;
        var w = counts.numWrong;
        var dt = t - counts.lastTime;
        console.log(kid, hir, kat, counts, r, w);
        var statStr = sprintf("%s %s %s %d/%d", kid, hir, kat, r, (r + w));
        if (r + w > 0)
            statStr += sprintf(" %0.3f", r / (r + w))
        if (dt > 0)
            statStr += sprintf(" %.1f sec", dt);
        $("#scoreStats").html(statStr);
    }
}

/*
This is tool to help learn kana, which are the Japanese syllabic sounds.
They can be represented as katakana, hiragana, or romanji.
The katakana and hiragana match up one to one, but it is a little more
subtle for the romanji, because a few different sounds map to the same
romanji.

For convenience to english speaker, we use a set of strongs we call kana ids,
or kids, which are in correspondence with katakana and hiragana.   Each kid
consist of a consonant sound and a vowel sound.  So the full set of kids can
be produced from a list of consanants (called groups here) and vowels.   There
is one exception, which is 'n', that has no vowel.

Given a kid, we can map it to a hiragana, a katakana or a romanji.   All scores
and table cells, etc, are indexed by kids.

The names of the kids are mostly the same as the romanji, except that
the kid du maps to romanji zu
and kids di and zi map to romanji ji.

*/
class WordPracticeTool {
    constructor() {
        //this.init();
    }

    async init() {
        var inst = this;
        inst.charType = "Hiragana";
        inst.hiragana = [];
        inst.katakana = [];
        inst.kids = [];
        inst.kidToHiragana = {};
        inst.hiraganaToKid = {};
        inst.kidToKatakana = {};
        inst.kataKanaToKid = {};
        inst.selected = {};
        inst.counters = null;
        var parts = HK_CHARS.trim().split(RE_WHITESPACE);
        //var tweaks = { "tu": "tsu", "si": "shi", "ti": "chi", "hu": "fu", "di": "ji" , "zi": "ji"};
        var tweaks = { "tu": "tsu", "si": "shi", "ti": "chi", "hu": "fu" };
        this.labtweaks = { "di": "ji", "zi": "ji", "du": "zu" };
        this.tweaks = tweaks;
        this.vowels = ["a", "i", "u", "e", "o"];
        //var groups = ["", "k", "s", "t", "n", "h", "y", "r", "w", "g", "d", "b", "p"];
        var cols = ["", "k", "s", "t", "n", "h", "m", "y", "r", "w", "g", "d", "b", "p", "z"];
        this.groups = cols;
        var rows = this.vowels;
        var ncols = cols.length;
        var nrows = rows.length;
        for (var i = 0; i < nrows; i++) {
            var v = rows[i];
            for (var j = 0; j < ncols; j++) {
                var c = cols[j];
                var rom = c + v;
                if (tweaks[rom]) {
                    rom = tweaks[rom];
                }
                var part = parts[(i + 1) * (ncols + 1) + (j + 1)];
                if (part.length < 2)
                    continue;
                var hir = part[0];
                var kat = part[1];
                console.log(i, j, rom, hir, kat);
                this.kids.push(rom);
                this.hiragana.push(hir);
                this.katakana.push(kat);
                this.kidToHiragana[rom] = hir;
                this.hiraganaToKid[hir] = rom;
                this.kidToKatakana[rom] = kat;
                this.kataKanaToKid[kat] = rom;
            }
        }
        // n is a special case
        this.kids.push('n');
        this.kidToHiragana['n'] = H_N;
        this.kidToKatakana['n'] = K_N;
        this.kataKanaToKid[K_N] = 'n';
        this.hiraganaToKid[H_N] = 'n';
        $("#userInput").change(e => inst.noticeChange());
        $("#userInput").on('input', e => inst.noticeInput(e));
        //this.table = new Table(this);
        //this.initTable();

        this.wordList = new WordListTable(this);

        $("#selectAll").click(e => inst.selectAll(true));
        $("#selectNone").click(e => inst.selectAll(null));
        $("#start").click(e => inst.startTrials());

        $("#save").click(e => inst.download());
        $("#load").click(e => inst.load());
        $("#reset").click(e => inst.resetScores());
        this.initDB();
        this.hcounters = new Counters("hiraganaCounters", this.kids, this.db);
        this.kcounters = new Counters("katakanaCounters", this.kids, this.db);
        this.bothCounters = new Counters("bothCounters", this.kids, this.db);
        await this.hcounters.init();
        await this.kcounters.init();
        await this.bothCounters.init();
        this.counters = this.hcounters;
        this.updateTable();
        this.idx = 0;
    }

    updateTable() {
    }

    dumpDB() {
        console.log("dumpDB");
        this.db.allDocs({ include_docs: true, descending: true }, (err, doc) => {
            console.log(doc.rows);
        });
    }

    addRecDB(id, obj) {
        var row = { _id: id, vals: obj };
        this.db.put(row, (err, result) => {
            if (!err) {
                console.log("Posted row", row);
            }
        })
    }

    async initDB() {
        var db = new PouchDB('jlearn');
        this.db = db;
        this.addRecDB('user', { name: 'Don', size: 'big' });
        this.dumpDB();
    }

    toggleCharType() {
        var ctype = $("#charType").html();
        if (ctype == "Hiragana") {
            ctype = "Katakana";
            this.counters = this.kcounters;
        }
        else if (ctype == "Katakana") {
            ctype = "Both";
            this.counters = this.bothCounters;
        }
        else {
            ctype = "Hiragana";
            this.counters = this.hcounters;
        }
        $("#charType").html(ctype);
        this.charType = ctype;
        this.updateTable();
    }

    getRom(kid) {
        if (this.labtweaks[kid])
            return this.labtweaks[kid];
        return kid;
    }

    getCharStr(kid, ctype) {
        var str = this.kidToHiragana[kid];
        if (ctype == "Katakana")
            str = this.kidToKatakana[kid];
        else if (ctype == "Both")
            str = this.kidToHiragana[kid] + " " + this.kidToKatakana[kid];
        return str;
    }

    selectAll(val) {
        var inst = this;
        this.kids.forEach(kid => inst.select(kid, val));
    }

    select(rom, val) {
        console.log("select", rom);
        var selStyle = "#FFEEEE";
        if (val)
            this.selected[rom] = true;
        else
            delete this.selected[rom];
        var selCss = { 'border-color': 'red', 'border-width': '3px' };
        var defCss = { 'border-color': 'black', 'border-width': '3px' };
        //$("#td_" + rom).css("background-color", val ? selStyle : "white");
        $("#td_" + rom).css(val ? selCss : defCss);
    }

    startTrials() {
        this.reset();
        this.nextTrial();
    }

    reset() {
        this.idx = 0;
        this.numTrials = 0;
        this.numTries = 0;
        this.numCorrect = 0;
        this.numErrors = 0;
        this.trials = [];
        //this.counters.reset();
        this.showStats("");
    }

    noticeInput(e) {
        //console.log("input", e);
        var v = $("#userInput").val();
        if (v == " " || v == "")
            this.noticeChange();
        window.E = e;
    }

    noticeChange() {
        console.log("noticeChange");
        var v = $("#userInput").val().toLowerCase();
        $("#userInput").val("");
        if (v != "")
            this.numTries++;
        this.currentTrial.tries.push(v);
        var label = "good";
        var kid = this.currentTrial.kid;
        var rom = this.currentTrial.rom;
        if (v == rom) {
            this.numCorrect++;
            this.counters.noticeRight(kid);
        }
        else if (v != "") {
            this.numErrors++;
            label = "ooops";
            this.counters.noticeWrong(kid);
        }
        if (v == " ") {
            $("#r1").html(rom)
        }
        this.showStats(label);
        if (label == "good" && v != "")
            this.nextTrial();
        this.updateTable();
    }


    showStats(label) {
        $("#stats").html(label + " " + this.numCorrect + " / " + this.numTries);
    }

    // Get probabilities for selecting a given rom
    getProbs(kids) {
        console.log("getProbs");
        var f = [];
        var sum = 0;
        for (var i = 0; i < kids.length; i++) {
            var kid = kids[i];
            //f[i] = 1;
            f[i] = - Math.log(this.counters.probRight(kid));
            f[i] = Math.pow(f[i], 3);
            if (this.currentTrial && this.currentTrial.kid == kid)
                f[i] = 0;
            sum += f[i];
        }
        for (var i = 0; i < f.length; i++) {
            f[i] /= sum;
        }
        for (var i = 0; i < kids.length; i++) {
            console.log(i, kids[i], f[i]);
        }
        return f;
    }

    // Select an index from the vector, with probabilities
    // proportional to prob in vector
    selectRandIndex(pv) {
        //console.log("selectRandIndex", pv);
        var p = Math.random();
        var s = 0;
        for (var i = 0; i < pv.length; i++) {
            var f = pv[i];
            if (p < s + f)
                return i;
            s += f;
        }
        return pv.length - 1;
    }

    chooseRomanji() {
        var kids = Object.keys(this.selected);
        // romanjis should be cids
        if (kids.length == 0)
            kids = this.kids;
        var CYCLE = false;
        if (CYCLE) {
            this.idx = this.idx % kids.length;
            var rom = kids[this.idx];
            this.idx++;
        }
        else {
            var pv = this.getProbs(kids);
            console.log("kids", kids, pv);
            var i = this.selectRandIndex(pv);
            var rom = kids[i];
        }
        return rom;
    }

    nextTrial() {
        var kid = this.chooseRomanji();
        var rom = this.getRom(kid);
        var hir = this.kidToHiragana[kid];
        var kat = this.kidToKatakana[kid];
        var trial = { kid, rom, hir, kat, tries: [] };
        console.log("update", this.idx, kid, rom, hir, kat);
        this.currentTrial = trial;
        this.trials.push(trial);
        var str = this.getCharStr(kid, this.charType);
        //document.getElementById("h1").innerHTML = h;
        $("#h1").html(str);
        $("#r1").html("");
        //document.getElementById("r1").innerHTML = this.currentRomanji;
    }

    async run() {
        console.log("run...");
        await this.init();
        this.reset();
        var inst = this;
        this.nextTrial();
        //setInterval(() => inst.update(), 2000);
    }

    dump() {
        var inst = this;
        for (var i = 0; i < this.trials.length; i++) {
            var trial = this.trials[i];
            console.log("trial", i, trial.rom, trial.tries);
        }
        this.counters.dump();
    }

    // This downloads the scores
    download(text, filename) {
        filename = "scores.json";
        var data = this.hcounters.data;
        var obj = {
            'hcounters': this.hcounters.data,
            'kcounters': this.kcounters.data
        };
        var text = JSON.stringify(obj, null, 3);
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    async load(url) {
        url = url || "scores.json";
        var obj = await loadJSON(url);
        console.log("scores", obj);
        this.hcounters.data = obj.hcounters;
        this.kcounters.data = obj.kcounters;
        await this.hcounters.save();
        await this.kcounters.save();
        this.updateTable();
    }

    async resetScores() {
        console.log("reset scores");
        this.hcounters.reset();
        await this.hcounters.save();
        this.kcounters.reset();
        await this.kcounters.save();
        this.bothCounters.reset();
        await this.bothCounters.save();
        this.updateTable();
    }
}


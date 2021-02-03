
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
        var phrases = this.tool.phrases;
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

*/
class WordPracticeTool {
    constructor() {
        this.phrases = PHRASE_LIST;
        //this.init();
    }

    async init() {
        var inst = this;
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
        this.updateTable();
        this.idx = 0;
    }

    updateTable() {
    }

    selectAll(val) {
        var inst = this;
        this.kids.forEach(kid => inst.select(kid, val));
    }

    select(cid, val) {
        console.log("select", cid);
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
        var str = $("#userInput").val().toLowerCase();
        $("#userInput").val("");
        if (str != "")
            this.numTries++;
        this.currentTrial.tries.push(str);
        var label = "";
        var eng = this.currentPhrase.english.toLowerCase();
        console.log(str, eng);
        if (str == eng) {
            label = "good";
            this.numCorrect++;
        }
        this.showStats(label);
        if (label == "good" && str != "")
            this.nextTrial();
        this.updateTable();
    }


    showStats(label) {
        $("#stats").html(label + " " + this.numCorrect + " / " + this.numTries);
    }

    // Get probabilities for selecting a given rom
    getProbs(kids) {
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

    choosePhrase() {
        var ids = Object.keys(this.phrases);
        var n = ids.length;
        var r = Math.random();
        var i = Math.floor(r*n);
        console.log("choosePhrase", r, i, n);
        return this.phrases[ids[i]];
    }

    nextTrial() {
        console.log("nextTrial");
        var phrase = this.choosePhrase();
        var trial = {};
        trial.phrase = phrase;
        trial.tries = [];
        this.trials.push(trial);
        this.currentTrial = trial;
        this.currentPhrase = phrase;
        //document.getElementById("h1").innerHTML = h;
        $("#kanji").html(phrase.kanji);
        $("#kana").html(phrase.kana);
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


    async resetScores() {
        console.log("reset scores");
        this.updateTable();
    }
}


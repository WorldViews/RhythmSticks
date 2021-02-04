
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
    },
    "id4": {
        "kanji": "日本語",
        "kana": "にほんご",
        "romanji": "nihongo",
        "english": "japanese"
    }
};

class WordListTable {
    constructor(tool) {
        this.tool = tool;
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
            tr.attr("id", "tr_" + id);
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
        console.log("PhraseListTable.update")
        var phrases = this.tool.phrases;
        var tool = this.tool;
        if (!tool.counters) {
            console.log("*** no counters...");
            return;
        }
        var i = 1;
        for (var id in phrases) {
            var trid = "tr_" + id;
            //var p = i++;
            //var n = 5;
            var p = tool.counters.probRight(id);
            var n = tool.counters.weight(id);
            console.log("tr", id, p, n);
            var h = 200 * p;
            var s = 100 * (n / (n + 1));
            var l = 80;
            var c = 'hsl(' + h + "," + s + "%," + l + "%)";
            var tr = $("#" + trid);
            tr.css('background-color', c);
        }
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
        this.pids = Object.keys(this.phrases);
        this.selected = [];
        //this.init();
    }

    async init() {
        var inst = this;
        $("#userInput").change(e => inst.noticeChange());
        $("#userInput").on('input', e => inst.noticeInput(e));
        //this.table = new Table(this);
        //this.initTable();
        this.initDB();
        this.counters = new Counters("kanji", this.pids, this.db);
        await this.counters.init();

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
        this.wordList.update();
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
        var pid = this.currentPid;
        var eng = this.currentPhrase.english.toLowerCase();
        console.log(pid, str, eng);
        if (str == eng) {
            label = "good";
            this.numCorrect++;
            this.counters.noticeRight(pid);
        }
        else if (str != "") {
            this.counters.noticeWrong(pid);
            label = "ooops";
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
    getProbs(ids) {
        console.log("getProbs");
        var f = [];
        var sum = 0;
        for (var i = 0; i < ids.length; i++) {
            var id = ids[i];
            //f[i] = 1;
            f[i] = - Math.log(this.counters.probRight(id));
            f[i] = Math.pow(f[i], 3);
            if (this.currentTrial && this.currentTrial.id == id)
                f[i] = 0;
            sum += f[i];
        }
        for (var i = 0; i < f.length; i++) {
            f[i] /= sum;
        }
        for (var i = 0; i < ids.length; i++) {
            console.log(i, ids[i], f[i]);
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

    choosePhrase() {
        var ids = Object.keys(this.selected);
        // romanjis should be cids
        if (ids.length == 0)
            ids = Object.keys(this.phrases);
        var CYCLE = false;
        var id;
        if (CYCLE) {
            this.idx = this.idx % kids.length;
            id = ids[this.idx];
            this.idx++;
        }
        else {
            var pv = this.getProbs(ids);
            console.log("pids", ids, pv);
            var i = this.selectRandIndex(pv);
            id = ids[i];
        }
        return id;
    }

    nextTrial() {
        console.log("nextTrial");
        var pid = this.choosePhrase();
        var phrase = this.phrases[pid];
        var trial = {};
        trial.phrase = phrase;
        trial.id = pid;
        trial.tries = [];
        this.trials.push(trial);
        this.currentTrial = trial;
        this.currentPhrase = phrase;
        this.currentPid = phrase.id;
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

    dumpDB() {
        console.log("dumpDB");
        this.db.allDocs({ include_docs: true, descending: true }, (err, doc) => {
            console.log(doc.rows);
        });
    }

    async initDB() {
        var db = new PouchDB('jlearn');
        this.db = db;
        this.addRecDB('user', { name: 'Don', size: 'big', lastTime: getClockTime() });
        this.dumpDB();
    }

    addRecDB(id, obj) {
        var row = { _id: id, vals: obj };
        this.db.put(row, (err, result) => {
            if (!err) {
                console.log("Posted row", row);
            }
        })
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
        this.counters.reset();
        await this.counters.save();
        this.updateTable();
    }

    // This downloads the scores
    download(text, filename) {
        filename = "scores.json";
        var obj = {
            'phrases': this.phrases,
            'phraseCounters': this.counters.data
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


}


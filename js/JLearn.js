
"use strict";


var HK_CHARS =
    `
*    –	    k	    s    	t	   n	   h	   m	   y	   r	 w
a	あア	かカ	さサ	たタ	なナ	はハ	まマ	やヤ	らラ	わワ
i	いイ	きキ	しシ	ちチ	にニ	ひヒ	みミ	※	   りリ	   ゐヰ
u	うウ	くク	すス	つツ	ぬヌ	ふフ	むム	ゆユ	るル	※
e	えエ	けケ	せセ	てテ	ねネ	へヘ	めメ	※	   れレ	   ゑヱ
o	おオ	こコ	そソ	とト	のノ	ほホ	もモ	よヨ	ろロ	をヲ
`;

var HK_NO = "んン";
var RE_WHITESPACE = /\s+/;
var HK_PARTS = HK_CHARS.trim().split(RE_WHITESPACE);

class HiraganaPractice {
    constructor() {
        this.init();
        this.idx = 0;
    }

    init() {
        var inst = this;
        inst.charType = "Hiragana";
        inst.hiragana = [];
        inst.katakana = [];
        inst.romanji = [];
        inst.rToH = {};
        inst.hToR = {};
        inst.rToK = {};
        inst.kToR = {};
        inst.selected = {};
        var parts = HK_CHARS.trim().split(RE_WHITESPACE);
        var tweaks = { "tu": "tsu", "si": "shi", "ti": "chi", "hu": "fu" };
        this.tweaks = tweaks;
        var cols = ["", "k", "s", "t", "n", "h", "m", "y", "r", "w"];
        var rows = ["a", "i", "u", "e", "o"];
        for (var i = 0; i < 5; i++) {
            var v = rows[i];
            for (var j = 0; j < 10; j++) {
                var c = cols[j];
                var rom = c + v;
                if (tweaks[rom]) {
                    rom = tweaks[rom];
                }
                var part = parts[(i + 1) * 11 + (j + 1)];
                if (part.length < 2)
                    continue;
                var hir = part[0];
                var kat = part[1];
                console.log(i, j, rom, hir, kat);
                this.romanji.push(rom);
                this.hiragana.push(hir);
                this.katakana.push(kat);
                this.rToH[rom] = hir;
                this.hToR[hir] = rom;
                this.rToK[rom] = kat;
                this.kToR[kat] = hir;
            }
        }
        $("#userInput").change(e => inst.noticeChange());
        $("#userInput").on('input', e => inst.noticeInput(e));
        this.initTable();
        $("#charType").click(e => inst.toggleCharType());
        $("#selectAll").click(e => inst.selectAll(true));
        $("#selectNone").click(e => inst.selectAll(null));
        $("#start").click(e => inst.startTrials());
    }

    // create a table vertically arranged
    initTableV() {
        var inst = this;
        var tab = $("#htab");
        //var tweaks = { "tu": "tsu", "si": "shi", "ti": "chi", "hu": "fu" };
        var vowels = ["a", "i", "u", "e", "o"];
        var groups = ["", "k", "s", "t", "n", "h", "y", "r", "w"];
        groups.forEach(g => {
            var tr = $("<tr>");
            vowels.forEach(v => {
                var td = $("<td>");
                var rom = g + v;
                if (this.tweaks[rom]) {
                    rom = this.tweaks[rom];
                }
                var hir = this.rToH[rom];
                var id = "td_" + rom;
                td.attr("id", id);
                td.html(hir);
                tr.append(td);
            });
            tab.append(tr);
        });
        $("td").click(e => inst.click(e, $(this)));
    }

    // create a table horizontally arranged
    initTable() {
        var inst = this;
        var tab = $("#htab");
        //var tweaks = { "tu": "tsu", "si": "shi", "ti": "chi", "hu": "fu" };
        var vowels = ["a", "i", "u", "e", "o"];
        var groups = ["", "k", "s", "t", "n", "h", "y", "r", "w"];
        vowels.forEach(v => {
            var tr = $("<tr>");
            groups.forEach(g => {
                var td = $("<td>");
                var rom = g + v;
                if (this.tweaks[rom]) {
                    rom = this.tweaks[rom];
                }
                var hir = this.rToH[rom];
                var id = "td_" + rom;
                td.attr("id", id);
                td.html(hir);
                tr.append(td);
            });
            tab.append(tr);
        });
        $("td").click(e => inst.click(e, $(this)));
    }

    updateTable() {
        var inst = this;
        this.romanji.forEach(rom => {
            var id = "td_" + rom;
            var chr = inst.getChar(rom, inst.charType);
            $("#" + id).html(chr);
        })
    }

    toggleCharType() {
        var ctype = $("#charType").html();
        if (ctype == "Hiragana") {
            ctype = "Katakana";
        }
        else if (ctype == "Katakana") {
            ctype = "Both";
        }
        else {
            ctype = "Hiragana";
        }
        $("#charType").html(ctype);
        this.charType = ctype;
        this.updateTable();
    }

    getChar(rom, ctype) {
        var chr = this.rToH[rom];
        if (ctype == "Katakana")
            chr = this.rToK[rom];
        else if (ctype == "Both")
            chr = this.rToH[rom] + " " + this.rToK[rom];
        return chr;
    }

    click(e, item) {
        window.E = e;
        window.ITEM = item;
        console.log("click... this", e, item);
        // i must not have used $(this) correction.
        var item = $(e.target);
        console.log("item", item);
        window.IT = item;
        var id = item.attr("id");
        var rom = id.slice(3);
        this.select(rom, !this.selected[rom]);
        //if (this.selected[rom])
        //    item.css("background-color", "#FFEEEE");

    }

    selectAll(val) {
        var inst = this;
        this.romanji.forEach(rom => inst.select(rom, val));
    }

    select(rom, val) {
        console.log("select", rom);
        var selStyle = "#FFEEEE";
        if (val)
            this.selected[rom] = true;
        else
            delete this.selected[rom];
        $("#td_" + rom).css("background-color", val ? selStyle : "white");
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
        this.showStats("");
    }

    noticeInput(e) {
        console.log("input", e);
        var v = $("#userInput").val();
        if (v == " " || v == "")
            this.noticeChange();
        window.E = e;
    }

    noticeChange() {
        console.log("noticeInput");
        var v = $("#userInput").val().toLowerCase();
        $("#userInput").val("");
        if (v != "")
            this.numTries++;
        this.currentTrial.tries.push(v);
        var label = "good";
        var rom = this.currentTrial.rom.toLowerCase();
        if (v == rom) {
            this.numCorrect++;
        }
        else if (v != "") {
            this.numErrors++;
            label = "ooops";
        }
        if (v == " ") {
            $("#r1").html(rom)
        }
        this.showStats(label);
        if (label == "good" && v != "")
            this.nextTrial();
    }


    showStats(label) {
        $("#stats").html(label + " " + this.numCorrect + " / " + this.numTries);
    }

    // Get probabilities for selecting a given rom
    getProbs(romanjis) {
        var f = [];
        var sum = 0;
        for (var i = 0; i < romanjis.length; i++) {
            var rom = romanjis[i];
            f[i] = 1;
            if (this.currentTrial && this.currentTrial.rom == rom)
                f[i] = 0;
            sum += f[i];
        }
        for (var i = 0; i < romanjis.length; i++) {
            f[i] /= sum;
        }
        return f;
    }

    // Select an index from the vector, with probabilities
    // proportional to prob in vector
    selectRandIndex(pv) {
        var p = Math.random();
        var s = 0;
        for (var i=0; i<pv.length; i++) {
            var f = pv[i];
            if (p < s+f)
                return i;
            s += f;
        }
        return pv.length-1;
    }

    chooseRomanji() {
        console.log("romanjis", romanjis);
        var romanjis = Object.keys(this.selected);
        if (romanjis.length == 0)
            romanjis = this.romanji;
        var CYCLE = false;
        if (CYCLE) {
            this.idx = this.idx % romanjis.length;
            var rom = romanjis[this.idx];
            this.idx++;
        }
        else {
            var pv = this.getProbs(romanjis);
            var i = this.selectRandIndex(pv);
            var rom = romanjis[i];            
        }
        return rom;
    }

    nextTrial() {
        var rom = this.chooseRomanji();
        var hir = this.rToH[rom];
        var kat = this.rToK[rom];
        var trial = { rom, hir, kat, tries: [] };
        console.log("update", this.idx, rom, hir, kat);
        this.currentTrial = trial;
        this.trials.push(trial);
        var chr = this.getChar(rom, this.charType);
        //document.getElementById("h1").innerHTML = h;
        $("#h1").html(chr);
        $("#r1").html("");
        //document.getElementById("r1").innerHTML = this.currentRomanji;
    }

    run() {
        console.log("run...");
        this.reset();
        var inst = this;
        this.nextTrial();
        //setInterval(() => inst.update(), 2000);
    }

    dump() {
        for (var i = 0; i < this.trials.length; i++) {
            var trial = this.trials[i];
            console.log("trial", i, trial.rom, trial.tries);
        }
    }
}


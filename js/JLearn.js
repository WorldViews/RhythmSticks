
"use strict";


var HK_CHARS0 =
    `
*    –	    k	    s    	t	   n	   h	   m	   y	   r	 w
a	あア	かカ	さサ	たタ	なナ	はハ	まマ	やヤ	らラ	わワ
i	いイ	きキ	しシ	ちチ	にニ	ひヒ	みミ	※	   りリ	   ゐヰ
u	うウ	くク	すス	つツ	ぬヌ	ふフ	むム	ゆユ	るル	※
e	えエ	けケ	せセ	てテ	ねネ	へヘ	めメ	※	   れレ	   ゑヱ
o	おオ	こコ	そソ	とト	のノ	ほホ	もモ	よヨ	ろロ	をヲ
`;

var HK_CHARS =
    `
*    –	  k	    s    	t	   n	   h	   m	   y	   r	 w      g     d     b     p    z
a  あア	 かカ	さサ	たタ	なナ	はハ	まマ	やヤ	らラ	わワ    がガ  だダ  ばバ  ぱパ  ざザ
i  いイ	 きキ	しシ	ちチ	にニ	ひヒ	みミ	※	   りリ	   ゐヰ    ぎギ  ぢヂ  びビ  ぴピ  じジ
u  うウ	 くク	すス	つツ	ぬヌ	ふフ	むム	ゆユ	るル	※      ぐグ  づヅ  ぶブ  ぷプ  ずズ
e  えエ	 けケ	せセ	てテ	ねネ	へヘ	めメ	※	   れレ	   ゑヱ    げゲ  でデ  べベ  ぺペ  ぜゼ
o  おオ	 こコ	そソ	とト	のノ	ほホ	もモ	よヨ	ろロ	をヲ    ごゴ  どド  ぼボ  ぽポ  ぞゾ
`;

var XX = `
g	が	ぎ	ぐ	げ	ご
g	ガ	ギ	グ	ゲ	ゴ
d	だ	ぢ	づ	で	ど
d	ダ	ヂ	ヅ	デ	ド
b	ば	び	ぶ	べ	ぼ
b	バ	ビ	ブ	ベ	ボ
p	ぱ	ぴ	ぷ	ぺ	ぽ
p	パ	ピ	プ	ペ	ポ
z	ざ	じ	ず	ぜ	ぞ
z	ザ	ジ	ズ	ゼ	ゾ
`;

var HXX = `
∅	あ	い	う	え	お
k	か	き	く	け	こ
g	が	ぎ	ぐ	げ	ご
s	さ	し	す	せ	そ
z	ざ	じ	ず	ぜ	ぞ
t	た	ち	つ	て	と
d	だ	ぢ	づ	で	ど
n	な	に	ぬ	ね	の
h	は	ひ	ふ	へ	ほ
b	ば	び	ぶ	べ	ぼ
p	ぱ	ぴ	ぷ	ぺ	ぽ
m	ま	み	む	め	も
`;

var KXX = `
g	ガ	ギ	グ	ゲ	ゴ
s	サ	シ	ス	セ	ソ
z	ザ	ジ	ズ	ゼ	ゾ
t	タ	チ	ツ	テ	ト
d	ダ	ヂ	ヅ	デ	ド
n	ナ	ニ	ヌ	ネ	ノ
h	ハ	ヒ	フ	ヘ	ホ
b	バ	ビ	ブ	ベ	ボ
p	パ	ピ	プ	ペ	ポ
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
        var tweaks = { "tu": "tsu", "si": "shi", "ti": "chi", "hu": "fu", "di": "ji" };
        var labtweaks = { "zi": "ji", "du": "zu" };
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
        var vowels = this.vowels;
        var groups = this.groups;
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
        var groups = this.groups;
        this.vowels.forEach(v => {
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
        this.updateTable();
    }

    updateTable() {
        var inst = this;
        this.romanji.forEach(rom => {
            var id = "td_" + rom;
            var chr = inst.getChar(rom, inst.charType);
            var str = chr + '<br><span class="romlab">' + rom + '</span>';
            $("#" + id).html(str);
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
        //$("#td_" + rom).css("background-color", val ? selStyle : "white");
        $("#td_" + rom).css("border-color", val ? "red" : "black");
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
        for (var i = 0; i < pv.length; i++) {
            var f = pv[i];
            if (p < s + f)
                return i;
            s += f;
        }
        return pv.length - 1;
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


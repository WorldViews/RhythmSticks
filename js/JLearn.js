
"use strict";

var HIRAGANA_CHARS = `
あ A
い I
う U
え E
お O
か KA
き KI
く KU
け KE
こ KO
さ SA
し SHI
す SU
せ SE
そ SO
た TA
ち CHI
つ TSU
て TE
と TO
な NA
に NI
ぬ NU
ね NE
の NO
は HA
ひ HI
ふ FU
へ HE
ほ HO
ま MA
み MI
む MU
め ME
も MO
や YA
ゆ YU
よ YO
`;

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

    init0() {
        var inst = this;
        inst.hiragana = [];
        inst.romanji = [];
        inst.rToH = {};
        inst.hToR = {};
        inst.selected = {};
        var hchrs = HIRAG0ANA_CHARS.trim();
        //console.log("hchrs", hchrs);
        var pairs = hchrs.split("\n");
        console.log("pairs", pairs);
        this.hiragana = [];
        pairs.forEach(pair => {
            var [h, romanji] = pair.split(" ");
            romanji = romanji.toLowerCase();
            //console.log("h,r", h, romanji);
            inst.hToR[h] = romanji;
            inst.rToH[romanji] = h;
            inst.hiragana.push(h);
            inst.romanji.push(romanji);
        });
        $("#userInput").change(e => inst.noticeInput());
        this.initTable();
    }

    init() {
        var inst = this;
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
        $("#userInput").change(e => inst.noticeInput());
        this.initTable();
    }

    initTable() {
        var inst = this;
        var tab = $("#htab");
        var tweaks = { "tu": "tsu", "si": "shi", "ti": "chi", "hu": "fu" };
        var vowels = ["a", "i", "u", "e", "o"];
        var groups = ["", "k", "s", "t", "n", "h", "y"];
        groups.forEach(g => {
            var tr = $("<tr>");
            vowels.forEach(v => {
                var td = $("<td>");
                var rom = g + v;
                if (tweaks[rom]) {
                    rom = tweaks[rom];
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

    select(rom, val) {
        console.log("select", rom);
        if (val)
            this.selected[rom] = true;
        else
            delete this.selected[rom];
        $("#td_" + rom).css("background-color", val ? "pink" : "white");
    }

    reset() {
        this.idx = 0;
        this.numTrials = 0;
        this.numTries = 0;
        this.numCorrect = 0;
        this.numErrors = 0;
    }

    noticeInput() {
        console.log("noticeInput");
        var v = $("#userInput").val();
        $("#userInput").val("");
        this.numTries++;
        var label = "good"
        if (v.toLowerCase() == this.currentRomanji.toLowerCase()) {
            this.numCorrect++;
        }
        else {
            this.numErrors++;
            label = "ooops";
        }
        if (v == "" || v == " ") {
            $("#r1").html(this.currentRomanji)
        }
        $("#stats").html(label + " " + this.numCorrect + " / " + this.numTries);
        if (label == "good")
            this.nextTrial();
    }

    nextTrial() {
        var romanjis = Object.keys(this.selected);
        if (romanjis.length == 0)
            romanjis = this.romanji;
        console.log("romanjis", romanjis);
        var rom = romanjis[this.idx];
        var hir = this.rToH[rom];
        var kat = this.rToK[rom];
        this.currentHiragana = hir;
        this.currentRomanji = rom;
        this.currentKatakana = kat;
        console.log("update", this.idx, rom, hir, kat);
        this.numTrials++;
        this.idx = (this.idx + 1) % romanjis.length;
        //document.getElementById("h1").innerHTML = h;
        $("#h1").html(hir+" "+kat);
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
}


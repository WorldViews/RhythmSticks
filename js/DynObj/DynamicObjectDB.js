
/*
  A DynamicObjectDB is just a collection of DynamicObjects, indexed by id.
*/

class DynamicObjectDB {

    static objectSize(obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    }
    
    constructor(name, messageHandler) {
        this.name = name;
        this.loadStartTime = null;
        this.numRecords = 0;  // only used for diagnostics
        this.currentPlayTime = null;
        this.minTime = 1.0E30;
        this.maxTime = -1;
        this.dynamicObjects = [];
        this.messageHandler = messageHandler;
        this.onEnd = null;
    }

    getNumObjects()
    {
        return DynamicObjectDB.objectSize(this.dynamicObjects);
    }

    addRecords(recsObj)
    {
        var recs = recsObj["records"];
        var inst = this;
        for (var i=0; i<recs.length; i++) {
            var rec = recs[i];
            var id = rec.id;
            var dynObj = this.dynamicObjects[id];
            if (dynObj == null) {
                dynObj = new DynamicObject(id);
                this.dynamicObjects[id] = dynObj;
                dynObj.onEnd = (dynObj) => inst.noticeEnd(dynObj);
            }
            dynObj.addRecord(rec);
            this.minTime = Math.min(dynObj.startTime, this.minTime);
            this.maxTime = Math.max(dynObj.endTime, this.maxTime);
        }
        this.numRecords += recs.length;
        //this.dump();
    }

    noticeEnd(dynObj) {
        console.log("*** notice dynObj reached end");
        if (this.onEnd)
            this.onEnd(dynObj);
    }

    async load(url) {
        var dynObjDB = this;
        this.loadStartTime = getClockTime();
        var records = await loadJSON(url);
        //this.addMessages(msgs);
        var t1 = getClockTime();
        dynObjDB.addRecords(records);
        var t2 = getClockTime();
        var numObjs = dynObjDB.getNumObjects();
        console.log("Processed in " + (t2 - t1) + " secs.");
        console.log("Loaded " + url + " with " + dynObjDB.numRecords + " records for " + numObjs +
            " objects in " + (t2 - dynObjDB.loadStartTime) + " sec.");
    }

    dump()
    {
        console.log("------------------------------------");
        console.log("Dynamic DB "+this.name);
        console.log("Num Objects: "+DynamicObjectDB.objectSize(this.dynamicObjects));
        console.log("MinTime: "+this.minTime);
        console.log("MaxTime: "+this.maxTime);
        for (var id in this.dynamicObjects) {
            var dynObj = this.dynamicObjects[id];
            dynObj.dump();
        }
        console.log("------------------------------------");
    }

    postMessage(msg)
    {
        console.log("DynamicObjectDB "+this.name+" postMessage: "+JSON.stringify(msg));
        if (this.messageHandler)
        this.messageHandler(msg);
    }

    /*
      This sets the playTime to a given value.  It does this by
      setting the time for each dynamic object to that time.   For
      each object, the most recent record before that time is found.
      If it is different from the record found at the previous playTime
      messages are sent to create, delete or update the state.
    */
    setPlayTime(t)
    {
        //console.log("dynObjDB setPlayTime "+t);
        var inst = this;
        for (var id in this.dynamicObjects) {
            var dynObj = this.dynamicObjects[id];
            //dynObj.setPlayTime(t, this);
            //dynObj.setPlayTime(t);
            dynObj.setPlayTime(t, rec => inst.messageHandler(rec));
        }
        this.currentPlayTime = t;
    }

    getPlayTime() {
        return this.currentPlayTime;
    }

// tests
    static async test1() {
        var db = new DynamicObjectDB("test1");
        //var db = new ImageDB("test1");
        //    db.postMessage = function(msg) {
        //  console.log("--> msg: "+JSON.stringify(msg));
        //    }
        var recs = {
            "records": [
                { "id": "obj1", "t": 1, "label": "one" },
                { "id": "obj2", "t": 1, "label": "one" },
                { "id": "obj1", "t": 1.3, "label": "one.three" },
                { "id": "obj2", "t": 1.6, "label": "one.six" },
                { "id": "obj1", "t": 2.0, "label": "two.zero" },
                { "id": "obj1", "t": 2.5, "label": "two.five" },
                { "id": "obj2", "t": 2.6, "label": "two.six" },
            ]
        }
        db.addRecords(recs);
        db.dump();
        var low = 0;
        var high = 3.0;
        for (var t = low; t < high; t += 0.1) {
            console.log("t: " + sprintf("%8.2f", t));
            db.setPlayTime(t);
        }
        for (var t = high; t >= low; t -= 0.1) {
            console.log("t: " + sprintf("%8.2f", t));
            db.setPlayTime(t);
        }
    }

    static async test2() {
        var db = new DynamicObjectDB("test2");
        await db.load("/testData/dynObjDB_test1.json");
        db.dump();
        var low = 0;
        var high = 3.0;
        for (var t = low; t < high; t += 0.1) {
            console.log("t: " + sprintf("%8.2f", t));
            db.setPlayTime(t);
        }
        for (var t = high; t >= low; t -= 0.1) {
            console.log("t: " + sprintf("%8.2f", t));
            db.setPlayTime(t);
        }
    }

}




if (typeof exports !== 'undefined') {
    //console.log("MUSEPortal setting up exports");
    exports.DynamicObjectDB = DynamicObjectDB;
}



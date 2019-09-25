const MongoClient = require('mongodb').MongoClient;
const fs = require("fs");

class FileDb {

  constructor() { }

  async getBest() {
    try {
      const content = fs.readFileSync("resultsdb.json", "utf8").trim();
      const content_list = JSON.parse(`[${content.substring(0, content.length - 1)}]`);
      return content_list.filter(it => it.status === 1).sort((a, b) => b.score - a.score).slice(-10);
    } catch {
      return [];
    }
  }

  async getLast() {
    try {
      const content = fs.readFileSync("resultsdb.json", "utf8").trim();
      const content_list = JSON.parse(`[${content.substring(0, content.length - 1)}]`);
      return content_list.slice(-10).reverse();
    } catch {
      return [];
    }
  }

  add(result) {
    let last_id = 0;
    try {
      last_id = JSON.parse(fs.readFileSync("result_id.json", "utf8"));
    } catch { }
    result.id = last_id + 1;
    fs.writeFileSync("result_id.json", JSON.stringify(result.id));
    fs.appendFileSync("resultsdb.json", JSON.stringify(result) + ', ');
    return result;
  }
}

class MongoDb {

  constructor() {
    const self = this;

    MongoClient.connect("mongodb://localhost:27017/",
      (err, client) => {
        const db = client.db('gamedb');
        if (err) throw err;
        self.db = db;

        self.db.createCollection("results",
          (err, res) => {
            if (err) throw err;
          });

        self.db.createCollection("counters",
          (err, res) => {
            if (err) throw err;
            self.db.collection('counters').findOne({ _id: 'resultid' },
              (err, data) => {
                if (err) throw err;
                if (data === null) {
                  self.db.collection('counters').insertOne({ _id: 'resultid', sequence_value: 1 });
                }
              });
          });
      });
  }

  getNextSequenceValue(sequence_name) {

    const ret = this.db.collection('counters').findOneAndUpdate(
      { _id: sequence_name },
      { $inc: { sequence_value: 1 } },
      { new: true }
    );
    return ret;
  }

  async getBest() {
    const best_sort = { score: -1 };
    const query = { status: 1 };
    const list = await this.db.collection("results").find(query).sort(best_sort).limit(10).toArray();
    return list;
  }

  async getLast() {
    const last_sort = { id: -1 }
    const list = await this.db.collection("results").find().sort(last_sort).limit(10).toArray();
    return list;
  }

  add(result) {
    const self = this;
    this.db.collection('results',
      (err, collection) => {
        if (err) throw err;
        self.getNextSequenceValue('resultid').then(sequence_counter => {
          result.id = sequence_counter.value.sequence_value;
          collection.insertOne(result);
        })
      });
    return result;
  }
}

const stats = new MongoDb();
module.exports = stats;

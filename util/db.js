const { QuickDB } = require("quick.db");

const db = new QuickDB("save/json.sqlite");
module.exports = db;

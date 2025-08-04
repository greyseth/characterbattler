const { QuickDB } = require("quick.db");

const db = new QuickDB({ filePath: "./save/json.sqlite" });
module.exports = db;

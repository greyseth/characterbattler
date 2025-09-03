const db = require("../util/db");

module.exports = async (userId) => {
  if (!(await db.has(`${userId}_profile`)))
    await db.set(`${userId}_profile`, {
      rank: 1,
      exp: 0,
      nextLevel: 100,
      battles: {
        total: 0,
        won: 0,
        lost: 0,
      },
      main: undefined,
      lastCharacters: [],
    });
};

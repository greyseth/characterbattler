let battles = [];

module.exports = {
  getBattles: () => battles,
  setBattles: (value) => (battles = value),
  editBattle: (value, index) =>
    (battles = battles.map((b, i) => {
      if (i === index) return value;
      else return b;
    })),
  addBattle: (value) => (battles = [...battles, value]),
  removeBattle: (index) => (battles = battles.filter((_, i) => i !== index)),
};

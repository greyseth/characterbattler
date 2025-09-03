const { EmbedBuilder } = require("@discordjs/builders");
const { getBattles, removeBattle } = require("../util/battles");
const { ActionRowBuilder } = require("@discordjs/builders");
const { ButtonBuilder, ButtonStyle } = require("discord.js");
const db = require("../util/db");
const initializeProfile = require("./initializeProfile");
const createProfileCard = require("./createProfileCard");

module.exports = async (interaction, battleId, prevOutcome) => {
  const battleData =
    getBattles()[getBattles().findIndex((b) => b.id == battleId)];
  if (!battleData)
    return await interaction.update({
      content: "Battle not found",
      embeds: [],
      components: [],
    });

  let deadCharacter = { isDead: false, charIndex: 0 };
  battleData.characters.forEach((char, i) => {
    if (char.health < 0) deadCharacter = { isDead: true, charIndex: i };
  });

  const curTurn = battleData.turn;

  const characterDataEmbeds = [
    new EmbedBuilder()
      .setAuthor({
        name: `${battleData.players[0].username}'s character`,
      })
      .setTitle(battleData.characters[0].name)
      .setDescription(
        `${battleData.characters[0].description}\n\nHealth: ${battleData.characters[0].health}`
      ),
    // .setColor("Green"),
    // FIXME: Why is it expecting an array???
    new EmbedBuilder()
      .setAuthor({
        name: `${battleData.players[1].username}'s character`,
      })
      .setTitle(battleData.characters[1].name)
      .setDescription(
        `${battleData.characters[1].description}\n\nHealth: ${battleData.characters[1].health}`
      ),
    // .setColor("Green"),
    new EmbedBuilder()
      .setTitle("Battle Setting:")
      .setDescription(battleData.setting),
  ];

  if (deadCharacter.isDead) {
    const victorIndex = deadCharacter.charIndex === 0 ? 1 : 0;
    const victor = battleData.characters[victorIndex];

    // Winner profile data update
    await initializeProfile(battleData.players[victorIndex].id);
    let winnerProfile = await db.get(
      `${battleData.players[victorIndex].id}_profile`
    );

    winnerProfile.battles.total += 1;
    winnerProfile.battles.won += 1;

    // Loser profile data update
    await initializeProfile(battleData.players[deadCharacter.charIndex].id);
    let loserProfile = await db.get(
      `${battleData.players[deadCharacter.charIndex].id}_profile`
    );

    loserProfile.battles.total += 1;
    loserProfile.battles.lost += 1;

    let expGain = 0;
    let expSubtract = 0;

    // Rank update
    if (battleData.type === "ranked") {
      const winRankDiff = loserProfile.rank - winnerProfile.rank;
      const loseRankDiff = winnerProfile.rank - loserProfile.rank;

      expGain = 33 + 10 * winRankDiff;
      winnerProfile.exp += expGain;
      if (
        winnerProfile.exp >= winnerProfile.nextLevel &&
        winnerProfile.rank < 10
      ) {
        winnerProfile.rank += 1;
        winnerProfile.exp = winnerProfile.exp - winnerProfile.nextLevel;
      }

      expSubtract = 25 - 5 * loseRankDiff;
      if (loserProfile.exp < expSubtract && loserProfile.rank > 1) {
        loserProfile.rank -= 1;
        loserProfile.exp = Math.max(
          0,
          loserProfile.nextLevel - (expSubtract - loserProfile.exp)
        );
      } else loserProfile.exp -= expSubtract;

      if (loserProfile.exp <= 0) loserProfile.exp = 0;
    }

    // Main used character setup
    if (!winnerProfile.lastCharacters) winnerProfile.lastCharacters = [];
    winnerProfile.lastCharacters.push(battleData.characters[victorIndex].name);
    if (winnerProfile.lastCharacters.length > 10)
      winnerProfile.lastCharacters.shift();

    if (winnerProfile.lastCharacters.length === 10) {
      let count = {};
      winnerProfile.lastCharacters.forEach((char) => {
        if (!count[char]) count[char] = 1;
        else count[char] += 1;
      });

      let biggestCount = { char: "", count: 0 };
      Object.keys(count).forEach((char) => {
        if (count[char] > biggestCount.count)
          biggestCount = { char: char, count: count[char] };
      });

      winnerProfile.main = biggestCount.char;
    }

    if (!loserProfile.lastCharacters) loserProfile.lastCharacters = [];
    loserProfile.lastCharacters.push(
      battleData.characters[deadCharacter.charIndex].name
    );
    if (loserProfile.lastCharacters.length > 10)
      loserProfile.lastCharacters.shift();

    if (loserProfile.lastCharacters.length === 10) {
      let count = {};
      loserProfile.lastCharacters.forEach((char) => {
        if (!count[char]) count[char] = 1;
        else count[char] += 1;
      });

      let biggestCount = { char: "", count: 0 };
      Object.keys(count).forEach((char) => {
        if (count[char] > biggestCount.count)
          biggestCount = { char: char, count: count[char] };
      });

      loserProfile.main = biggestCount.char;
    }

    // DB apply
    await db.set(
      `${battleData.players[victorIndex].id}_profile`,
      winnerProfile
    );
    await db.set(
      `${battleData.players[deadCharacter.charIndex].id}_profile`,
      loserProfile
    );

    const winMessage = {
      content: `${prevOutcome}\n\n**Battle concluded**`,
      embeds: [
        new EmbedBuilder()
          .setTitle("Winner: " + victor.name)
          .setDescription(
            `${battleData.players[victorIndex].username} is victorious!`
          )
          .addFields(
            {
              name: "Winner EXP gain",
              value:
                battleData.type === "ranked"
                  ? expGain.toString()
                  : "0 (casual match)",
            },
            {
              name: "Loser EXP loss",
              value:
                battleData.type === "ranked"
                  ? expSubtract.toString()
                  : "0 (casual match)",
            }
          )
          .setImage("attachment://profile-card.png"),
        // .setColor("#FFD700"),
        // FIXME: Again, why is expecting an array???
      ],
      components: [],
      files: [
        await createProfileCard(battleData.players[victorIndex], winnerProfile),
      ],
    };

    if (interaction.replied || interaction.deferred)
      await interaction.editReply(winMessage);
    else await interaction.reply(winMessage);

    removeBattle(getBattles().findIndex((b) => b.id == battleId));
    return;
  }

  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`btn_battle_any_stop_${battleId}`)
      .setLabel("Stop Battle")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(
        `btn_battle_${battleData.players[curTurn].id}_move_${battleId}`
      )
      .setLabel("Move")
      .setStyle(ButtonStyle.Primary)
  );

  if (interaction.replied || interaction.deferred) {
    await interaction.editReply({
      content: `${battleData.characters[curTurn === 0 ? 1 : 0].name}: ${
        prevOutcome ?? ""
      }\n**${battleData.characters[curTurn].name}'s turn**`,
      embeds: characterDataEmbeds,
      components: [controls],
    });
  } else {
    await interaction.reply({
      content: prevOutcome
        ? `${battleData.characters[curTurn === 0 ? 1 : 0].name}: ${
            prevOutcome ?? ""
          }\n**${battleData.characters[curTurn].name}'s turn**`
        : `**${battleData.characters[curTurn].name}'s turn**`,
      embeds: characterDataEmbeds,
      components: [controls],
    });
  }
};

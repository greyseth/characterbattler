const { EmbedBuilder } = require("@discordjs/builders");
const { getBattles, removeBattle } = require("../util/battles");
const { ActionRowBuilder } = require("@discordjs/builders");
const { ButtonBuilder, ButtonStyle } = require("discord.js");

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

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({
        content: `${prevOutcome}\n\n**Battle concluded**`,
        embeds: [
          new EmbedBuilder()
            .setTitle("Winner: " + victor.name)
            .setDescription(
              `${battleData.players[victorIndex].username} is victorious!`
            ),
          // .setColor("#FFD700"),
          // FIXME: Again, why is expecting an array???
        ],
        components: [],
      });
    } else {
      await interaction.reply({
        content: `${prevOutcome}\n\n**Battle concluded**`,
        embeds: [
          new EmbedBuilder()
            .setTitle("Winner: " + victor.name)
            .setDescription(
              `${battleData.players[victorIndex].username} is victorious!`
            ),
          // .setColor("#FFD700"),
          // FIXME: Again, why is expecting an array???
        ],
        components: [],
      });
    }

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

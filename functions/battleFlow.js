const { EmbedBuilder } = require("@discordjs/builders");
const { getBattles } = require("../util/battles");
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
  ];

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

  await interaction.update({
    content: `**${battleData.characters[curTurn].name}'s turn**\n${
      prevOutcome ?? ""
    }`,
    embeds: characterDataEmbeds,
    components: [controls],
  });
};

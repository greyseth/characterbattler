const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const db = require("../util/db");

module.exports = async function characterList(interaction, index, newMsg) {
  const characterList = (await db.get(`${interaction.user.id}_char`)) ?? [];
  if (characterList.length < 1) {
    await interaction.reply({
      content: "You don't have any characters yet, register a new one!",
      ephemeral: true,
    });
    return;
  }

  const char = characterList[index];

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${interaction.member.displayName}'s character display`,
    })
    .setTitle(char.name)
    .setDescription(char.description);

  char.skills.forEach((s, i) => {
    embed.addFields({ name: `Skill ${i + 1}`, value: s });
  });
  embed.addFields({ name: "\u200B", value: "\u200B" });
  char.weaknesses.forEach((w, i) => {
    embed.addFields({ name: `Weakness ${i + 1}`, value: w });
  });
  embed.addFields({ name: "\u200B", value: "\u200B" });
  embed.addFields(
    { name: "Strength", value: char.stats.str ?? "N/A", inline: true },
    { name: "Defense", value: char.stats.def ?? "N/A", inline: true },
    { name: "Endurance", value: char.stats.end ?? "N/A", inline: true },
    { name: "Intelligence", value: char.stats.int ?? "N/A", inline: true },
    { name: "Agility", value: char.stats.agi ?? "N/A", inline: true },
    { name: "Luck", value: char.stats.lck ?? "N/A", inline: true }
  );

  const row = new ActionRowBuilder();
  if (characterList.length > 1) {
    if (index > 0)
      row.addComponents(
        new ButtonBuilder()
          .setLabel("Prev")
          .setStyle(ButtonStyle.Primary)
          .setCustomId("btn_char_list_prev")
      );

    row.addComponents(
      new ButtonBuilder()
        .setLabel("Search Character")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("btn_char_list_search")
    );

    if (index < characterList.length - 1)
      row.addComponents(
        new ButtonBuilder()
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
          .setCustomId("btn_char_list_next")
      );
  } else
    row.addComponents(
      new ButtonBuilder()
        .setLabel("Search Character")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("btn_char_list_search")
    );

  if (!newMsg) await interaction.update({ embeds: [embed], components: [row] });
  else await interaction.reply({ embeds: [embed], components: [row] });
};

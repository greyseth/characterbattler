const { ButtonBuilder } = require("@discordjs/builders");
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const db = require("../../util/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("charactermenu")
    .setDescription("Opens the character management menu"),
  async execute(interaction) {
    const characterList = (await db.get(`${interaction.user.id}_char`)) ?? [];
    const selectedCharacter =
      (await db.get(`${interaction.user.id}_char_selected`)) ?? undefined;

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("Character Menu")
      .setDescription(
        "Manage your characters from this menu. Click one of the buttons for more options\nCharacters list - See all your registered characters\nChange Selected Character - Select the character you want to use in battle\nRegister New Character - Register a new character to your list"
      )
      .addFields(
        {
          name: "Characters registered:",
          value: characterList.length.toString(),
          inline: true,
        },
        {
          name: "Selected Character: ",
          value: selectedCharacter ? selectedCharacter.name : "None selected",
          inline: true,
        }
      );

    const controls = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setLabel("All Characters")
        .setCustomId("btn_char_allCharacters"),
      new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setLabel("Change Selected Character")
        .setCustomId("btn_char_select"),
      new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setLabel("Register New Character")
        .setCustomId("btn_char_register")
    );

    interaction.reply({
      embeds: [embed],
      components: [controls],
      ephemeral: true,
    });
  },
};

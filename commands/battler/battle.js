const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const db = require("../../util/db");
const { addBattle } = require("../../util/battles");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("battle")
    .setDescription("Challenge another user to a character battle")
    .addUserOption((option) =>
      option
        .setName("opponent")
        .setDescription("User to challenge to a character battle")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("matchtype")
        .setDescription(
          "Match type to challenge player (casual matches won't have an effect on your rank and exp)"
        )
        .addChoices(
          { name: "Ranked Match", value: "ranked" },
          { name: "Casual Match", value: "casual" }
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("setting")
        .setDescription("Describe the setting the battle will take place in")
    ),
  async execute(interaction) {
    // Checks if user has a character selected
    if (!(await db.get(`${interaction.user.id}_char_selected`)))
      return await interaction.reply({
        content:
          "You don't have a character selected to battle with. Open the character menu to set your selection",
        ephemeral: true,
      });

    // Checks if user selected themselves
    if (interaction.user.id === interaction.options.getUser("opponent").id)
      return await interaction.reply({
        content: "You can't challenge yourself!",
        ephemeral: true,
      });

    const controls = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(
          `btn_battle_${interaction.options.getUser("opponent").id}_decline`
        )
        .setLabel("Decline")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(
          `btn_battle_${interaction.options.getUser("opponent").id}_accept`
        )
        .setLabel("Accept")
        .setStyle(ButtonStyle.Primary)
    );

    addBattle({
      id: 0,
      characters: [
        {
          ...(await db.get(`${interaction.user.id}_char_selected`)),
          health: 150,
        },
        {},
      ],
      players: [interaction.user, interaction.options.getUser("opponent")],
      setting:
        interaction.options.getString("setting") ??
        "A simulation environment that can change to anything",
      running: false,
      turn: 0,
      type: interaction.options.getString("matchtype"),
    });

    await interaction.reply({
      content: `${interaction.options.getUser(
        "opponent"
      )}, you're being challenged to a battle!`,
      components: [controls],
    });
  },
};

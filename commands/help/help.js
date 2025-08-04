const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Guide and instructions on how to use the bot"),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setAuthor({ name: "Help menu!" })
      .setTitle("Getting Started Guide")
      .setDescription(
        `
                    Welcome to CharacterBattler. You can have PvP battles using any character of your creation. Read on for instructions on how it works and how to use it.
                `
      )
      .addFields(
        {
          name: "Character Management",
          value: `You can use the /charactermenu command to access all the options related to managing your characters.`,
        },
        {
          name: "Initiating a Battle",
          value: `You can use the /battle command to challenge someone to a character battle. You can also define the setting of the backdrop where you'd like to have your battle in.\n
                    Once your opponent accepts the battle invitation, then the challenger must click the Start Battle button to begin.`,
        },
        {
          name: "Battle Flow",
          value: `The person who initiated the battle gets the first turn. During battle, you can click on the Move button, where you'll be prompted to input an action. You can only do this if it's currently your turn. Once you submit your action, the AI DungeonMaster will determine the outcome of it, and it becomes your opponent's turn.`,
        }
      );

    await interaction.reply({
      embeds: [embed],
      components: [],
    });
  },
};

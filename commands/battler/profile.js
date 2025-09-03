const ranks = require("../../ranks.json");

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../util/db");
const initializeProfile = require("../../functions/initializeProfile");
const createProfileCard = require("../../functions/createProfileCard");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View your own or someone else's profile")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription(
          "User to view CharacterBattler profile of (leave empty to view your own)"
        )
    ),
  async execute(interaction) {
    const user = interaction.options.getUser("user") ?? interaction.user;

    await initializeProfile(user.id);
    const profile = await db.get(`${user.id}_profile`);

    console.log(profile);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${user.globalName}'s profile`)
          .setDescription(
            `Player rank **${profile.rank}**\n**${ranks[profile.rank - 1]}**`
          )
          .setColor("Green")
          .addFields(
            {
              name: "Rank Exp",
              value: `${profile.exp}/${profile.nextLevel}`,
            },
            {
              name: "Battles fought",
              value: profile.battles.total.toString(),
            },
            {
              name: "Wins",
              value: profile.battles.won.toString(),
              inline: true,
            },
            {
              name: "Lost",
              value: profile.battles.lost.toString(),
              inline: true,
            },
            {
              name: "Main Character",
              value: profile.main ?? "Not enough play data",
            }
          )
          .setImage("attachment://profile-card.png"),
      ],
      files: [await createProfileCard(user, profile)],
    });
  },
};

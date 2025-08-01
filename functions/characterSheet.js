const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

const formQuestions = [
  {
    id: "name",
    title: "New Character Registration",
    label: "Character Name",
    style: TextInputStyle.Short,
    required: true,
  },
  {
    id: "description",
    title: "Character Description",
    label: "Brief Description",
    style: TextInputStyle.Paragraph,
    required: true,
    placeholder:
      "You'll be prompted to enter their skills and weaknesses after this, so just keep it brief",
  },
  {
    id: "skills",
    title: "Character Abilities",
    label: "Max 5, separate with semicolon",
    style: TextInputStyle.Paragraph,
    required: true,
    placeholder:
      "Cryomancy;Proficiency in martial arts;Superhuman strength and reflexes;Grandmaster of a clan",
  },
  {
    id: "weaknesses",
    title: "Character Weaknesses",
    label: "At least 1, separate with semicolon",
    style: TextInputStyle.Paragraph,
    required: true,
    placeholder: "Regular human durability;Ice structures susceptible to fire",
  },
  {
    id: "skillpoints",
    title: "Allocate Skill Points",
    label: "Max 24 points",
    style: TextInputStyle.Paragraph,
    required: true,
    defaultValue: `strength:1\ndefense:1\nendurance:1\nagility:1\nintelligence:1\nluck:1`,
  },
];

module.exports = async function characterSheet(interaction, index) {
  const fd = formQuestions[index];

  const modal = new ModalBuilder()
    .setCustomId("modal_char_" + fd.id)
    .setTitle(fd.title);

  const input = new TextInputBuilder()
    .setCustomId("input_" + fd.id)
    .setLabel(fd.label)
    .setStyle(fd.style)
    .setRequired(fd.required)
    .setPlaceholder(fd.placeholder ?? "")
    .setValue(fd.defaultValue ?? "");

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  await interaction.showModal(modal);
};

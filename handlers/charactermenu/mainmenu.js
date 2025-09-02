const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require("discord.js");
const characterList = require("../../functions/characterList");
const characterSheet = require("../../functions/characterSheet");
const db = require("../../util/db");

module.exports = {
  async mainMenuButtonHandler(interaction) {
    if (interaction.customId === "btn_char_allCharacters") {
      const lastPage = (await db.get(`${interaction.user.id}_char_page`)) ?? 0;
      characterList(interaction, lastPage, true);
    }

    if (interaction.customId === "btn_char_select") {
      const modal = new ModalBuilder()
        .setCustomId("modal_select")
        .setTitle("Change Selected Character");
      const input = new TextInputBuilder()
        .setCustomId("input_charname")
        .setLabel("Search by name")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
    }

    if (interaction.customId === "btn_char_register") {
      if (await db.has(`${interaction.user.id}_char_temp`))
        await db.delete(`${interaction.user.id}_char_temp`);
      characterSheet(interaction, 0);
    }
  },
  async characterListButtonHandler(interaction) {
    // Handles buttons on character list
    if (interaction.customId === "btn_char_list_prev") {
      const lastPage = (await db.get(`${interaction.user.id}_char_page`)) ?? 0;
      characterList(interaction, lastPage - 1);
      await db.set(`${interaction.user.id}_char_page`, lastPage - 1);
    }
    if (interaction.customId === "btn_char_list_next") {
      const lastPage = (await db.get(`${interaction.user.id}_char_page`)) ?? 0;
      characterList(interaction, lastPage + 1);
      await db.set(`${interaction.user.id}_char_page`, lastPage + 1);
    }
    if (interaction.customId === "btn_char_list_search") {
      const modal = new ModalBuilder()
        .setCustomId("modal_search")
        .setTitle("Search Character");
      const input = new TextInputBuilder()
        .setCustomId("input_charname")
        .setLabel("Search by name")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
    }

    if (interaction.customId.startsWith(`btn_char_list_edit_`)) {
      const editIndex = parseInt(
        interaction.customId.split("btn_char_list_edit_")[1]
      );

      const characterList = (await db.get(`${interaction.user.id}_char`)) ?? [];
      const charData = characterList[editIndex];

      const modal = new ModalBuilder()
        .setTitle("Edit Character")
        .setCustomId(`modal_edit_${editIndex}`);

      const nameInput = new TextInputBuilder()
        .setLabel("Character Name")
        .setCustomId("name")
        .setValue(charData.name)
        .setRequired(true)
        .setStyle(TextInputStyle.Short);
      const descriptionInput = new TextInputBuilder()
        .setLabel("Character Description")
        .setCustomId("description")
        .setValue(charData.description)
        .setPlaceholder(
          "You'll be prompted to enter their skills and weaknesses after this, so just keep it brief"
        )
        .setRequired(true)
        .setStyle(TextInputStyle.Paragraph);
      const skillsInput = new TextInputBuilder()
        .setLabel("Character Abilities")
        .setCustomId("skills")
        .setValue(charData.skills.join(";"))
        .setPlaceholder(
          "Cryomancy;Proficiency in martial arts;Superhuman strength and reflexes;Grandmaster of a clan"
        )
        .setRequired(true)
        .setStyle(TextInputStyle.Paragraph);
      const weaknessesInput = new TextInputBuilder()
        .setLabel("Character Weaknesses")
        .setCustomId("weaknesses")
        .setValue(charData.weaknesses.join(";"))
        .setPlaceholder(
          "Regular human durability;Ice structures susceptible to fire"
        )
        .setRequired(true)
        .setStyle(TextInputStyle.Paragraph);
      const sp = charData.stats;
      const skillpointsInput = new TextInputBuilder()
        .setLabel("Max 24 pts")
        .setCustomId("skillpoints")
        .setValue(
          `strength:${sp.str}\ndefense:${sp.def}\nendurance:${sp.end}\nagility:${sp.agi}\nintelligence:${sp.int}\nluck:${sp.lck}`
        )
        .setRequired(true)
        .setStyle(TextInputStyle.Paragraph);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(descriptionInput),
        new ActionRowBuilder().addComponents(skillsInput),
        new ActionRowBuilder().addComponents(weaknessesInput),
        new ActionRowBuilder().addComponents(skillpointsInput)
      );

      await interaction.showModal(modal);
    }
    if (interaction.customId.startsWith("btn_char_list_delete_")) {
      const deleteIndex = parseInt(
        interaction.customId.split("btn_char_list_delete_")[1]
      );
      let allChars = await db.get(`${interaction.user.id}_char`);

      let nextPrevIndex = 0;
      if (deleteIndex === allChars.length - 1) nextPrevIndex = deleteIndex - 1;
      else if (deleteIndex === 0) nextPrevIndex = 1;
      else nextPrevIndex = deleteIndex + 1;

      allChars = allChars.filter((_, i) => i !== deleteIndex);

      await db.set(`${interaction.user.id}_char`, allChars);

      if (allChars.length > 0) characterList(interaction, nextPrevIndex, false);
      else
        await interaction.update({
          content: "You don't have any more characters",
          ephemeral: true,
          embeds: [],
          components: [],
        });
    }

    if (interaction.customId.startsWith("btn_char_list_export")) {
      const charName = interaction.customId.split("btn_char_list_export_")[1];
      const char = ((await db.get(`${interaction.user.id}_char`)) ?? []).find(
        (c) => c.name === charName
      );
      if (char)
        await interaction.reply({
          content: JSON.stringify(char),
          ephemeral: true,
        });
      else
        await interaction.reply({
          content: "Failed to find character, please try again",
          ephemeral: true,
        });
    }
  },
  async characterRegistrationButtonHandler(interaction) {
    // Handles buttons for character registration form
    const charFormMax = 4;
    if (interaction.customId.startsWith("btn_char_register_next_")) {
      const currentNumber = parseInt(
        interaction.customId.split("btn_char_register_next_")[1]
      );

      if (currentNumber + 1 <= charFormMax)
        characterSheet(interaction, currentNumber + 1);
      else {
        const charTemp = await db.get(`${interaction.user.id}_char_temp`);
        const characterList =
          (await db.get(`${interaction.user.id}_char`)) ?? [];

        await db.set(`${interaction.user.id}_char`, [
          ...characterList,
          charTemp,
        ]);

        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("New character has been registered")
              .setColor("Green"),
          ],
          components: [],
          ephemeral: true,
        });
      }
    }
    if (interaction.customId.startsWith("btn_char_register_cancel")) {
      if (await db.has(`${interaction.user.id}_char_temp`))
        await db.delete(`${interaction.user.id}_char_temp`);
      await interaction.update({
        content: "Character registration cancelled",
        embeds: [],
        components: [],
        ephemeral: true,
      });
    }
  },
};

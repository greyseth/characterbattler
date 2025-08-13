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

    if (interaction.customId === "btn_char_list_edit") {
      await interaction.showModal();
    }
    if (interaction.customId === "btn_char_list_delete") {
      const modal = new ModalBuilder()
        .setTitle("Confirm Character Deletion")
        .setCustomId("modal_delete");
      const input = new TextInputBuilder()
        .setLabel("Type your character's name to confirm")
        .setStyle(TextInputStyle.Short)
        .setCustomId("input_confirmation");

      modal.addComponents(input);

      await interaction.showModal(modal);
    }

    if (interaction.customId.startsWith("btn_char_list_export")) {
      const charName = interaction.customId.split("btn_char_list_export_")[1];
      const char = (db.get(`${interaction.user.id}_char`) ?? []).find(
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

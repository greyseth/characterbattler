const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const characterList = require("../../functions/characterList");
const db = require("../../util/db");

module.exports = {
  async characterListModals(interaction) {
    // Character selection
    if (interaction.customId === "modal_select") {
      const allCharacters = (await db.get(`${interaction.user.id}_char`)) ?? [];

      if (allCharacters.length < 1)
        return await interaction.reply({
          content: "No characters registered yet",
          ephemeral: true,
        });

      const searchQuery = interaction.fields
        .getTextInputValue(`input_charname`)
        .toLowerCase();
      const foundChar = allCharacters.findIndex(
        (c) => c.name.toLowerCase() === searchQuery
      );
      if (foundChar === -1)
        await interaction.reply({
          content: `No character '${searchQuery}' was found`,
          ephemeral: true,
        });
      else {
        await db.set(
          `${interaction.user.id}_char_selected`,
          allCharacters[foundChar]
        );
        await interaction.reply({
          content: "Set selected character to " + allCharacters[foundChar].name,
          ephemeral: true,
        });
      }
    }

    // Character list search
    if (interaction.customId === "modal_search") {
      const allCharacters = (await db.get(`${interaction.user.id}_char`)) ?? [];

      if (allCharacters.length < 1)
        return await interaction.reply({
          content: "No characters registered yet",
          ephemeral: true,
        });

      const searchQuery = interaction.fields
        .getTextInputValue(`input_charname`)
        .toLowerCase();
      const foundChar = allCharacters.findIndex(
        (c) => c.name.toLowerCase() === searchQuery
      );
      if (foundChar === -1)
        await interaction.reply({
          content: `No character '${searchQuery}' was found`,
          ephemeral: true,
        });
      else {
        await db.set(`${interaction.user.id}_char_page`, foundChar);

        characterList(interaction, foundChar, false);
      }
    }

    // Character edit
    if (interaction.customId.startsWith("modal_edit_")) {
      const editIndex = parseInt(interaction.customId.split("modal_edit_")[1]);

      let characterList = (await db.get(`${interaction.user.id}_char`)) ?? [];
      if (characterList.length > 0) {
        const skills = interaction.fields
          .getTextInputValue("skills")
          .split(";")
          .filter((_, i) => i < 5);
        const weaknesses = interaction.fields
          .getTextInputValue("weaknesses")
          .split(";")
          .filter((_, i) => i < 5);
        const statsStr = interaction.fields
          .getTextInputValue("skillpoints")
          .split("\n")
          .filter((_, i) => i < 6);
        const stats = {
          str: (statsStr.find((ss) => ss.includes("strength")) || "").split(
            ":"
          )[1],
          def: (statsStr.find((ss) => ss.includes("defense")) || "").split(
            ":"
          )[1],
          end: (statsStr.find((ss) => ss.includes("endurance")) || "").split(
            ":"
          )[1],
          int: (statsStr.find((ss) => ss.includes("intelligence")) || "").split(
            ":"
          )[1],
          agi: (statsStr.find((ss) => ss.includes("agility")) || "").split(
            ":"
          )[1],
          lck: (statsStr.find((ss) => ss.includes("luck")) || "").split(":")[1],
        };

        if (skills.length < 1)
          return await interaction.reply({
            content: "Skills cannot be empty",
            ephemeral: true,
          });
        if (weaknesses.length < 1)
          return await interaction.reply({
            content: "Weaknesses cannot be empty",
            ephemeral: true,
          });
        let invalid = false;
        let invalidMsg = "";

        let spTotal = 0;
        Object.keys(stats).forEach((stat) => {
          if (!parseInt(stats[stat])) {
            invalid = true;
            invalidMsg = `${stat} stat is required!`;
          } else spTotal += parseInt(stats[stat]);
        });

        if (!invalid) {
          if (spTotal > 24) {
            invalid = true;
            invalidMsg = "Allocated SP more than 24";
          }
        }

        if (invalid)
          return await interaction.reply({
            content: invalidMsg,
            ephemeral: true,
          });

        characterList[editIndex] = {
          ...characterList[editIndex],
          name: interaction.fields.getTextInputValue("name"),
          description: interaction.fields.getTextInputValue("description"),
          skills: interaction.fields.getTextInputValue("skills").split(";"),
          weaknesses: interaction.fields
            .getTextInputValue("weaknesses")
            .split(";"),
          stats: stats,
        };

        await db.set(`${interaction.user.id}_char`, characterList);

        await interaction.reply({
          content: "Character successfully updated",
          ephemeral: true,
        });
      } else
        interaction.reply({
          content: "Something wrong happened",
          ephemeral: true,
        });
    }
  },
  // I REALLY should make this a loop... but maybe later I'm too lazy
  async characterRegistrationModals(interaction) {
    // Character registration form
    if (interaction.customId.startsWith("modal_char_")) {
      const charTemp = (await db.get(`${interaction.user.id}_char_temp`)) ?? {};

      const field = interaction.customId.split("modal_char_")[1];
      const inputValue = interaction.fields.getTextInputValue(`input_${field}`);
      switch (field) {
        case "name":
          await db.set(`${interaction.user.id}_char_temp`, {
            ...charTemp,
            name: inputValue,
          });

          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle("Character Name: " + inputValue)
                .setColor("Green"),
            ],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("btn_char_register_cancel")
                  .setLabel("Cancel Registration")
                  .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                  .setCustomId("btn_char_register_next_0")
                  .setLabel("Confirm and Next")
                  .setStyle(ButtonStyle.Primary)
              ),
            ],
            ephemeral: true,
          });
          break;
        case "description":
          await db.set(`${interaction.user.id}_char_temp`, {
            ...charTemp,
            description: inputValue,
          });

          await interaction.update({
            embeds: [
              new EmbedBuilder()
                .setColor("Green")
                .setTitle("Character Description")
                .setDescription(inputValue),
            ],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("btn_char_register_cancel")
                  .setLabel("Cancel Registration")
                  .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                  .setCustomId("btn_char_register_next_1")
                  .setLabel("Confirm and Next")
                  .setStyle(ButtonStyle.Primary)
              ),
            ],
          });
          break;
        case "skills":
          // Verifies skills input
          const skills = inputValue.split(";").filter((_, i) => i < 5);

          const skillsEmbed = new EmbedBuilder()
            .setTitle("Character skills")
            .setDescription(
              "If you entered more than the allowed amount, then only the first 5 will be read"
            )
            .setColor("Aqua");
          skills.forEach((s, i) =>
            skillsEmbed.addFields({ name: `Skill ${i + 1}`, value: s })
          );

          await db.set(`${interaction.user.id}_char_temp`, {
            ...charTemp,
            skills: skills,
          });

          await interaction.update({
            embeds: [skillsEmbed],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("btn_char_register_cancel")
                  .setLabel("Cancel Registration")
                  .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                  .setCustomId("btn_char_register_next_2")
                  .setLabel("Confirm and Next")
                  .setStyle(ButtonStyle.Primary)
              ),
            ],
            ephemeral: true,
          });
          break;
        case "weaknesses":
          // Verifies weaknesses input
          const weakness = inputValue.split(";").filter((_, i) => i < 3);

          const weaknessEmbed = new EmbedBuilder()
            .setTitle("Character weakness")
            .setDescription(
              "If you entered more than the recommended amount, then only the first 3 will be read"
            )
            .setColor("Red");
          weakness.forEach((w, i) =>
            weaknessEmbed.addFields({ name: `Weakness ${i + 1}`, value: w })
          );

          await db.set(`${interaction.user.id}_char_temp`, {
            ...charTemp,
            weaknesses: weakness,
          });

          await interaction.update({
            embeds: [weaknessEmbed],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("btn_char_register_cancel")
                  .setLabel("Cancel Registration")
                  .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                  .setCustomId("btn_char_register_next_3")
                  .setLabel("Confirm and Next")
                  .setStyle(ButtonStyle.Primary)
              ),
            ],
            ephemeral: true,
          });
          break;
        case "skillpoints":
          // Verifies skill point allocation

          const statsStr = inputValue.split("\n").filter((_, i) => i < 6);
          const stats = {
            str: (statsStr.find((ss) => ss.includes("strength")) || "").split(
              ":"
            )[1],
            def: (statsStr.find((ss) => ss.includes("defense")) || "").split(
              ":"
            )[1],
            end: (statsStr.find((ss) => ss.includes("endurance")) || "").split(
              ":"
            )[1],
            int: (
              statsStr.find((ss) => ss.includes("intelligence")) || ""
            ).split(":")[1],
            agi: (statsStr.find((ss) => ss.includes("agility")) || "").split(
              ":"
            )[1],
            lck: (statsStr.find((ss) => ss.includes("luck")) || "").split(
              ":"
            )[1],
          };

          let invalid = false;
          let invalidMsg = "";

          let spTotal = 0;
          Object.keys(stats).forEach((stat) => {
            if (!parseInt(stats[stat])) {
              invalid = true;
              invalidMsg = `${stat} stat is required!`;
            } else spTotal += parseInt(stats[stat]);
          });

          if (!invalid) {
            if (spTotal > 24) {
              invalid = true;
              invalidMsg = "Allocated SP more than 24";
            }
          }

          if (invalid)
            return await interaction.update({
              embeds: [
                new EmbedBuilder()
                  .setColor("Red")
                  .setTitle("Invalid Input")
                  .setDescription(invalidMsg),
              ],
              components: [
                new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId("btn_char_register_cancel")
                    .setLabel("Cancel Registration")
                    .setStyle(ButtonStyle.Danger),
                  new ButtonBuilder()
                    .setCustomId("btn_char_register_next_3")
                    .setLabel("Retry")
                    .setStyle(ButtonStyle.Primary)
                ),
              ],
            });

          await db.set(`${interaction.user.id}_char_temp`, {
            ...charTemp,
            stats: stats,
          });

          const spEmbed = new EmbedBuilder()
            .setTitle("Allocated Skill Points")
            .setDescription("Confirm skill point allocation for new character")
            .addFields(
              { name: "Strength", value: stats.str ?? "N/A", inline: true },
              { name: "Defense", value: stats.def ?? "N/A", inline: true },
              { name: "Endurance", value: stats.end ?? "N/A", inline: true },
              {
                name: "Intelligence",
                value: stats.int ?? "N/A",
                inline: true,
              },
              { name: "Agility", value: stats.agi ?? "N/A", inline: true },
              { name: "Luck", value: stats.lck ?? "N/A", inline: true }
            );

          await interaction.update({
            embeds: [spEmbed],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("btn_char_register_cancel")
                  .setLabel("Cancel Registration")
                  .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                  .setCustomId("btn_char_register_next_4")
                  .setLabel("Confirm and Finish")
                  .setStyle(ButtonStyle.Primary)
              ),
            ],
            ephemeral: true,
          });

          break;
      }
    }
  },
};

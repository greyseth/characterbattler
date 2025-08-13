const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const {
  getBattles,
  editBattle,
  newId,
  removeBattle,
} = require("../../util/battles");
const { ActionRowBuilder } = require("discord.js");
const db = require("../../util/db");
const battleFlow = require("../../functions/battleFlow");
const openai = require("../../util/openai");

module.exports = {
  async battleMenuButtonHandler(interaction) {
    // Battling options
    if (interaction.customId.startsWith("btn_battle_")) {
      const battleCommand = interaction.customId.split("btn_battle_")[1];

      const targetUser = battleCommand.split("_")[0];
      const command = battleCommand.split("_")[1];
      const id = battleCommand.split("_")[2];

      if (targetUser === "any" || interaction.user.id === targetUser) {
        if (command === "accept") {
          // Looks for ongoing battles with user as second player
          const battleIndex = getBattles().findIndex(
            (b) => b.players[1].id === interaction.user.id && !b.running
          );
          if (battleIndex !== -1) {
            const selectedCharacter =
              (await db.get(`${interaction.user.id}_char_selected`)) ?? null;
            if (!selectedCharacter)
              return await interaction.reply({
                content:
                  "You don't have a character selected. Open the /charactermenu to select one.",
                ephemeral: true,
              });

            let battleData = getBattles()[battleIndex];

            battleData.id = newId();
            battleData.characters[1] = { ...selectedCharacter, health: 150 };
            battleData.running = true;

            editBattle(battleData, battleIndex);

            await interaction.update({
              content: `Battle initialized\n${battleData.players[0]} click the Start Battle button to begin`,
              embeds: [
                new EmbedBuilder()
                  .setAuthor({
                    name: `${battleData.players[0].username}'s character`,
                  })
                  .setTitle(battleData.characters[0].name)
                  .setDescription(
                    `${battleData.characters[0].description}\n\nHealth: ${battleData.characters[0].health}`
                  )
                  .setColor("Green"),
                new EmbedBuilder()
                  .setAuthor({
                    name: `${battleData.players[1].username}'s character`,
                  })
                  .setTitle(battleData.characters[1].name)
                  .setDescription(
                    `${battleData.characters[1].description}\n\nHealth: ${battleData.characters[1].health}`
                  )
                  .setColor("Green"),
                new EmbedBuilder()
                  .setTitle("Battle Setting:")
                  .setDescription(battleData.setting),
              ],
              components: [
                new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId(`btn_battle_any_cancel_${battleData.id}`)
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Danger),
                  new ButtonBuilder()
                    .setCustomId(
                      `btn_battle_${battleData.players[0].id}_start_${battleData.id}`
                    )
                    .setLabel("Start Battle")
                    .setStyle(ButtonStyle.Primary)
                ),
              ],
            });
          }
        }

        if (command === "decline") {
          const battleIndex = getBattles().findIndex(
            (b) => b.players[1].id === interaction.user.id && !b.running
          );
          if (battleIndex !== -1) {
            removeBattle(battleIndex);
            await interaction.update({
              content: "Challenge declined",
              embeds: [],
              components: [],
            });
          }
        }

        if (command === "start") {
          // Randomize who gets the first turn
          const battleIndex = getBattles().findIndex((b) => b.id === id);
          editBattle(
            { ...getBattles()[battleIndex], turn: Math.random() < 0.5 ? 0 : 1 },
            id
          );
          await battleFlow(interaction, id);
        }

        if (command === "cancel") {
          const battleIndex = getBattles().findIndex((b) => b.id == id);
          if (battleIndex !== -1) {
            removeBattle(battleIndex);
            await interaction.update({
              content: "Battle has been cancelled",
              embeds: [],
              components: [],
            });
          }
        }

        // After battle started
        if (command === "stop") {
          const battleIndex = getBattles().findIndex((b) => b.id == id);
          if (battleIndex !== -1) {
            removeBattle(battleIndex);
            await interaction.update({
              content: `Battle has been stopped by ${interaction.member.displayName}`,
              embeds: [],
              components: [],
            });
          }
        }

        if (command === "move") {
          const modal = new ModalBuilder()
            .setCustomId("modal_battle_move_" + id)
            .setTitle("Perform move");
          const input = new TextInputBuilder()
            .setCustomId("input_move")
            .setLabel("Move Input")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder(
              "Describe your next move, will be affected by a d20 roll"
            )
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder().addComponents(input));
          await interaction.showModal(modal);
        }
      } else
        await interaction.reply({
          content: "You are not permitted to perform this action",
          ephemeral: true,
        });
    }
  },

  async battleModalHandler(interaction) {
    if (interaction.customId.startsWith("modal_battle_move_")) {
      await interaction.deferReply();

      const moveInput = interaction.fields.getTextInputValue(`input_move`);

      const battleId = interaction.customId.split("modal_battle_move_")[1];
      const battleIndex = getBattles().findIndex((b) => b.id == battleId);
      const ogBattle = getBattles()[battleIndex];

      try {
        const stringifyChar = (char) =>
          JSON.stringify(char)
            .replace("{", "")
            .replace("}", "")
            .replace(`"`, "");

        const diceRoll = Math.floor(Math.random() * 21);

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `
                You're a dungeonmaster for a battle between 2 player characters who are fighting each other. You take into account both characters' stats, abilities, states, setting, and the d20 roll to determine the outcome of the action they take. 
                You determine the outcome of the move based on the aforementioned properties. 
                If it's an offensive move, you add "damage taken:(number)" after describing the outcome, and make it balanced where each character starts off with 200 health points, and a successful attack should deal from a range of 5-50 damage depending on the amount rolled, the severity of the attack, as well as both character's respecitve stats.
                If there's a healing move, you add "health regen:(number)" after describing the outcome, and also make it balanced where characters can't regenerate health too much. If not, don't include "health regen."
                If a character's move leads to them taking damage, you add "self damage: (number)" after describing the outcome and possible damage to opponent. If not, don't include "self damage."
                You'll also be adding/removing states that can affect future moves (example: character is trapped, character is hidden, character has broken limb, etc) DO NOT re-specify the characters' health in states. If the states remain the same as the previous turn, then you copy paste the previous states the new outcome. 
                If a character performs a powerful energy-draining move, then add a state indicating their fatigue preventing them from using the same powerful move in the next turn.
                If a character does something that seems impossible after considering the states, the setting, and their abilities, you'll respond with "INVALID ACTION", repeat the latest states, and provide the reasoning for it. NOT used to indicate a failed but possible move.
                You can also use the battle setting to create some unexpected twists and variables.
                You'll simply respond with the outcome, states, and the damage taken (without specifying the remaining health or character stats), no need to add any extra descriptions.
              `,
            },
            {
              role: "assistant",
              content: "Character 1:\n" + stringifyChar(ogBattle.characters[0]),
            },
            {
              role: "assistant",
              content: "Character 2:\n" + stringifyChar(ogBattle.characters[1]),
            },
            {
              role: "assistant",
              content: `Battle setting:\n${ogBattle.setting}`,
            },
            {
              role: "assistant",
              content: `Previous action:\n${
                ogBattle.lastOutcome ?? "None yet"
              }`,
            },
            {
              role: "user",
              content: `${
                ogBattle.characters[ogBattle.turn].name
              } move turn:\n${moveInput}`,
            },
            {
              role: "user",
              content: `Dice roll: ${diceRoll}`,
            },
          ],
          max_completion_tokens: 6000,
        });

        let outcome = completion.choices[0].message.content;

        let damage = 0;
        if (outcome.toLowerCase().includes("damage taken")) {
          damage =
            parseInt(outcome.toLowerCase().split("damage taken:")[1]) ?? 0;
        }

        let selfDamage = 0;
        if (outcome.toLowerCase().includes("self damage:"))
          selfDamage =
            parseInt(outcome.toLowerCase().split("self damage:")[1]) ?? 0;

        let healthRegen = 0;
        if (outcome.toLowerCase().includes("health regen:"))
          healthRegen =
            parseInt(outcome.toLowerCase().split("health regen:")[1]) ?? 0;

        ogBattle.characters[ogBattle.turn].health -= selfDamage;
        ogBattle.characters[ogBattle.turn].health += healthRegen;

        let randomCrit = Math.floor(Math.random() * 21);
        // + ogBattle.characters[ogBattle.turn].stats.lck -
        // 10;
        if (damage > 0) damage += randomCrit;

        let newTurn = ogBattle.turn;
        if (!outcome.toLowerCase().includes("INVALID ACTION"))
          newTurn = ogBattle.turn === 0 ? 1 : 0;

        ogBattle.characters[ogBattle.turn === 0 ? 1 : 0].health -= damage;
        editBattle(
          {
            ...ogBattle,
            turn: newTurn,
            lastOutcome: outcome,
          },
          battleIndex
        );

        await battleFlow(
          interaction,
          battleId,
          `${moveInput}\n\nDice roll: ${diceRoll}\n\n${outcome}${
            damage > 0 ? `\nDamage modifier: ${randomCrit}` : ""
          }`
        );
      } catch (err) {
        console.log(err);
        await interaction.editReply({
          content: "An error has occurred. Please try again.",
        });
      }
    }
  },
};

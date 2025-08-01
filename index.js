const fs = require("node:fs");
const path = require("path");

const {
  Client,
  Events,
  GatewayIntentBits,
  Collection,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const { token, secret } = require("./config.json");
const {
  mainMenuButtonHandler,
  characterListButtonHandler,
  characterRegistrationButtonHandler,
} = require("./handlers/charactermenu/mainmenu");
const {
  characterListModals,
  characterRegistrationModals,
} = require("./handlers/charactermenu/menumodals");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

// Slash command handler
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

// Button handlers
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  await mainMenuButtonHandler(interaction);
  await characterListButtonHandler(interaction);
  await characterRegistrationButtonHandler(interaction);
});

// Modal submit handlers
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  await characterListModals(interaction);
  await characterRegistrationModals(interaction);
});

client.once(Events.ClientReady, (readyClient) => {
  console.log("CharacterBattler is online");
});

client.login(token);

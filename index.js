/* License is GPL 3.0.
- made by studio moremi
 - support@studio-moremi.kro.kr
*/
require("dotenv").config();
const { Client, IntentsBitField } = require("discord.js");
const { CommandHandler } = require("djs-commander");
const path = require("path");

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

new CommandHandler({
  client,
  commandsPath: path.join(__dirname, "commands"),
  utilsPath: path.join (__dirname, "utils"),
});

client.on("ready", (c) => {
  console.log(`bot is online!`);
});

client.login(process.env.TOKEN);

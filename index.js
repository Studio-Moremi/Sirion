const { Client, Intents } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const prefix = 'ㅅ';
client.commands = new Map();

const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'commands', file));
    client.commands.set(command.data.name, command);
}

client.once('ready', () => {
    console.log('Bot is online!');
});

function logError(error) {
    const logDir = path.join(__dirname, 'log');
    const logFile = path.join(logDir, 'SIRION_ERROR.log');

    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${error.stack || error}\n`;

    fs.appendFileSync(logFile, logMessage, 'utf8');
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        logError(error, 'SIRION_COMMAND_ERROR.log');
        await interaction.reply({ content: '❗ 오류 발생❗\n오류가 발생했어요. 이 오류가 지속되면 스튜디오 모레미 시리온팀에 문의하세요.', ephemeral: true });
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.execute({
            user: message.author,
            channel: message.channel,
            reply: options => {
                if (options && options.content) {
                    message.channel.send(options.content);
                }
            },
            args,
        });
    } catch (error) {
        console.error(error);
        logError(error, 'SIRION_COMMAND_ERROR.log');
        message.channel.send('❗ 오류 발생❗\n오류가 발생했어요. 이 오류가 지속되면 스튜디오 모레미 시리온팀에 문의하세요.');
    }
});

process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
    logError(error, 'SIRION_ERROR.log');
});

process.on('unhandledRejection', reason => {
    console.error('Unhandled Rejection:', reason);
    logError(reason, 'SIRION_ERROR.log');
});

client.login(process.env.TOKEN);

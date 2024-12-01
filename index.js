const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const prefix = 'ㅅ';
client.commands = new Map();

const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'commands', file));
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

(async () => {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID), // CLIENT_ID는 .env에 추가
            { body: commands }
        );
        console.log(`[시스템] 커맨드 ${commands.length}개 로딩 완료.`);
        console.log(`[시스템] 커맨드 ${commands.length}개 추가 완료.`);
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
})();

client.once('ready', async () => {
    try {
        if (!client.guilds) {
            throw new Error('client.guilds is undefined');
        }

        const guilds = await client.guilds.fetch();
        console.log(`Fetched guilds: ${guilds.size}개`);
        const users = new Set();

        for (const guild of guilds.values()) {
            console.log(`Fetching members for guild: ${guild.name}`);
            try {
                const members = await guild.members.fetch();
                members.each(member => {
                    if (!member.user.bot) users.add(member.user.id);
                });
            } catch (guildError) {
                console.error(`서버 ${guild.name}의 멤버 정보를 가져오는 데 실패했습니다:`, guildError);
                logError(guildError, 'SIRION_GUILD_ERROR.log');
            }
        }

        console.log(`[시스템] 봇 온라인.`);
        console.log(`[시스템] 현재 ${guilds.size}개의 서버가 봇 추가.`);
        console.log(`[시스템] 현재 ${users.size}명이 시리온을 이용.`);
    } catch (error) {
        console.error('서버 및 사용자 정보 조회 오류:', error);
        logError(error, 'SIRION_ERROR.log');
    }
});


function logError(error, logFileName = 'SIRION_ERROR.log') {
    const logDir = path.join(__dirname, 'log');
    const logFile = path.join(logDir, logFileName);

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

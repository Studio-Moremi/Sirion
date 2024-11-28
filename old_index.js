/* License is GPL 3.0.
- made by studio moremi
 - op@kkutu.store
*/
/*
이 파일은 이전 버전의 index.js를 보여줍니다.
현재 버전: 1.0.0
*/
const { Client, Intents } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

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

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
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
            reply: options => message.channel.send(options.content || '명령어 실행 완료!'),
            args,
        });
    } catch (error) {
        console.error(error);
        message.channel.send('❗ 오류 발생❗\n오류가 발생했어요. 이 오류가 지속되면 스튜디오 모레미 시리온팀에 문의하세요.');
    }
});

client.login(process.env.DISCORD_TOKEN);

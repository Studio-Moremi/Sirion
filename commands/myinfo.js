/* License is GPL 3.0.
- made by studio moremi
 - op@kkutu.store
*/
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const db = require('../utils/db');
const { getLevelInfo } = require('../utils/level');
const LANG = require('../language.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('내정보')
        .setDescription(LANG.myinfo),
    async execute(interaction) {
        const userId = interaction.user.id;
        const username = interaction.user.username;
        const avatarUrl = interaction.user.displayAvatarURL({ dynamic: true, size: 512 });

        try {
            const userInfo = await db.get('SELECT experience, coins FROM users WHERE user_id = ?', [userId]);

            if (!userInfo) {
                return interaction.reply({ content: '아직 등록되지 않은 사용자입니다. 먼저 가입을 진행해주세요!', ephemeral: true });
            }

            const { level, currentExp, nextLevelExp } = getLevelInfo(userInfo.experience);
            const coins = userInfo.coins;

            const embed = new EmbedBuilder()
                .setColor('#00BFFF')
                .setTitle(`${username}의 정보`)
                .setThumbnail(avatarUrl)
                .setDescription(`${username}님의 정보에요.`)
                .addFields(
                    { name: '레벨', value: `${level} (${currentExp}/${nextLevelExp})`, inline: true },
                    { name: `${username}님의 코인`, value: `${coins} 코인`, inline: true }
                )
                .setTimestamp()
                .setFooter(`by ${username}`);

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching user info:', error);
            interaction.reply({ content: LANG.infoerror, ephemeral: true });
        }
    },
};

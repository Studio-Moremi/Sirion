/* License is GPL 3.0.
- made by studio moremi
 - op@kkutu.store
*/
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const db = require('../utils/db');
const fishList = require('../utils/fishlist');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fish')
        .setDescription('Catch a fish!'),
    async execute(interaction) {
        const gradeProbabilities = {
            1: 0.01,
            2: 0.05,
            3: 0.1,
            4: 0.2,
            5: 0.64,
        };

        const weightedFishList = fishList.flatMap(fish =>
            Array(Math.round(gradeProbabilities[fish.grade] * 100)).fill(fish)
        );

        const caughtFish = weightedFishList[Math.floor(Math.random() * weightedFishList.length)];

        const embed = new MessageEmbed()
            .setColor('#FFFFFF')
            .setTitle('물고기를 잡았어요! 🐟')
            .setDescription(`${interaction.user.username}님이 **${caughtFish.name}**을 잡았어요!`)
            .addFields(
                { name: '등급', value: `${caughtFish.grade}등급`, inline: true },
                { name: '가치', value: `${caughtFish.value}원`, inline: true }
            )
            .setTimestamp()
            .setFooter('낚시 게임');

        await db.run(
            `INSERT INTO catches (user_id, fish, grade, value) VALUES (?, ?, ?, ?)`,
            [interaction.user.id, caughtFish.name, caughtFish.grade, caughtFish.value]
        );

        await interaction.reply({ embeds: [embed] });
    },
};

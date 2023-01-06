const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loselp')
        .setDescription('Plays life point sound'),

    async execute(interaction){
        await interaction.reply();
    },
};
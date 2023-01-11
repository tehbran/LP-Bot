const { SlashCommandBuilder } = require('discord.js');
const { soundPlayer } = require('../soundPlayer.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('loselp')
        .setDescription('Plays life point sound'),

    async execute(interaction){
        //calls the soundPlayer function instead of handling voiceConnection/audioPlayer/audioResource itself
        soundPlayer('sounds/lpsound.ogg', interaction);

        //Replies with 'taking damage' ephemerally so it doesn't flood the chat for now
        await interaction.reply({ content: 'Taking damage', ephemeral: true });
        
        //TODO: implement database of users who have taken damage
        //TODO: implement a chat reaction vote to confirm that a user will take damage
        //TODO: implement an @mention arg to designate a user to take damage
    },
}; 
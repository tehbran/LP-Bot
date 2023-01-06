const { SlashCommandBuilder } = require('discord.js');
const { createAudioPlayer, joinVoiceChannel, NoSubscriberBehavior, VoiceConnectionStatus, AudioPlayerStatus, entersState, AudioPlayerStatus } = require('@discordjs/voice');



module.exports = {
    data: new SlashCommandBuilder()
        .setName('loselp')
        .setDescription('Plays life point sound'),

    async execute(interaction){
        await interaction.reply();
        const connection = getVoiceConnection(myVoiceChannel.guild.id);
        const subscription = connection.subscribe(audioPlayer);

        if (subscription) {
            setTimeout(() => subscription.unsubscribe(), 5_000);
        }

        connection.on(VoiceConnectionStatus.Ready, (oldState, newState) => {
            console.log('Connection is in the Ready state!');
        });

        connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
            try{
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
            } catch (error) {
                connection.destroy();
            }
        })

        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Stop,
            },
        });

        const resource = createAudioResource('./sounds/loselp.wav', {
            metadata: {
                title: 'Life Point Loss',
            },
            
        }, { inlineVolume: true });
        resource.volume.setVolume(0.4);
        player.play(resource);

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
            player.play(getNextResource());
        });

        player.on(AudioPlayerStatus.Playing, () => {
            console.log('The audio player has started playing!');
        });
        
        player.on(AudioPlayerStatus.Idle, () => {
            player.play(getNextResource());
        });

        connection.subscribe(player);

        player.stop();
        connection.destroy();
    },

   
    
    player.on
};
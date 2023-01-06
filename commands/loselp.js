const { SlashCommandBuilder } = require('discord.js');
const { StreamType, createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior, VoiceConnectionStatus, entersState, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const { createReadStream } = require('node:fs');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('loselp')
        .setDescription('Plays life point sound'),

    async execute(interaction){
        const player = createAudioPlayer({
            behaviors: {
            },
        });
        console.log(interaction.voice);
        
        const resource = createAudioResource(createReadStream('./sounds/lpsound.ogg'), {
            inputType: StreamType.OggOpus,
            metadata: {
                title: 'Life Point Loss',
            },
        });

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
        });

        player.on(AudioPlayerStatus.Playing, () => {
            console.log('The audio player has started playing!');
        });

        const channel = interaction.member.voice.channel;
        if(!channel) return interaction.channel.send('Please join a Voice Channel first');

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });
        
        connection.on('error', error => {
            console.error(`${error.message}`);
        });

        player.play(resource);
        connection.subscribe(player);

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
        
        /*
        player.on(AudioPlayerStatus.Idle, () => {
            player.play(getNextResource());
        });*/

        player.stop();
        connection.destroy();
    },
};
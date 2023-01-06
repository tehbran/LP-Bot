const { SlashCommandBuilder } = require('discord.js');
const { StreamType, createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior, VoiceConnectionStatus, entersState, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const { createReadStream } = require('node:fs');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('loselp')
        .setDescription('Plays life point sound'),

    async execute(interaction){
        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channelId,
            guildId: interaction.member.guild.id,
            adapterCreator: interaction.member.voice.guild.voiceAdapterCreator,
        });

        connection.on('error', error => {
            console.error(`${error.message}`);
        });

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
        
        const resource = createAudioResource(createReadStream('sounds/lpsound.ogg'), {
            inputType: StreamType.OggOpus,
            metadata: {
                title: 'Life Point Loss',
            },
        });
        player.play(resource);

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
        });

        player.on(AudioPlayerStatus.Playing, () => {
            console.log('The audio player has started playing!');
        });
        
        /*
        player.on(AudioPlayerStatus.Idle, () => {
            player.play(getNextResource());
        });*/

        connection.subscribe(player);

        player.stop();
        connection.destroy();
    },
};
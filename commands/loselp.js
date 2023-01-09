const { SlashCommandBuilder } = require('discord.js');
const { StreamType, createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior, VoiceConnectionStatus, entersState, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const { createReadStream } = require('node:fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loselp')
        .setDescription('Plays life point sound'),

    async execute(interaction){

        const channel = interaction.member.voice.channel;
        if(!channel) return interaction.channel.send('Please join a Voice Channel first');

        const voiceConnection = joinVoiceChannel({
            channelId: channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        voiceConnection.on('stateChange', (oldState, newState) => {
            console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);
        });

        voiceConnection.on(VoiceConnectionStatus.Ready, (oldState, newState) => {
            console.log('Connection is in the Ready state!');
        });

        voiceConnection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
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
                NoSubscriber: NoSubscriberBehavior.Stop,
            },
        });

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
        });

        player.on('stateChange', (oldState, newState) => {
            console.log(`Audio player transitioned from ${oldState.status} to ${newState.status}`);
        });

        player.on(AudioPlayerStatus.Idle, async (oldState, newState) => {
            try{
                await Promise.race([
                    entersState(connection, AudioPlayerStatus.Playing, 30_000),
                ]);
            } catch (error) {
                player.stop();
            }
        });

        const resource = createAudioResource(createReadStream('sounds/lpsound.ogg', {
            inputType: StreamType.OggOpus,
        }));

        voiceConnection.subscribe(player);
        player.play(resource);
        //await interaction.reply('Taking damage');
        
        /*player.on(AudioPlayerStatus.Idle, () => {
            player.play(getNextResource());
        });*/
    },
}; 
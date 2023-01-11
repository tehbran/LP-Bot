const { StreamType, createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior, VoiceConnectionStatus, entersState, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const { createReadStream } = require('node:fs');

//sound is the path to the voice file
//interaction is the interaction generated by a slash command
//vol is the desired inlineVolume IF ffmpeg is to be used
async function soundPlayer(sound, interaction, vol = 0.2){

    //Checks if the user issuing the command is in a Voice Channel
    if(!interaction.member.voice.channel) return interaction.channel.send('Please join a Voice Channel first');

    //Creates a voice connection
    const connection = joinVoiceChannel({
        channelId: interaction.member.voice.channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    //Signals when the voice channel is changing states
    connection.on('stateChange', (oldState, newState) => {
        console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);
    });

    //Times out the voice connection if it stays disconnected too long
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

    //Creates an Audio Player that stops itself if no one is in the voice channel
    const player = createAudioPlayer({
        behaviors: {
            NoSubscriber: NoSubscriberBehavior.Stop,
        },
    });

    //Checks if there is something wrong with the audio resource
    player.on('error', error => {
        console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
    });

    //Signals when the audio player is switching states
    player.on('stateChange', (oldState, newState) => {
        console.log(`Audio player transitioned from ${oldState.status} to ${newState.status}`);
    });

    //If the AudioPlayer isn't playing anything, it will destroy the player and connection
    player.on(AudioPlayerStatus.Idle || AudioPlayerStatus.AutoPaused, async (oldState, newState) => {
        try{
            await Promise.race([
                entersState(connection, AudioPlayerStatus.Playing, 30_000),
            ]);
        } catch (error) {
            player.stop();
            connection.destroy();
        }
    });

    //If the AudioPlayer is manually paused, it will take longer to timeout
    player.on(AudioPlayerStatus.Paused, async (oldState, newState) => {
        try{
            await Promise.race([
                entersState(connection, AudioPlayerStatus.Playing, 90_000),
            ]);
        } catch (error) {
            player.stop();
            connection.destroy();
        }
    });

    //Checks if the file is ogg, if so it will play using the Opus stream, else ffmpeg
    resource = null;
    switch ( sound.split('.').pop() ){
        case "ogg":
            resource = createAudioResource(createReadStream(sound, {
                inputType: StreamType.OggOpus,
        }));
        default:
        {
            resource = createAudioResource(sound, { inlineVolume: true} );
            resource.volume.setVolume(vol);
        }
    }

    //Logs the user that issued the command
    console.log(interaction.member.displayName);

    //Subscribes the player to a connection and begins playback
    connection.subscribe(player);
    player.play(resource);
};

//Allows other files to import the function
module.exports = {soundPlayer};
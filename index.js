const fs = require('node:fs');
const { Client, Collection, Events, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const { VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('node:path');

//Edit config_template.json and rename it or change this for the bot's login credentials
const { token } = require('./config.json');

//Generates permissions for the bot
const client = new Client({ 
    intents: [ 
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
     ]
     });

//Generates a list of commands the bot will listen for, with their filepaths
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

//Makes sure the slash commands are actually slash commands
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
    }
}

//Confirms that bot is ready to handle Events
client.once(Events.ClientReady, c=> {
    console.log(`Ready! logged in as ${c.user.tag}`);
});

//Event handle for commands
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error){
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true});
    }
});

//Always put at the end, logs the bot into Discord
client.login(token);

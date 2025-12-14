require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Load command files
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = [];
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
    // Prepare for registration
    commands.push({
        name: command.name,
        description: command.description,
        guildOnly: command.guildOnly || false,
    });
}

// Register slash commands for guild
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
            { body: commands }
        );
        console.log('Slash commands registered!');
    } catch (error) {
        console.error(error);
    }
});

// Handle interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error executing that command!', ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);

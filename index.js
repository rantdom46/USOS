require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes
} = require('discord.js');

/* =====================
   EXPRESS (Render keep-alive)
===================== */
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_, res) => res.send('USOS bot alive'));
app.listen(PORT, () =>
  console.log(`🌐 Webserver running on port ${PORT}`)
);

/* =====================
   DISCORD CLIENT
===================== */
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();
const commands = [];

/* =====================
   LOAD COMMANDS
===================== */
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    if (!command.data || !command.data.name) {
      console.warn(`⚠️ Invalid command file: ${file}`);
      continue;
    }

    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }
}

/* =====================
   SLASH COMMAND REGISTER
===================== */
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log('🔁 Registering GUILD slash commands...');

  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.APP_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log('✅ Guild slash commands registered');
  } catch (err) {
    console.error('❌ Slash command registration failed:', err);
  }

  /* =====================
     ANNOUNCEMENT SYSTEM HOOK
     (Logic remains in announcement.js)
  ====================== */
  try {
    const announcementCommand = require('./commands/announcement');
    announcementCommand.execute(client); // starts random interval announcements
    console.log('📢 Announcement system initialized');
  } catch (err) {
    console.error('❌ Failed to start announcement system:', err);
  }
});

/* =====================
   INTERACTION HANDLER
===================== */
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: '❌ Error executing command.',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: '❌ Error executing command.',
        ephemeral: true
      });
    }
  }
});

/* =====================
   LOGIN
===================== */
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('🤖 Discord login success'))
  .catch(err => {
    console.error('❌ Discord login failed:', err);
    process.exit(1);
  });

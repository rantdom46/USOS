const fs = require('fs');
const path = require('path');
const { generateSquadName } = require('../namehelper');
const { SlashCommandBuilder } = require('discord.js');

// === CONFIG ===
const ANNOUNCEMENTS_FILE = path.join(__dirname, '..', 'announcements.json');
const ANNOUNCEMENT_CHANNEL_ID = '1449788145942925312';
const MIN_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours
const MAX_INTERVAL = 5 * 60 * 60 * 1000; // 5 hours

// === STATE ===
let enabled = false;

// === HELPERS ===
function loadAnnouncements() {
  if (!fs.existsSync(ANNOUNCEMENTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(ANNOUNCEMENTS_FILE, 'utf8'));
  } catch (err) {
    console.error('Failed to load announcements.json:', err);
    return [];
  }
}

function getRandomAnnouncement(announcements) {
  if (!announcements.length) return null;
  let announcement = announcements[Math.floor(Math.random() * announcements.length)];
  if (announcement.includes("{squad}")) {
    announcement = announcement.replace("{squad}", generateSquadName());
  }
  return announcement;
}

function scheduleNext(client, announcements) {
  if (!enabled) return;

  const interval = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
  setTimeout(async () => {
    if (!enabled) return;

    const announcement = getRandomAnnouncement(announcements);
    if (announcement) {
      try {
        const channel = await client.channels.fetch(ANNOUNCEMENT_CHANNEL_ID);
        if (channel?.isTextBased()) {
          await channel.send(announcement);
          console.log(`📢 Posted announcement: ${announcement}`);
        }
      } catch (err) {
        console.error('Failed to send announcement:', err);
      }
    }

    scheduleNext(client, announcements); // reschedule
  }, interval);
}

function startLoop(client) {
  const announcements = loadAnnouncements();
  if (!announcements.length) {
    console.warn('No announcements found in announcements.json!');
    return;
  }
  console.log(`🚀 Starting announcements loop (${announcements.length} messages)`);
  scheduleNext(client, announcements);

  // Post immediately on start
  const first = getRandomAnnouncement(announcements);
  if (first) {
    client.channels.fetch(ANNOUNCEMENT_CHANNEL_ID)
      .then(ch => ch?.isTextBased() && ch.send(first))
      .catch(err => console.error('Failed to send first announcement:', err));
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announcement')
    .setDescription('Enable or disable automatic announcements')
    .addStringOption(option =>
      option
        .setName('action')
        .setDescription('Enable or disable the announcements')
        .setRequired(true)
        .addChoices(
          { name: 'enable', value: 'enable' },
          { name: 'disable', value: 'disable' }
        )
    ),
  
  async execute(interaction, client) {
    const action = interaction.options.getString('action');
    if (action === 'enable') {
      enabled = true;
      startLoop(client);
      await interaction.reply({ content: '✅ Announcements enabled.', ephemeral: true });
    } else if (action === 'disable') {
      enabled = false;
      await interaction.reply({ content: '❌ Announcements disabled.', ephemeral: true });
    } else {
      await interaction.reply({ content: '⚠️ Unknown action.', ephemeral: true });
    }
  }
};

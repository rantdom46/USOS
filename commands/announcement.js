const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const { generateSquadName } = require('../namehelper');

// === CONFIG ===
const ANNOUNCEMENTS_FILE = path.join(__dirname, '..', 'announcements.json');
const ANNOUNCEMENT_CHANNEL_ID = '1449788145942925312'; // channel ID
const MIN_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours
const MAX_INTERVAL = 5 * 60 * 60 * 1000; // 5 hours

// === STATE ===
let enabled = true;
let announcementsLoopStarted = false;

// Load announcements from JSON
function loadAnnouncements() {
  if (!fs.existsSync(ANNOUNCEMENTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(ANNOUNCEMENTS_FILE, 'utf8'));
  } catch (err) {
    console.error('Failed to load announcements.json:', err);
    return [];
  }
}

// Pick a random announcement
function getRandomAnnouncement(announcements) {
  if (!announcements.length) return null;
  const idx = Math.floor(Math.random() * announcements.length);
  let announcement = announcements[idx];

  // Optionally append a squad name
  if (announcement.includes("{squad}")) {
    announcement = announcement.replace("{squad}", generateSquadName());
  }

  return announcement;
}

// Schedule the next announcement
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
        } else {
          console.warn('Announcement channel is not text-based!');
        }
      } catch (err) {
        console.error('Failed to send announcement:', err);
      }
    }

    scheduleNext(client, announcements);
  }, interval);
}

// Start announcements loop if not already started
function startLoop(client) {
  if (announcementsLoopStarted) return;

  const announcements = loadAnnouncements();
  if (!announcements.length) {
    console.warn('No announcements found in announcements.json!');
    return;
  }

  console.log(`🚀 Starting announcements loop (${announcements.length} messages)`);

  // Post one immediately on startup
  const first = getRandomAnnouncement(announcements);
  if (first) {
    client.channels.fetch(ANNOUNCEMENT_CHANNEL_ID)
      .then(channel => {
        if (channel?.isTextBased()) channel.send(first);
        console.log(`📢 First announcement: ${first}`);
      })
      .catch(err => console.error('Failed to send first announcement:', err));
  }

  announcementsLoopStarted = true;
  scheduleNext(client, announcements);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announcement')
    .setDescription('Control the automated announcement system')
    .addSubcommand(sub =>
      sub.setName('enable')
         .setDescription('Enable announcements'))
    .addSubcommand(sub =>
      sub.setName('disable')
         .setDescription('Disable announcements')),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'enable') {
      enabled = true;
      startLoop(client);
      await interaction.reply({ content: '✅ Announcements enabled.', ephemeral: true });
    } else if (subcommand === 'disable') {
      enabled = false;
      await interaction.reply({ content: '❌ Announcements disabled.', ephemeral: true });
    }
  },

  // Automatically start loop on bot startup
  start(client) {
    startLoop(client);
  }
};

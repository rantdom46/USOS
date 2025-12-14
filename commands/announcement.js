const fs = require('fs');
const path = require('path');
const { generateSquadName } = require('./namehelper'); // import squad generator

// === CONFIG ===
const ANNOUNCEMENTS_FILE = path.join(__dirname, '..', 'announcements.json'); 
const ANNOUNCEMENT_CHANNEL_ID = '1449788145942925312'; // channel ID
const MIN_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours
const MAX_INTERVAL = 5 * 60 * 60 * 1000; // 5 hours

// === STATE ===
let enabled = true; // start announcements enabled

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
  if (!enabled) return; // stop if disabled

  const interval = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
  setTimeout(async () => {
    if (!enabled) return; // check again

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

    scheduleNext(client, announcements); // reschedule
  }, interval);
}

module.exports = {
  name: 'announcement',
  description: 'Automatically posts announcements at random intervals',
  guildOnly: true,
  
  execute(client) {
    const announcements = loadAnnouncements();
    if (!announcements.length) {
      console.warn('No announcements found in announcements.json!');
      return;
    }

    console.log(`🚀 Starting announcements loop (${announcements.length} messages)`);
    scheduleNext(client, announcements);
  },

  // Commands to toggle announcements
  enable() {
    enabled = true;
    console.log('✅ Announcements enabled');
  },

  disable() {
    enabled = false;
    console.log('❌ Announcements disabled');
  },
};

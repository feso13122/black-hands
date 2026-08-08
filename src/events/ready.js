const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client, GatewayIntentBits, Partials, Collection, ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Eingeloggt als ${client.user.tag}`);
    // Presence setzen
    client.user.setPresence({
        activities: [{
            name: 'Black Hands System By NXMZ Feso',
            type: ActivityType.Streaming,
            url: 'https://www.twitch.tv/the_offical_feso2'
        }],
        status: 'online',
    });
  }
};

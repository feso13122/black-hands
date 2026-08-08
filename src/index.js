const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');

if (!process.env.BOT_TOKEN) {
  console.error('❌ Bitte trage deinen Bot-Token als BOT_TOKEN in die .env-Datei ein, bevor du den Bot startest.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User]
});

client.commands = new Collection();

// Commands laden
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
  }
}

// Events laden
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

client.login(process.env.BOT_TOKEN);

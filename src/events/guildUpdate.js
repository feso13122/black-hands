const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildUpdate',
  async execute(oldGuild, newGuild) {
    const changes = [];
    if (oldGuild.name !== newGuild.name) {
      changes.push({ name: 'Servername', value: `${oldGuild.name} → ${newGuild.name}`, inline: false });
    }
    if (oldGuild.iconURL() !== newGuild.iconURL()) {
      changes.push({ name: 'Server-Icon', value: 'Geändert', inline: false });
    }
    if (oldGuild.description !== newGuild.description) {
      changes.push({
        name: 'Beschreibung',
        value: `${oldGuild.description || '*Keine*'} → ${newGuild.description || '*Keine*'}`.slice(0, 1024),
        inline: false
      });
    }

    if (changes.length === 0) return;

    const embed = baseEmbed(newGuild.client)
      .setColor('#FEE75C')
      .setTitle('🔧 Servereinstellungen geändert')
      .addFields(...changes);

    await sendLog(newGuild.client, embed);
  }
};

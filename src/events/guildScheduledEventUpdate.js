const { baseEmbed } = require('../utils/embeds');
const { sendCategoryLog } = require('../utils/logger');

module.exports = {
  name: 'guildScheduledEventUpdate',
  async execute(oldEvent, newEvent) {
    const changes = [];
    if (oldEvent.name !== newEvent.name) {
      changes.push({ name: 'Name', value: `${oldEvent.name} → ${newEvent.name}`, inline: false });
    }
    if (oldEvent.scheduledStartTimestamp !== newEvent.scheduledStartTimestamp) {
      changes.push({
        name: 'Start',
        value: newEvent.scheduledStartAt ? `<t:${Math.floor(newEvent.scheduledStartAt.getTime() / 1000)}:f>` : 'Unbekannt',
        inline: false
      });
    }
    if (oldEvent.status !== newEvent.status) {
      changes.push({ name: 'Status', value: `${oldEvent.status} → ${newEvent.status}`, inline: false });
    }

    if (changes.length === 0) return;

    const embed = baseEmbed(newEvent.client)
      .setColor('#FEE75C')
      .setTitle('🔧 Server-Event bearbeitet')
      .addFields(...changes);

    await sendCategoryLog(newEvent.client, 'logEventUpdate', embed);
  }
};

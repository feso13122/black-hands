const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildScheduledEventCreate',
  async execute(event) {
    const embed = baseEmbed(event.client)
      .setColor('#57F287')
      .setTitle('📅 Server-Event erstellt')
      .addFields(
        { name: 'Name', value: `${event.name}`, inline: true },
        { name: 'Start', value: event.scheduledStartAt ? `<t:${Math.floor(event.scheduledStartAt.getTime() / 1000)}:f>` : 'Unbekannt', inline: true }
      );

    await sendLog(event.client, embed);
  }
};

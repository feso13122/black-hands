const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildScheduledEventDelete',
  async execute(event) {
    const embed = baseEmbed(event.client)
      .setColor('#ED4245')
      .setTitle('📅 Server-Event gelöscht')
      .addFields({ name: 'Name', value: `${event.name}`, inline: false });

    await sendLog(event.client, embed);
  }
};

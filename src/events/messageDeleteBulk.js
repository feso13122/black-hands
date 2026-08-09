const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'messageDeleteBulk',
  async execute(messages, channel) {
    if (!channel.guild) return;

    const embed = baseEmbed(channel.client)
      .setColor('#ED4245')
      .setTitle('🗑️ Nachrichten massenhaft gelöscht')
      .addFields(
        { name: 'Channel', value: `${channel}`, inline: true },
        { name: 'Anzahl', value: `${messages.size}`, inline: true }
      );

    await sendLog(channel.client, embed);
  }
};

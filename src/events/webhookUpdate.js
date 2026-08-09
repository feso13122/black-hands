const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'webhookUpdate',
  async execute(channel) {
    const embed = baseEmbed(channel.client)
      .setColor('#FEE75C')
      .setTitle('🔧 Webhooks geändert')
      .addFields({ name: 'Channel', value: `${channel}`, inline: false });

    await sendLog(channel.client, embed);
  }
};

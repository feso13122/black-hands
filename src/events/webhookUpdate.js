const { baseEmbed } = require('../utils/embeds');
const { sendCategoryLog } = require('../utils/logger');

module.exports = {
  name: 'webhookUpdate',
  async execute(channel) {
    const embed = baseEmbed(channel.client)
      .setColor('#FEE75C')
      .setTitle('🔧 Webhooks geändert')
      .addFields({ name: 'Channel', value: `${channel}`, inline: false });

    await sendCategoryLog(channel.client, 'logWebhookUpdate', embed);
  }
};

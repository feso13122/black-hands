const { ChannelType } = require('discord.js');
const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'channelDelete',
  async execute(channel) {
    if (!channel.guild) return;

    const embed = baseEmbed(channel.client)
      .setColor('#ED4245')
      .setTitle('➖ Channel gelöscht')
      .addFields(
        { name: 'Name', value: `#${channel.name}`, inline: true },
        { name: 'Typ', value: ChannelType[channel.type] || `${channel.type}`, inline: true },
        { name: 'ID', value: `${channel.id}`, inline: true }
      );

    await sendLog(channel.client, embed);
  }
};

const { ChannelType } = require('discord.js');
const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'channelCreate',
  async execute(channel) {
    if (!channel.guild) return;

    const embed = baseEmbed(channel.client)
      .setColor('#57F287')
      .setTitle('➕ Channel erstellt')
      .addFields(
        { name: 'Name', value: `${channel}`, inline: true },
        { name: 'Typ', value: ChannelType[channel.type] || `${channel.type}`, inline: true },
        { name: 'ID', value: `${channel.id}`, inline: true }
      );

    await sendLog(channel.client, embed);
  }
};

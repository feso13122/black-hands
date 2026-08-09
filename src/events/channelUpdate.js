const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'channelUpdate',
  async execute(oldChannel, newChannel) {
    if (!newChannel.guild) return;

    const changes = [];
    if (oldChannel.name !== newChannel.name) {
      changes.push({ name: 'Name', value: `${oldChannel.name} → ${newChannel.name}`, inline: false });
    }
    if (oldChannel.topic !== undefined && oldChannel.topic !== newChannel.topic) {
      changes.push({
        name: 'Thema',
        value: `${oldChannel.topic || '*Kein Thema*'} → ${newChannel.topic || '*Kein Thema*'}`.slice(0, 1024),
        inline: false
      });
    }
    if (oldChannel.nsfw !== undefined && oldChannel.nsfw !== newChannel.nsfw) {
      changes.push({ name: 'NSFW', value: `${oldChannel.nsfw} → ${newChannel.nsfw}`, inline: false });
    }

    if (changes.length === 0) return;

    const embed = baseEmbed(newChannel.client)
      .setColor('#FEE75C')
      .setTitle('🔧 Channel bearbeitet')
      .addFields(
        { name: 'Channel', value: `${newChannel}`, inline: false },
        ...changes,
        { name: 'ID', value: `${newChannel.id}`, inline: false }
      );

    await sendLog(newChannel.client, embed);
  }
};

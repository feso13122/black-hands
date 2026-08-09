const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'emojiDelete',
  async execute(emoji) {
    const embed = baseEmbed(emoji.client)
      .setColor('#ED4245')
      .setTitle('➖ Emoji gelöscht')
      .addFields(
        { name: 'Name', value: `${emoji.name}`, inline: true },
        { name: 'ID', value: `${emoji.id}`, inline: true }
      );

    await sendLog(emoji.client, embed);
  }
};

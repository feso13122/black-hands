const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'emojiUpdate',
  async execute(oldEmoji, newEmoji) {
    if (oldEmoji.name === newEmoji.name) return;

    const embed = baseEmbed(newEmoji.client)
      .setColor('#FEE75C')
      .setTitle('🔧 Emoji umbenannt')
      .setThumbnail(newEmoji.imageURL())
      .addFields(
        { name: 'Name', value: `${oldEmoji.name} → ${newEmoji.name}`, inline: false },
        { name: 'ID', value: `${newEmoji.id}`, inline: false }
      );

    await sendLog(newEmoji.client, embed);
  }
};

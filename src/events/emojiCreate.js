const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'emojiCreate',
  async execute(emoji) {
    const embed = baseEmbed(emoji.client)
      .setColor('#57F287')
      .setTitle('➕ Emoji erstellt')
      .setThumbnail(emoji.imageURL())
      .addFields(
        { name: 'Name', value: `${emoji.name}`, inline: true },
        { name: 'ID', value: `${emoji.id}`, inline: true }
      );

    await sendLog(emoji.client, embed);
  }
};

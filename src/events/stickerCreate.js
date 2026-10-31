const { baseEmbed } = require('../utils/embeds');
const { sendCategoryLog } = require('../utils/logger');

module.exports = {
  name: 'stickerCreate',
  async execute(sticker) {
    const embed = baseEmbed(sticker.client)
      .setColor('#57F287')
      .setTitle('➕ Sticker erstellt')
      .setThumbnail(sticker.url)
      .addFields(
        { name: 'Name', value: `${sticker.name}`, inline: true },
        { name: 'ID', value: `${sticker.id}`, inline: true }
      );

    await sendCategoryLog(sticker.client, 'logStickerCreate', embed);
  }
};

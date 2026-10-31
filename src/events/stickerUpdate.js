const { baseEmbed } = require('../utils/embeds');
const { sendCategoryLog } = require('../utils/logger');

module.exports = {
  name: 'stickerUpdate',
  async execute(oldSticker, newSticker) {
    if (oldSticker.name === newSticker.name && oldSticker.description === newSticker.description) return;

    const embed = baseEmbed(newSticker.client)
      .setColor('#FEE75C')
      .setTitle('🔧 Sticker bearbeitet')
      .setThumbnail(newSticker.url)
      .addFields(
        { name: 'Name', value: `${oldSticker.name} → ${newSticker.name}`, inline: false },
        { name: 'ID', value: `${newSticker.id}`, inline: false }
      );

    await sendCategoryLog(newSticker.client, 'logStickerUpdate', embed);
  }
};

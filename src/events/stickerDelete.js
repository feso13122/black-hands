const { baseEmbed } = require('../utils/embeds');
const { sendCategoryLog } = require('../utils/logger');

module.exports = {
  name: 'stickerDelete',
  async execute(sticker) {
    const embed = baseEmbed(sticker.client)
      .setColor('#ED4245')
      .setTitle('➖ Sticker gelöscht')
      .addFields(
        { name: 'Name', value: `${sticker.name}`, inline: true },
        { name: 'ID', value: `${sticker.id}`, inline: true }
      );

    await sendCategoryLog(sticker.client, 'logStickerDelete', embed);
  }
};

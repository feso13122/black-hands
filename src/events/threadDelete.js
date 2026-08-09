const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'threadDelete',
  async execute(thread) {
    const embed = baseEmbed(thread.client)
      .setColor('#ED4245')
      .setTitle('➖ Thread gelöscht')
      .addFields(
        { name: 'Name', value: `${thread.name}`, inline: true },
        { name: 'In Channel', value: thread.parent ? `${thread.parent}` : 'Unbekannt', inline: true }
      );

    await sendLog(thread.client, embed);
  }
};

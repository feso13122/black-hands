const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'threadCreate',
  async execute(thread) {
    const embed = baseEmbed(thread.client)
      .setColor('#57F287')
      .setTitle('➕ Thread erstellt')
      .addFields(
        { name: 'Thread', value: `${thread}`, inline: true },
        { name: 'In Channel', value: thread.parent ? `${thread.parent}` : 'Unbekannt', inline: true }
      );

    await sendLog(thread.client, embed);
  }
};

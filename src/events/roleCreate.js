const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'roleCreate',
  async execute(role) {
    const embed = baseEmbed(role.client)
      .setColor('#57F287')
      .setTitle('➕ Rolle erstellt')
      .addFields(
        { name: 'Rolle', value: `${role}`, inline: true },
        { name: 'ID', value: `${role.id}`, inline: true }
      );

    await sendLog(role.client, embed);
  }
};

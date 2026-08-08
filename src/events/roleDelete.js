const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'roleDelete',
  async execute(role) {
    const embed = baseEmbed(role.client)
      .setColor('#ED4245')
      .setTitle('➖ Rolle gelöscht')
      .addFields(
        { name: 'Rolle', value: `${role.name}`, inline: true },
        { name: 'ID', value: `${role.id}`, inline: true }
      );

    await sendLog(role.client, embed);
  }
};

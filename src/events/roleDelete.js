const { baseEmbed } = require('../utils/embeds');
const { sendCategoryLog } = require('../utils/logger');

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

    await sendCategoryLog(role.client, 'logRoleDelete', embed);
  }
};

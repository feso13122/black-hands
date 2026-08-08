const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'roleDelete',
  async execute(role) {
    const embed = baseEmbed()
      .setColor('#ED4245')
      .setTitle('➖ Rolle gelöscht')
      .addFields({ name: 'Rolle', value: `${role.name}`, inline: true })
      .setFooter({ text: `ID: ${role.id}` });

    await sendLog(role.client, embed);
  }
};

const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'roleCreate',
  async execute(role) {
    const embed = baseEmbed()
      .setColor('#57F287')
      .setTitle('➕ Rolle erstellt')
      .addFields({ name: 'Rolle', value: `${role}`, inline: true })
      .setFooter({ text: `ID: ${role.id}` });

    await sendLog(role.client, embed);
  }
};

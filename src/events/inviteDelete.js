const { baseEmbed } = require('../utils/embeds');
const { sendCategoryLog } = require('../utils/logger');

module.exports = {
  name: 'inviteDelete',
  async execute(invite) {
    const embed = baseEmbed(invite.client)
      .setColor('#ED4245')
      .setTitle('➖ Invite gelöscht/abgelaufen')
      .addFields(
        { name: 'Code', value: `${invite.code}`, inline: true },
        { name: 'Channel', value: `${invite.channel}`, inline: true }
      );

    await sendCategoryLog(invite.client, 'logInviteDelete', embed);
  }
};

const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'inviteCreate',
  async execute(invite) {
    const embed = baseEmbed(invite.client)
      .setColor('#57F287')
      .setTitle('➕ Invite erstellt')
      .addFields(
        { name: 'Code', value: `${invite.code}`, inline: true },
        { name: 'Channel', value: `${invite.channel}`, inline: true },
        { name: 'Erstellt von', value: invite.inviter ? `${invite.inviter} (${invite.inviter.tag})` : 'Unbekannt', inline: false },
        { name: 'Max. Nutzungen', value: invite.maxUses ? `${invite.maxUses}` : 'Unbegrenzt', inline: true },
        { name: 'Läuft ab', value: invite.maxAge ? `<t:${Math.floor((Date.now() + invite.maxAge * 1000) / 1000)}:R>` : 'Nie', inline: true }
      );

    await sendLog(invite.client, embed);
  }
};

const { baseEmbed } = require('../utils/embeds');
const { sendCategoryLog } = require('../utils/logger');

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    if (user.bot) return;
    if (!reaction.message.guild) return;

    const embed = baseEmbed(reaction.client)
      .setColor('#57F287')
      .setTitle('➕ Reaktion hinzugefügt')
      .addFields(
        { name: 'Nutzer', value: `${user} (${user.tag})`, inline: false },
        { name: 'Emoji', value: `${reaction.emoji}`, inline: true },
        { name: 'Channel', value: `${reaction.message.channel}`, inline: true },
        { name: 'Nachricht', value: reaction.message.url, inline: false }
      );

    await sendCategoryLog(reaction.client, 'logReactionAdd', embed);
  }
};

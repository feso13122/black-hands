const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild) return;
    if (newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const embed = baseEmbed()
      .setColor('#FEE75C')
      .setTitle('✏️ Nachricht bearbeitet')
      .addFields(
        { name: 'Autor', value: `${newMessage.author} (${newMessage.author.tag})`, inline: false },
        { name: 'Channel', value: `${newMessage.channel}`, inline: false },
        { name: 'Vorher', value: (oldMessage.content || '*Kein Textinhalt*').slice(0, 1024), inline: false },
        { name: 'Nachher', value: (newMessage.content || '*Kein Textinhalt*').slice(0, 1024), inline: false }
      );

    if (newMessage.url) {
      embed.addFields({ name: 'Link', value: newMessage.url });
    }

    await sendLog(newMessage.client, embed);
  }
};

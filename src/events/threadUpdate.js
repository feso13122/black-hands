const { baseEmbed } = require('../utils/embeds');
const { sendCategoryLog } = require('../utils/logger');

module.exports = {
  name: 'threadUpdate',
  async execute(oldThread, newThread) {
    const changes = [];
    if (oldThread.name !== newThread.name) {
      changes.push({ name: 'Name', value: `${oldThread.name} → ${newThread.name}`, inline: false });
    }
    if (oldThread.archived !== newThread.archived) {
      changes.push({ name: 'Archiviert', value: `${oldThread.archived} → ${newThread.archived}`, inline: false });
    }
    if (oldThread.locked !== newThread.locked) {
      changes.push({ name: 'Gesperrt', value: `${oldThread.locked} → ${newThread.locked}`, inline: false });
    }

    if (changes.length === 0) return;

    const embed = baseEmbed(newThread.client)
      .setColor('#FEE75C')
      .setTitle('🔧 Thread bearbeitet')
      .addFields(
        { name: 'Thread', value: `${newThread}`, inline: false },
        ...changes
      );

    await sendCategoryLog(newThread.client, 'logThreadUpdate', embed);
  }
};

const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseAdminCommands } = require('../utils/permissions');
const blacklistStore = require('../utils/blacklistStore');

async function postBlacklist(interaction) {
  if (!config.blacklistListChannelId || config.blacklistListChannelId.startsWith('CHANNEL_ID')) {
    return null;
  }

  const channel = await interaction.guild.channels.fetch(config.blacklistListChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return null;

  const entries = blacklistStore.getAll();
  const embed = baseEmbed(interaction.client)
    .setColor('#ED4245')
    .setTitle('⛔ Blacklist')
    .setDescription(
      entries.length === 0
        ? 'Die Blacklist ist aktuell leer.'
        : entries.map(e => `<@${e.userId}> — ${e.reason}`).join('\n')
    );

  const existingMessageId = blacklistStore.getListMessageId();
  if (existingMessageId) {
    const existingMessage = await channel.messages.fetch(existingMessageId).catch(() => null);
    if (existingMessage) {
      await existingMessage.edit({ embeds: [embed] });
      return channel;
    }
  }

  const message = await channel.send({ embeds: [embed] });
  blacklistStore.setListMessageId(message.id);
  return channel;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Blacklist verwalten')
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('Fügt einen Nutzer zur Blacklist hinzu')
        .addUserOption(o => o.setName('nutzer').setDescription('Betroffener Nutzer').setRequired(true))
        .addStringOption(o => o.setName('grund').setDescription('Grund').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Entfernt einen Nutzer von der Blacklist')
        .addStringOption(o =>
          o
            .setName('nutzer')
            .setDescription('Nutzer, der auf der Blacklist steht')
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const choices = [];
    for (const entry of blacklistStore.getAll()) {
      const user = await interaction.client.users.fetch(entry.userId).catch(() => null);
      const label = user ? user.tag : `Unbekannt (${entry.userId})`;
      if (label.toLowerCase().includes(focused) || entry.userId.includes(focused)) {
        choices.push({ name: label.slice(0, 100), value: entry.userId });
      }
    }
    await interaction.respond(choices.slice(0, 25));
  },

  async execute(interaction) {
    if (!canUseAdminCommands(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const user = interaction.options.getUser('nutzer');
      const grund = interaction.options.getString('grund');

      blacklistStore.addEntry({
        userId: user.id,
        tag: user.tag,
        reason: grund,
        addedBy: interaction.user.id,
        addedAt: Date.now()
      });

      const channel = await postBlacklist(interaction);
      if (!channel) {
        await interaction.reply({
          embeds: [errorEmbed('Nutzer gespeichert, aber der Blacklist-Channel (`blacklistListChannelId`) wurde nicht gefunden.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        embeds: [successEmbed(`${user} wurde zur Blacklist hinzugefügt.`, interaction.client)],
        ephemeral: true
      });
      return;
    }

    if (sub === 'remove') {
      const userId = interaction.options.getString('nutzer');
      const removed = blacklistStore.removeEntry(userId);

      if (!removed) {
        await interaction.reply({
          embeds: [errorEmbed('Dieser Nutzer steht nicht auf der Blacklist.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      const user = await interaction.client.users.fetch(userId).catch(() => null);
      await postBlacklist(interaction);

      await interaction.reply({
        embeds: [successEmbed(`${user ? user : `<@${userId}>`} wurde von der Blacklist entfernt.`, interaction.client)],
        ephemeral: true
      });
    }
  }
};

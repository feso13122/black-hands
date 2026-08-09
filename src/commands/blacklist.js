const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseAdminCommands } = require('../utils/permissions');
const blacklistStore = require('../utils/blacklistStore');

function formatEntry(e) {
  const parts = [];
  if (e.userId) parts.push(`<@${e.userId}>`);
  if (e.faction) parts.push(`**${e.faction}**`);
  parts.push(e.reason);
  parts.push(`hinzugefügt von <@${e.addedBy}>`);
  return `• ${parts.join(' — ')}`;
}

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
        : entries.map(formatEntry).join('\n')
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
        .setDescription('Fügt einen Nutzer und/oder eine Fraktion zur Blacklist hinzu')
        .addStringOption(o => o.setName('grund').setDescription('Grund').setRequired(true))
        .addUserOption(o => o.setName('nutzer').setDescription('Betroffener Nutzer (optional)').setRequired(false))
        .addStringOption(o =>
          o
            .setName('fraktion')
            .setDescription('Fraktion (optional - kann auch ohne Nutzer geblacklistet werden)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Entfernt einen Eintrag von der Blacklist')
        .addStringOption(o =>
          o
            .setName('eintrag')
            .setDescription('Nutzer oder Fraktion, die auf der Blacklist steht')
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const choices = [];

    for (const entry of blacklistStore.getAll()) {
      let label;
      if (entry.userId) {
        const user = await interaction.client.users.fetch(entry.userId).catch(() => null);
        const tag = user ? user.tag : `Unbekannt (${entry.userId})`;
        label = entry.faction ? `${tag} — ${entry.faction} — ${entry.reason}` : `${tag} — ${entry.reason}`;
      } else {
        label = `${entry.faction} — ${entry.reason}`;
      }

      if (label.toLowerCase().includes(focused)) {
        choices.push({ name: label.slice(0, 100), value: entry.key });
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
      const fraktion = interaction.options.getString('fraktion');
      const grund = interaction.options.getString('grund');

      if (!user && !fraktion) {
        await interaction.reply({
          embeds: [errorEmbed('Gib mindestens einen Nutzer oder eine Fraktion an.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      blacklistStore.addEntry({
        userId: user ? user.id : null,
        tag: user ? user.tag : null,
        faction: fraktion || null,
        reason: grund,
        addedBy: interaction.user.id,
        addedAt: Date.now()
      });

      const channel = await postBlacklist(interaction);
      if (!channel) {
        await interaction.reply({
          embeds: [errorEmbed('Eintrag gespeichert, aber der Blacklist-Channel (`blacklistListChannelId`) wurde nicht gefunden.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      const target = user ? `${user}${fraktion ? ` (${fraktion})` : ''}` : `**${fraktion}**`;
      await interaction.reply({
        embeds: [successEmbed(`${target} wurde zur Blacklist hinzugefügt.`, interaction.client)],
        ephemeral: true
      });
      return;
    }

    if (sub === 'remove') {
      const key = interaction.options.getString('eintrag');
      const removed = blacklistStore.removeEntry(key);

      if (!removed) {
        await interaction.reply({
          embeds: [errorEmbed('Dieser Eintrag steht nicht auf der Blacklist.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      await postBlacklist(interaction);

      const target = removed.userId ? `<@${removed.userId}>` : `**${removed.faction}**`;
      const details = [removed.faction && removed.userId ? removed.faction : null, removed.reason]
        .filter(Boolean)
        .join(' — ');

      await interaction.reply({
        embeds: [successEmbed(`${target} wurde von der Blacklist entfernt (war: ${details}).`, interaction.client)],
        ephemeral: true
      });
    }
  }
};

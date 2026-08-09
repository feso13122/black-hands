const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseAdminCommands } = require('../utils/permissions');
const blacklistStore = require('../utils/blacklistStore');

function formatEntry(e) {
  return `• **${e.faction}** — ${e.reason} — hinzugefügt von <@${e.addedBy}>`;
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
        .setDescription('Fügt einen Eintrag zur Blacklist hinzu')
        .addStringOption(o =>
          o
            .setName('fraktion')
            .setDescription('Fraktion / Ingame-Charaktername')
            .setRequired(true)
        )
        .addStringOption(o => o.setName('grund').setDescription('Grund').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Entfernt einen Eintrag von der Blacklist')
        .addStringOption(o =>
          o
            .setName('eintrag')
            .setDescription('Fraktion / Ingame-Charaktername, der auf der Blacklist steht')
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const choices = blacklistStore.getAll()
      .filter(e => `${e.faction} ${e.reason}`.toLowerCase().includes(focused))
      .slice(0, 25)
      .map(e => ({ name: `${e.faction} — ${e.reason}`.slice(0, 100), value: e.key }));

    await interaction.respond(choices);
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
      const fraktion = interaction.options.getString('fraktion').trim();
      const grund = interaction.options.getString('grund');

      blacklistStore.addEntry({
        faction: fraktion,
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

      await interaction.reply({
        embeds: [successEmbed(`**${fraktion}** wurde zur Blacklist hinzugefügt.`, interaction.client)],
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

      await interaction.reply({
        embeds: [successEmbed(`**${removed.faction}** wurde von der Blacklist entfernt (war: ${removed.reason}).`, interaction.client)],
        ephemeral: true
      });
    }
  }
};

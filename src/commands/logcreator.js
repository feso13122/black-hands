const { SlashCommandBuilder, ChannelType } = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed } = require('../utils/embeds');
const { canUseAdminCommands } = require('../utils/permissions');
const { updateConfig } = require('../utils/configStore');

const LOG_CATEGORY_ID = '1541076054989607040';

// Alles, was der Bot irgendwo loggen kann, zusammen mit dem Config-Key,
// in dem die jeweilige Channel-ID steht.
const LOG_TARGETS = [
  { key: 'logChannelId', name: 'log-allgemein', topic: 'Allgemeine Server-/Bot-Logs (Channel-, Rollen-, Member-, Nachrichten-Events, ausgeführte Commands, ...)' },
  { key: 'sanctionAddChannelId', name: 'log-sanktion-neu', topic: 'Neue Sanktionen' },
  { key: 'sanctionPaidChannelId', name: 'log-sanktion-bezahlt', topic: 'Bezahlte Sanktionen' },
  { key: 'lagereinLogChannelId', name: 'log-lager-rein', topic: 'Lager: Ware rein' },
  { key: 'lagerausLogChannelId', name: 'log-lager-raus', topic: 'Lager: Ware raus' },
  { key: 'kasseeinLogChannelId', name: 'log-kasse-ein', topic: 'Fraktionskasse: Einzahlungen' },
  { key: 'kasseausLogChannelId', name: 'log-kasse-aus', topic: 'Fraktionskasse: Auszahlungen' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logcreator')
    .setDescription('Erstellt automatisch alle Log-Channels in der Log-Kategorie und synct sie damit'),

  async execute(interaction) {
    if (!canUseAdminCommands(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const category = await interaction.guild.channels.fetch(LOG_CATEGORY_ID).catch(() => null);
    if (!category || category.type !== ChannelType.GuildCategory) {
      await interaction.reply({
        embeds: [errorEmbed('Die Log-Kategorie wurde nicht gefunden.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const created = [];
    const synced = [];
    const configUpdates = {};

    for (const target of LOG_TARGETS) {
      const existingId = config[target.key];
      let channel = (existingId && !existingId.startsWith('CHANNEL_ID'))
        ? await interaction.guild.channels.fetch(existingId).catch(() => null)
        : null;

      if (channel) {
        if (channel.parentId !== LOG_CATEGORY_ID) {
          await channel.setParent(LOG_CATEGORY_ID, { lockPermissions: true }).catch(() => null);
        } else {
          await channel.lockPermissions().catch(() => null);
        }
        synced.push(`${channel} — \`${target.key}\``);
        continue;
      }

      const newChannel = await interaction.guild.channels.create({
        name: target.name,
        type: ChannelType.GuildText,
        parent: LOG_CATEGORY_ID,
        topic: target.topic
      });
      await newChannel.lockPermissions().catch(() => null);

      configUpdates[target.key] = newChannel.id;
      created.push(`${newChannel} — \`${target.key}\``);
    }

    if (Object.keys(configUpdates).length > 0) {
      updateConfig(configUpdates);
    }

    const lines = [
      ...(created.length ? ['**Neu erstellt:**', ...created] : []),
      ...(synced.length ? ['**Bereits vorhanden (mit Kategorie gesynct):**', ...synced] : [])
    ];

    const embed = baseEmbed(interaction.client)
      .setColor('#57F287')
      .setTitle('📜 Log-Channels')
      .setDescription(lines.join('\n').slice(0, 4000) || 'Es gab nichts zu tun.');

    await interaction.editReply({ embeds: [embed] });
  }
};

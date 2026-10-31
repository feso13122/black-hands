const { SlashCommandBuilder, ChannelType } = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed } = require('../utils/embeds');
const { canUseAdminCommands } = require('../utils/permissions');
const { updateConfig } = require('../utils/configStore');

const LOG_CATEGORY_ID = '1541076054989607040';

// Alles, was der Bot unter config.logChannels.<key> loggen kann.
const LOG_CHANNEL_TARGETS = [
  { key: 'logCommands', name: 'log-commands', topic: 'Ausgeführte Slash-Commands' },
  { key: 'logMember', name: 'log-member', topic: 'Mitglied beigetreten / Server verlassen' },
  { key: 'logUserUpdate', name: 'log-user-update', topic: 'Rollen/Nickname/Timeout eines Mitglieds geändert' },
  { key: 'logServer', name: 'dc-log', topic: 'Allgemeine Server-/Bot-Logs (Fallback für alles ohne eigenen Channel)' },
  { key: 'logGuildUpdate', name: 'log-server-settings', topic: 'Servereinstellungen geändert' },
  { key: 'logVoice', name: 'talk', topic: 'Voice-Channel-Aktivität' },
  { key: 'logModeration', name: 'kick', topic: 'Kicks' },
  { key: 'logErrors', name: 'log-errors', topic: 'Fehler bei der Command-Ausführung' },
  { key: 'logMessageDelete', name: 'nachrichten-log', topic: 'Gelöschte Nachrichten' },
  { key: 'logMessageDeleteBulk', name: 'log-nachrichten-bulk-delete', topic: 'Massenhaft gelöschte Nachrichten' },
  { key: 'logMessageEdit', name: 'log-nachrichten-edit', topic: 'Bearbeitete Nachrichten' },
  { key: 'logReactionAdd', name: 'log-reaction-add', topic: 'Hinzugefügte Reaktionen' },
  { key: 'logReactionRemove', name: 'log-reaction-remove', topic: 'Entfernte Reaktionen' },
  { key: 'logChannelCreate', name: 'log-channel-create', topic: 'Erstellte Channels' },
  { key: 'logChannelDelete', name: 'log-channel-delete', topic: 'Gelöschte Channels' },
  { key: 'logChannelUpdate', name: 'log-channel-update', topic: 'Bearbeitete Channels' },
  { key: 'logRoleCreate', name: 'log-role-create', topic: 'Erstellte Rollen' },
  { key: 'logRoleDelete', name: 'log-role-delete', topic: 'Gelöschte Rollen' },
  { key: 'logRoleUpdate', name: 'log-role-update', topic: 'Bearbeitete Rollen' },
  { key: 'logInviteCreate', name: 'log-invite-create', topic: 'Erstellte Invites' },
  { key: 'logInviteDelete', name: 'log-invite-delete', topic: 'Gelöschte/abgelaufene Invites' },
  { key: 'logEmojiCreate', name: 'log-emoji-create', topic: 'Erstellte Emojis' },
  { key: 'logEmojiDelete', name: 'log-emoji-delete', topic: 'Gelöschte Emojis' },
  { key: 'logEmojiUpdate', name: 'log-emoji-update', topic: 'Umbenannte Emojis' },
  { key: 'logStickerCreate', name: 'log-sticker-create', topic: 'Erstellte Sticker' },
  { key: 'logStickerDelete', name: 'log-sticker-delete', topic: 'Gelöschte Sticker' },
  { key: 'logStickerUpdate', name: 'log-sticker-update', topic: 'Bearbeitete Sticker' },
  { key: 'logThreadCreate', name: 'log-thread-create', topic: 'Erstellte Threads' },
  { key: 'logThreadDelete', name: 'log-thread-delete', topic: 'Gelöschte Threads' },
  { key: 'logThreadUpdate', name: 'log-thread-update', topic: 'Bearbeitete Threads' },
  { key: 'logBanAdd', name: 'ban', topic: 'Bans' },
  { key: 'logBanRemove', name: 'log-unban', topic: 'Aufgehobene Bans' },
  { key: 'logEventCreate', name: 'log-event-create', topic: 'Erstellte Server-Events' },
  { key: 'logEventDelete', name: 'log-event-delete', topic: 'Gelöschte Server-Events' },
  { key: 'logEventUpdate', name: 'log-event-update', topic: 'Bearbeitete Server-Events' },
  { key: 'logWebhookUpdate', name: 'log-webhook-update', topic: 'Geänderte Webhooks' },
  { key: 'logAutoMod', name: 'log-automod', topic: 'AutoMod-Aktionen' }
];

// Feature-eigene Log-/Command-Channels, unabhängig von config.logChannels.
const FEATURE_CHANNEL_TARGETS = [
  { key: 'sanctionAddChannelId', name: 'log-sanktion-neu', topic: 'Neue Sanktionen' },
  { key: 'sanctionPaidChannelId', name: 'log-sanktion-bezahlt', topic: 'Bezahlte Sanktionen' },
  { key: 'lagereinLogChannelId', name: 'log-lager-rein', topic: 'Lager: Ware rein' },
  { key: 'lagerausLogChannelId', name: 'log-lager-raus', topic: 'Lager: Ware raus' },
  { key: 'kasseeinLogChannelId', name: 'log-kasse-ein', topic: 'Fraktionskasse: Einzahlungen' },
  { key: 'kasseausLogChannelId', name: 'log-kasse-aus', topic: 'Fraktionskasse: Auszahlungen' },
  { key: 'bosslagereinLogChannelId', name: 'log-bosslager-rein', topic: 'Boss-Lager: Ware rein' },
  { key: 'bosslagerausLogChannelId', name: 'log-bosslager-raus', topic: 'Boss-Lager: Ware raus' }
];

async function resolveOrCreate(guild, existingId, target) {
  let channel = (existingId && !existingId.startsWith('CHANNEL_ID'))
    ? await guild.channels.fetch(existingId).catch(() => null)
    : null;

  let foundByName = false;
  if (!channel) {
    channel = guild.channels.cache.find(
      c => c.parentId === LOG_CATEGORY_ID && c.type === ChannelType.GuildText && c.name === target.name
    ) || null;
    foundByName = Boolean(channel);
  }

  if (channel) {
    if (channel.parentId !== LOG_CATEGORY_ID) {
      await channel.setParent(LOG_CATEGORY_ID, { lockPermissions: true }).catch(() => null);
    } else {
      await channel.lockPermissions().catch(() => null);
    }
    return { channel, created: false, idChanged: foundByName };
  }

  const newChannel = await guild.channels.create({
    name: target.name,
    type: ChannelType.GuildText,
    parent: LOG_CATEGORY_ID,
    topic: target.topic
  });
  await newChannel.lockPermissions().catch(() => null);

  return { channel: newChannel, created: true, idChanged: true };
}

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
    const logChannelUpdates = {};
    const configUpdates = {};

    for (const target of LOG_CHANNEL_TARGETS) {
      const existingId = (config.logChannels || {})[target.key];
      const { channel, created: wasCreated, idChanged } = await resolveOrCreate(interaction.guild, existingId, target);

      if (idChanged) logChannelUpdates[target.key] = channel.id;
      (wasCreated ? created : synced).push(`${channel} — \`logChannels.${target.key}\``);
    }

    for (const target of FEATURE_CHANNEL_TARGETS) {
      const existingId = config[target.key];
      const { channel, created: wasCreated, idChanged } = await resolveOrCreate(interaction.guild, existingId, target);

      if (idChanged) configUpdates[target.key] = channel.id;
      (wasCreated ? created : synced).push(`${channel} — \`${target.key}\``);
    }

    if (Object.keys(logChannelUpdates).length > 0) {
      configUpdates.logChannels = { ...(config.logChannels || {}), ...logChannelUpdates };
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

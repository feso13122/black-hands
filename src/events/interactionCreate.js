const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChannelType,
  PermissionFlagsBits
} = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const clipStore = require('../utils/clipStore');

function sanitizeChannelName(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_äöüß]/g, '')
    .slice(0, 80) || 'clip';
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    const { client } = interaction;

    // Slash-Commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(err);
        const payload = { embeds: [errorEmbed('Beim Ausführen des Befehls ist ein Fehler aufgetreten.')], ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload);
        } else {
          await interaction.reply(payload);
        }
      }
      return;
    }

    // Button: Clip-Channel erstellen -> Modal öffnen
    if (interaction.isButton() && interaction.customId === 'create_clip_channel') {
      const existingChannelId = clipStore.getUserChannel(interaction.user.id);
      if (existingChannelId) {
        const existingChannel = await interaction.guild.channels.fetch(existingChannelId).catch(() => null);
        if (existingChannel) {
          if (!clipStore.isUnlocked(interaction.user.id)) {
            await interaction.reply({
              embeds: [errorEmbed(
                `Du hast bereits einen Clip-Channel: ${existingChannel}\nEin Administrator muss dich mit \`/clip-unlock\` freischalten, bevor du einen weiteren erstellen kannst.`
              )],
              ephemeral: true
            });
            return;
          }
        } else {
          // Channel existiert nicht mehr (z. B. manuell gelöscht) -> Eintrag entfernen
          clipStore.removeUserChannel(interaction.user.id);
        }
      }

      const modal = new ModalBuilder()
        .setCustomId('clip_channel_modal')
        .setTitle('Clip-Channel erstellen');

      const nameInput = new TextInputBuilder()
        .setCustomId('channel_name')
        .setLabel('Wie soll dein Clip-Channel heißen?')
        .setStyle(TextInputStyle.Short)
        .setMinLength(2)
        .setMaxLength(50)
        .setPlaceholder('z. B. mein-clip')
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
      await interaction.showModal(modal);
      return;
    }

    // Modal-Submit: Channel tatsächlich erstellen
    if (interaction.isModalSubmit() && interaction.customId === 'clip_channel_modal') {
      await interaction.deferReply({ ephemeral: true });

      const rawName = interaction.fields.getTextInputValue('channel_name');
      const channelName = `🔫clip-${sanitizeChannelName(rawName)}`;
      const guild = interaction.guild;

      try {
        const categoryId = config.clipCategoryId && !config.clipCategoryId.startsWith('KATEGORIE_ID')
          ? config.clipCategoryId
          : null;
        const category = categoryId ? await guild.channels.fetch(categoryId).catch(() => null) : null;

        // Mit der Kategorie synchronisieren: ihre Overwrites übernehmen (wie
        // Discords "Berechtigungen synchronisieren"), danach Ersteller & Bot ergänzen.
        const overwrites = category
          ? category.permissionOverwrites.cache.map(ow => ({
              id: ow.id,
              type: ow.type,
              allow: ow.allow.bitfield,
              deny: ow.deny.bitfield
            }))
          : [];

        const upsertOverwrite = (id, type, allowPerms) => {
          const idx = overwrites.findIndex(o => o.id === id);
          if (idx >= 0) {
            overwrites[idx] = { id, type, allow: allowPerms, deny: [] };
          } else {
            overwrites.push({ id, type, allow: allowPerms, deny: [] });
          }
        };

        upsertOverwrite(interaction.user.id, 1, [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks
        ]);

        upsertOverwrite(client.user.id, 1, [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ReadMessageHistory
        ]);

        const newChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: category ? category.id : undefined,
          permissionOverwrites: overwrites,
          topic: `Privater Clip-Channel von ${interaction.user.tag}`
        });

        const welcomeEmbed = baseEmbed()
          .setTitle('🎬 Dein Clip-Channel')
          .setDescription(`Willkommen ${interaction.user}! Dies ist dein Clip-Channel.\nDu und Administratoren können hier immer schreiben, die restlichen Berechtigungen sind mit der Kategorie synchronisiert.`);
        await newChannel.send({ embeds: [welcomeEmbed] });

        clipStore.setUserChannel(interaction.user.id, newChannel.id);
        clipStore.consumeUnlock(interaction.user.id);

        await interaction.editReply({
          embeds: [successEmbed(`Dein Clip-Channel wurde erstellt: ${newChannel}`)]
        });

        const logEmbed = baseEmbed()
          .setColor('#57F287')
          .setTitle('🎬 Clip-Channel erstellt')
          .addFields(
            { name: 'Ersteller', value: `${interaction.user} (${interaction.user.tag})`, inline: false },
            { name: 'Channel', value: `${newChannel}`, inline: false }
          )
          .setFooter({ text: `ID: ${newChannel.id}` });
        await sendLog(client, logEmbed);
      } catch (err) {
        console.error('Fehler beim Erstellen des Clip-Channels:', err);
        await interaction.editReply({
          embeds: [errorEmbed('Der Clip-Channel konnte nicht erstellt werden. Bitte prüfe die Bot-Berechtigungen und die Konfiguration.')]
        });
      }
    }
  }
};

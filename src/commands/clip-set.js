const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const clipStore = require('../utils/clipStore');
const { canUseAdminCommands } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clip-set')
    .setDescription('Verknüpft einen bestehenden Channel als Clip-Channel eines Nutzers.')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Der Channel, der als Clip-Channel gelten soll')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName('nutzer')
        .setDescription('Der Nutzer, dem der Channel zugeordnet wird')
        .setRequired(true)
    ),

    
  async execute(interaction) {
    if (!canUseAdminCommands(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const channel = interaction.options.getChannel('channel');
    const user = interaction.options.getUser('nutzer');

    const existingChannelId = clipStore.getUserChannel(user.id);
    if (existingChannelId && existingChannelId !== channel.id) {
      const existingChannel = await interaction.guild.channels.fetch(existingChannelId).catch(() => null);
      if (existingChannel) {
        await interaction.reply({
          embeds: [errorEmbed(
            `${user} hat bereits einen gespeicherten Clip-Channel: ${existingChannel}\nEntferne ihn zuerst mit \`/clip-remove\` oder nutze diesen Befehl erneut, um ihn zu ersetzen.`,
            interaction.client
          )],
          ephemeral: true
        });
        return;
      }
    }

    try {
      await channel.permissionOverwrites.edit(user.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
        EmbedLinks: true
      });
    } catch (err) {
      console.error('Fehler beim Setzen der Channel-Berechtigungen:', err);
      await interaction.reply({
        embeds: [errorEmbed('Die Berechtigungen für den Channel konnten nicht gesetzt werden. Bitte prüfe die Bot-Berechtigungen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    clipStore.setUserChannel(user.id, channel.id);
    clipStore.consumeUnlock(user.id);

    await interaction.reply({
      embeds: [successEmbed(`${channel} wurde als Clip-Channel von ${user} anerkannt.`, interaction.client)],
      ephemeral: true
    });

    const logEmbed = baseEmbed(interaction.client)
      .setColor('#5865F2')
      .setTitle('🎬 Clip-Channel manuell zugeordnet')
      .addFields(
        { name: 'Nutzer', value: `${user} (${user.tag})`, inline: false },
        { name: 'Channel', value: `${channel}`, inline: false },
        { name: 'Zugeordnet von', value: `${interaction.user} (${interaction.user.tag})`, inline: false }
      );
    await sendLog(interaction.client, logEmbed);
  }
};

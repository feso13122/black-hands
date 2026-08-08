const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const clipStore = require('../utils/clipStore');
const { canUseAdminCommands } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clip-remove')
    .setDescription('Entfernt den Clip-Channel eines Nutzers.')
    .addStringOption(option =>
      option
        .setName('nutzer')
        .setDescription('Nutzer mit gespeichertem Clip-Channel')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const entries = Object.entries(clipStore.getAllUserChannels());

    const choices = [];
    for (const [userId] of entries) {
      const user = await interaction.client.users.fetch(userId).catch(() => null);
      const label = user ? user.tag : `Unbekannt (${userId})`;
      if (label.toLowerCase().includes(focused) || userId.includes(focused)) {
        choices.push({ name: label.slice(0, 100), value: userId });
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

    const userId = interaction.options.getString('nutzer');
    const channelId = clipStore.getUserChannel(userId);

    if (!channelId) {
      await interaction.reply({
        embeds: [errorEmbed('Für diesen Nutzer ist aktuell kein Clip-Channel gespeichert.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const user = await interaction.client.users.fetch(userId).catch(() => null);
    const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
    clipStore.removeUserChannel(userId);

    if (channel) {
      await channel.delete(`Clip-Channel entfernt von ${interaction.user.tag}`).catch(() => null);
    }

    const userLabel = user ? `${user}` : `<@${userId}>`;

    await interaction.reply({
      embeds: [successEmbed(`Der Clip-Channel von ${userLabel} wurde entfernt.`, interaction.client)],
      ephemeral: true
    });

    const logEmbed = baseEmbed(interaction.client)
      .setColor('#ED4245')
      .setTitle('🗑️ Clip-Channel entfernt')
      .addFields(
        { name: 'Nutzer', value: user ? `${user} (${user.tag})` : userLabel, inline: false },
        { name: 'Entfernt von', value: `${interaction.user} (${interaction.user.tag})`, inline: false }
      );
    await sendLog(interaction.client, logEmbed);
  }
};

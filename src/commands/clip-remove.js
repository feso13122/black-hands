const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const clipStore = require('../utils/clipStore');
const { canUseAdminCommands } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clip-remove')
    .setDescription('Entfernt den Clip-Channel eines Nutzers.')
    .addUserOption(option =>
      option
        .setName('nutzer')
        .setDescription('Der Nutzer, dessen Clip-Channel entfernt werden soll')
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

    const user = interaction.options.getUser('nutzer');
    const channelId = clipStore.getUserChannel(user.id);

    if (!channelId) {
      await interaction.reply({
        embeds: [errorEmbed(`${user} hat aktuell keinen Clip-Channel.`, interaction.client)],
        ephemeral: true
      });
      return;
    }

    const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
    clipStore.removeUserChannel(user.id);

    if (channel) {
      await channel.delete(`Clip-Channel entfernt von ${interaction.user.tag}`).catch(() => null);
    }

    await interaction.reply({
      embeds: [successEmbed(`Der Clip-Channel von ${user} wurde entfernt.`, interaction.client)],
      ephemeral: true
    });

    const logEmbed = baseEmbed(interaction.client)
      .setColor('#ED4245')
      .setTitle('🗑️ Clip-Channel entfernt')
      .addFields(
        { name: 'Nutzer', value: `${user} (${user.tag})`, inline: false },
        { name: 'Entfernt von', value: `${interaction.user} (${interaction.user.tag})`, inline: false }
      );
    await sendLog(interaction.client, logEmbed);
  }
};

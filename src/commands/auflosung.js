const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed } = require('../utils/embeds');
const { canManageAllianceAndSanctions } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('auflosung')
    .setDescription('Verkündet die Auflösung eines Bündnisses mit einer Fraktion.')
    .addStringOption(option =>
      option
        .setName('fraktion')
        .setDescription('Name der Fraktion, mit der das Bündnis aufgelöst wird')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!canManageAllianceAndSanctions(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    if (!config.allianceChannelId || config.allianceChannelId.startsWith('CHANNEL_ID')) {
      await interaction.reply({
        embeds: [errorEmbed('Es ist kein Bündnis-Channel (`allianceChannelId`) in der config.json eingetragen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const channel = await interaction.guild.channels.fetch(config.allianceChannelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      await interaction.reply({
        embeds: [errorEmbed('Der konfigurierte Bündnis-Channel wurde nicht gefunden.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const fraktion = interaction.options.getString('fraktion');
    const roleMention = config.allianceRoleId && !config.allianceRoleId.startsWith('ROLLEN_ID')
      ? `<@&${config.allianceRoleId}>`
      : '';

    const embed = baseEmbed(interaction.client)
      .setColor('#ED4245')
      .setTitle('💔 Bündnis aufgelöst')
      .setDescription(`Ab heute ist das Bündnis mit der **${fraktion}** Fraktion aufgelöst.`);

    await channel.send({ content: roleMention, embeds: [embed] });
    await interaction.reply({ content: `Auflösungs-Nachricht für **${fraktion}** wurde in ${channel} gepostet.`, ephemeral: true });
  }
};

const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed } = require('../utils/embeds');
const { canManageAllianceAndSanctions } = require('../utils/permissions');
const allianceStore = require('../utils/allianceStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bundnisse')
    .setDescription('Verkündet ein neues Bündnis mit einer Fraktion.')
    .addStringOption(option =>
      option
        .setName('fraktion')
        .setDescription('Name der Fraktion, mit der das Bündnis geschlossen wird')
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
      .setColor('#57F287')
      .setTitle('🤝 Neues Bündnis')
      .setDescription(`Ab heute sind wir im Bündnis mit der **${fraktion}** Fraktion.`);

    await channel.send({ content: roleMention, embeds: [embed] });
    allianceStore.addAlliance(fraktion, interaction.user.id);

    await interaction.reply({ content: `Bündnis-Nachricht für **${fraktion}** wurde in ${channel} gepostet.`, ephemeral: true });
  }
};

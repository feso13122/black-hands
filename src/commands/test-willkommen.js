const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const { errorEmbed, successEmbed } = require('../utils/embeds');
const { isOwner } = require('../utils/permissions');
const { buildWelcomeEmbed } = require('../utils/memberEmbeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test-willkommen')
    .setDescription('[Nur Owner] Testet, wie die Willkommensnachricht aussieht.')
    .addUserOption(option =>
      option
        .setName('nutzer')
        .setDescription('Nutzer, dessen Profil zum Testen verwendet wird (Standard: du selbst)')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!isOwner(interaction.user.id)) {
      await interaction.reply({
        embeds: [errorEmbed('Diesen Befehl kannst nur du benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    if (!config.welcomeChannelId || config.welcomeChannelId.startsWith('CHANNEL_ID')) {
      await interaction.reply({
        embeds: [errorEmbed('Es ist kein Willkommens-Channel (`welcomeChannelId`) in der config.json eingetragen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const channel = await interaction.guild.channels.fetch(config.welcomeChannelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      await interaction.reply({
        embeds: [errorEmbed('Der konfigurierte Willkommens-Channel wurde nicht gefunden.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const targetUser = interaction.options.getUser('nutzer') || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      await interaction.reply({
        embeds: [errorEmbed('Der Nutzer wurde auf diesem Server nicht gefunden.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    await channel.send({ embeds: [buildWelcomeEmbed(interaction.client, member)] });

    await interaction.reply({
      embeds: [successEmbed(`Test-Willkommensnachricht für ${member} wurde in ${channel} gepostet.`, interaction.client)],
      ephemeral: true
    });
  }
};

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { baseEmbed, errorEmbed } = require('../utils/embeds');
const { canUseAdminCommands } = require('../utils/permissions');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-clip-panel')
    .setDescription('Postet das Panel zum Erstellen von Clip-Channels.'),

  async execute(interaction) {
    if (!canUseAdminCommands(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const targetChannel = await interaction.client.channels.fetch(config.clipPanelChannelId).catch(() => null);
    if (!targetChannel) {
      await interaction.reply({
        embeds: [errorEmbed('Der Ziel-Channel für das Clip-Panel wurde nicht gefunden.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const embed = baseEmbed(interaction.client)
      .setTitle('🎬 Clip-Channel erstellen')
      .setDescription(
        'Klicke auf den Button unten, um deinen eigenen privaten Clip-Channel zu erstellen.\n\n' +
        '• Du wirst nach einem Namen gefragt\n' +
        '• Nur du (und Administratoren) könnt dort schreiben\n' +
        '• Alle anderen können den Channel nicht sehen'
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('create_clip_channel')
        .setLabel('Clip-Channel erstellen')
        .setEmoji('🎬')
        .setStyle(ButtonStyle.Primary)
    );

    await targetChannel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `Panel wurde in <#${config.clipPanelChannelId}> gepostet.`, ephemeral: true });
  }
};

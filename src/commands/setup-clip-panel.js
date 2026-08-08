const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { baseEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-clip-panel')
    .setDescription('Postet das Panel zum Erstellen von Clip-Channels in diesen Channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = baseEmbed()
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

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: 'Panel wurde gepostet.', ephemeral: true });
  }
};

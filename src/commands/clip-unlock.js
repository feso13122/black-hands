const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const clipStore = require('../utils/clipStore');
const { canUseAdminCommands } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clip-unlock')
    .setDescription('Erlaubt einem Nutzer, trotz bestehendem Clip-Channel einen weiteren zu erstellen.')
    .addUserOption(option =>
      option
        .setName('nutzer')
        .setDescription('Der Nutzer, der einen weiteren Clip-Channel erstellen darf')
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
    clipStore.unlockUser(user.id);

    await interaction.reply({
      embeds: [successEmbed(`${user} wurde freigeschaltet und kann einen weiteren Clip-Channel erstellen.`, interaction.client)],
      ephemeral: true
    });

    const logEmbed = baseEmbed(interaction.client)
      .setColor('#FEE75C')
      .setTitle('🔓 Clip-Channel-Freischaltung')
      .addFields(
        { name: 'Freigeschaltet', value: `${user} (${user.tag})`, inline: false },
        { name: 'Durch', value: `${interaction.user} (${interaction.user.tag})`, inline: false }
      );
    await sendLog(interaction.client, logEmbed);
  }
};

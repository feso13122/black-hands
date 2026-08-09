const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseAdminCommands } = require('../utils/permissions');
const { ensureMemberCountChannel, ensureRoleCountChannel } = require('../utils/serverStats');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverstats')
    .setDescription('Erstellt/aktualisiert die Stats-Channels (Mitgliederzahl, Rollen-Anzahl).'),

  async execute(interaction) {
    if (!canUseAdminCommands(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const { channel: memberChannel, created: memberCreated } = await ensureMemberCountChannel(interaction.guild);
    const roleResult = await ensureRoleCountChannel(interaction.guild);

    const lines = [
      `${memberCreated ? '✅ Erstellt' : '🔄 Aktualisiert'}: ${memberChannel} (Mitgliederzahl ohne Bots)`
    ];

    if (roleResult) {
      lines.push(`${roleResult.created ? '✅ Erstellt' : '🔄 Aktualisiert'}: ${roleResult.channel} (Anzahl mit Rolle)`);
    } else {
      lines.push('⚠️ Kein `serverStatsRoleId` in der config.json eingetragen — der Rollen-Channel wurde übersprungen.');
    }

    await interaction.editReply({
      embeds: [successEmbed(lines.join('\n'), interaction.client)]
    });
  }
};

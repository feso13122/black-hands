const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { canManageAllianceAndSanctions } = require('../utils/permissions');
const sanctionStore = require('../utils/sanctionStore');

async function postSanctionList(interaction) {
  if (!config.sanctionListChannelId || config.sanctionListChannelId.startsWith('CHANNEL_ID')) {
    return null;
  }

  const channel = await interaction.guild.channels.fetch(config.sanctionListChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return null;

  const sanctions = sanctionStore.getAll();
  const embed = baseEmbed(interaction.client)
    .setColor('#FEE75C')
    .setTitle('📋 Sanktionsliste')
    .setDescription(
      sanctions.length === 0
        ? 'Aktuell liegen keine offenen Sanktionen vor.'
        : sanctions
            .map(s => `<@${s.userId}> — **${s.amount}** — ${s.reason}`)
            .join('\n')
    );

  await channel.send({ embeds: [embed] });
  return channel;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sanktion')
    .setDescription('Sanktionen verwalten')
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('Fügt eine Sanktion für einen Nutzer hinzu')
        .addUserOption(o => o.setName('nutzer').setDescription('Betroffener Nutzer').setRequired(true))
        .addStringOption(o => o.setName('betrag').setDescription('Betrag/Strafe').setRequired(true))
        .addStringOption(o => o.setName('grund').setDescription('Grund der Sanktion').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('bezahlt')
        .setDescription('Markiert die Sanktion eines Nutzers als bezahlt und entfernt sie aus der Liste')
        .addUserOption(o => o.setName('nutzer').setDescription('Betroffener Nutzer').setRequired(true))
    ),

  async execute(interaction) {
    if (!canManageAllianceAndSanctions(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const user = interaction.options.getUser('nutzer');
      const betrag = interaction.options.getString('betrag');
      const grund = interaction.options.getString('grund');

      sanctionStore.addSanction({
        userId: user.id,
        tag: user.tag,
        amount: betrag,
        reason: grund,
        issuedBy: interaction.user.id,
        issuedAt: Date.now()
      });

      const channel = await postSanctionList(interaction);
      if (!channel) {
        await interaction.reply({
          embeds: [errorEmbed('Sanktion gespeichert, aber der Sanktionsliste-Channel (`sanctionListChannelId`) wurde nicht gefunden.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        embeds: [successEmbed(`Sanktion für ${user} über **${betrag}** wurde hinzugefügt.`, interaction.client)],
        ephemeral: true
      });
      return;
    }

    if (sub === 'bezahlt') {
      const user = interaction.options.getUser('nutzer');
      const removed = sanctionStore.removeSanction(user.id);

      if (!removed) {
        await interaction.reply({
          embeds: [errorEmbed(`${user} hat keine offene Sanktion.`, interaction.client)],
          ephemeral: true
        });
        return;
      }

      await postSanctionList(interaction);

      if (config.sanctionPaidChannelId && !config.sanctionPaidChannelId.startsWith('CHANNEL_ID')) {
        const paidChannel = await interaction.guild.channels.fetch(config.sanctionPaidChannelId).catch(() => null);
        if (paidChannel && paidChannel.isTextBased()) {
          const paidEmbed = baseEmbed(interaction.client)
            .setColor('#57F287')
            .setTitle('✅ Sanktion bezahlt')
            .setDescription(`${user} hat die Sanktion bezahlt.`)
            .addFields(
              { name: 'Betrag', value: `${removed.amount}`, inline: true },
              { name: 'Grund', value: `${removed.reason}`, inline: true }
            );
          await paidChannel.send({ embeds: [paidEmbed] });
        }
      }

      await interaction.reply({
        embeds: [successEmbed(`Sanktion von ${user} wurde als bezahlt markiert und aus der Liste entfernt.`, interaction.client)],
        ephemeral: true
      });
    }
  }
};

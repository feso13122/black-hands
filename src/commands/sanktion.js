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

  const sanctions = sanctionStore.getOpen();
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

  const existingMessageId = sanctionStore.getListMessageId();
  if (existingMessageId) {
    const existingMessage = await channel.messages.fetch(existingMessageId).catch(() => null);
    if (existingMessage) {
      await existingMessage.edit({ embeds: [embed] });
      return channel;
    }
  }

  const message = await channel.send({ embeds: [embed] });
  sanctionStore.setListMessageId(message.id);
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
        .addStringOption(o =>
          o
            .setName('nutzer')
            .setDescription('Nutzer mit offener, gespeicherter Sanktion')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('Aktualisiert die Sanktionsliste-Nachricht')
    ),

  async autocomplete(interaction) {
    if (interaction.options.getSubcommand() !== 'bezahlt') return;

    const focused = interaction.options.getFocused().toLowerCase();
    const choices = [];
    for (const sanction of sanctionStore.getOpen()) {
      const user = await interaction.client.users.fetch(sanction.userId).catch(() => null);
      const label = user ? user.tag : `Unbekannt (${sanction.userId})`;
      if (label.toLowerCase().includes(focused) || sanction.userId.includes(focused)) {
        choices.push({ name: label.slice(0, 100), value: sanction.userId });
      }
    }

    await interaction.respond(choices.slice(0, 25));
  },

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

      if (config.sanctionAddChannelId && !config.sanctionAddChannelId.startsWith('CHANNEL_ID')) {
        const addChannel = await interaction.guild.channels.fetch(config.sanctionAddChannelId).catch(() => null);
        if (addChannel && addChannel.isTextBased()) {
          const addEmbed = baseEmbed(interaction.client)
            .setColor('#FEE75C')
            .setTitle('⚠️ Neue Sanktion')
            .setDescription(`${user} wurde sanktioniert.`)
            .addFields(
              { name: 'Betrag', value: betrag, inline: true },
              { name: 'Grund', value: grund, inline: true },
              { name: 'Ausgestellt von', value: `${interaction.user}`, inline: false }
            );
          await addChannel.send({ content: `${user}`, embeds: [addEmbed] });
        }
      }

      await interaction.reply({
        embeds: [successEmbed(`Sanktion für ${user} über **${betrag}** wurde hinzugefügt.`, interaction.client)],
        ephemeral: true
      });
      return;
    }

    if (sub === 'list') {
      const channel = await postSanctionList(interaction);
      if (!channel) {
        await interaction.reply({
          embeds: [errorEmbed('Der Sanktionsliste-Channel (`sanctionListChannelId`) wurde nicht gefunden.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        embeds: [successEmbed(`Die Sanktionsliste in ${channel} wurde aktualisiert.`, interaction.client)],
        ephemeral: true
      });
      return;
    }

    if (sub === 'bezahlt') {
      const userId = interaction.options.getString('nutzer');
      const paid = sanctionStore.markPaid(userId, interaction.user.id);

      if (!paid) {
        await interaction.reply({
          embeds: [errorEmbed('Für diesen Nutzer ist keine offene Sanktion gespeichert.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      const user = await interaction.client.users.fetch(userId).catch(() => null);
      const userLabel = user ? `${user}` : `<@${userId}>`;

      await postSanctionList(interaction);

      if (config.sanctionPaidChannelId && !config.sanctionPaidChannelId.startsWith('CHANNEL_ID')) {
        const paidChannel = await interaction.guild.channels.fetch(config.sanctionPaidChannelId).catch(() => null);
        if (paidChannel && paidChannel.isTextBased()) {
          const paidEmbed = baseEmbed(interaction.client)
            .setColor('#57F287')
            .setTitle('✅ Sanktion bezahlt')
            .setDescription(`${userLabel} hat die Sanktion bezahlt.`)
            .addFields(
              { name: 'Betrag', value: `${paid.amount}`, inline: true },
              { name: 'Grund', value: `${paid.reason}`, inline: true },
              { name: 'Bestätigt von', value: `${interaction.user}`, inline: false }
            );
          await paidChannel.send({ content: userLabel, embeds: [paidEmbed] });
        }
      }

      await interaction.reply({
        embeds: [successEmbed(`Sanktion von ${userLabel} wurde als bezahlt markiert und aus der Liste entfernt.`, interaction.client)],
        ephemeral: true
      });
    }
  }
};

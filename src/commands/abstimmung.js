const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const { errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseAdminCommands } = require('../utils/permissions');
const abstimmungStore = require('../utils/abstimmungStore');
const { buildPollEmbed, buildPollRow } = require('../utils/abstimmungPanel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('abstimmung')
    .setDescription('Abstimmungen verwalten')
    .addSubcommand(sub =>
      sub
        .setName('start')
        .setDescription('Startet eine neue Abstimmung')
        .addStringOption(o => o.setName('frage').setDescription('Worüber wird abgestimmt?').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('end')
        .setDescription('Beendet die aktuelle Abstimmung')
    ),

  async execute(interaction) {
    if (!canUseAdminCommands(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      if (abstimmungStore.getActive()) {
        await interaction.reply({
          embeds: [errorEmbed('Es läuft bereits eine Abstimmung. Beende sie zuerst mit `/abstimmung end`.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      if (!config.abstimmungChannelId || config.abstimmungChannelId.startsWith('CHANNEL_ID')) {
        await interaction.reply({
          embeds: [errorEmbed('Es ist kein Abstimmungs-Channel (`abstimmungChannelId`) in der config.json eingetragen.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      const channel = await interaction.guild.channels.fetch(config.abstimmungChannelId).catch(() => null);
      if (!channel || !channel.isTextBased()) {
        await interaction.reply({
          embeds: [errorEmbed('Der konfigurierte Abstimmungs-Channel wurde nicht gefunden.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      const frage = interaction.options.getString('frage');
      const poll = {
        messageId: null,
        channelId: channel.id,
        frage,
        ja: [],
        nein: [],
        startedBy: interaction.user.id,
        startedAt: Date.now()
      };

      const message = await channel.send({
        embeds: [buildPollEmbed(interaction.client, poll)],
        components: [buildPollRow()]
      });
      poll.messageId = message.id;
      abstimmungStore.setActive(poll);

      await interaction.reply({
        embeds: [successEmbed(`Abstimmung gestartet in ${channel}.`, interaction.client)],
        ephemeral: true
      });
      return;
    }

    if (sub === 'end') {
      const poll = abstimmungStore.getActive();
      if (!poll) {
        await interaction.reply({
          embeds: [errorEmbed('Aktuell läuft keine Abstimmung.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      const channel = await interaction.guild.channels.fetch(poll.channelId).catch(() => null);
      const message = channel ? await channel.messages.fetch(poll.messageId).catch(() => null) : null;

      if (message) {
        await message.edit({
          embeds: [buildPollEmbed(interaction.client, poll, true)],
          components: [buildPollRow(true)]
        });
      }

      abstimmungStore.clearActive();

      const result = poll.ja.length === poll.nein.length
        ? 'Unentschieden'
        : poll.ja.length > poll.nein.length ? 'Ja hat gewonnen' : 'Nein hat gewonnen';

      await interaction.reply({
        embeds: [successEmbed(`Abstimmung beendet. Ergebnis: **${poll.ja.length} Ja / ${poll.nein.length} Nein** — ${result}.`, interaction.client)],
        ephemeral: true
      });
    }
  }
};

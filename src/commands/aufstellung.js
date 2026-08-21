const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const { errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseAdminCommands } = require('../utils/permissions');
const aufstellungStore = require('../utils/aufstellungStore');
const { buildAufstellungEmbed, buildAufstellungRow } = require('../utils/aufstellungPanel');

const PING_ROLE_ID = '1535782072491180153';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aufstellung')
    .setDescription('Kündigt eine Aufstellung mit Datum und Uhrzeit an.')
    .addStringOption(o => o.setName('datum').setDescription('Datum (TT.MM.JJJJ)').setRequired(true))
    .addStringOption(o => o.setName('uhrzeit').setDescription('Uhrzeit (HH:MM)').setRequired(true))
    .addStringOption(o => o.setName('grund').setDescription('Grund für die Aufstellung').setRequired(false)),

  async execute(interaction) {
    if (!canUseAdminCommands(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    if (!config.aufstellungChannelId || config.aufstellungChannelId.startsWith('CHANNEL_ID')) {
      await interaction.reply({
        embeds: [errorEmbed('Es ist kein Aufstellungs-Channel (`aufstellungChannelId`) in der config.json eingetragen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const channel = await interaction.guild.channels.fetch(config.aufstellungChannelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      await interaction.reply({
        embeds: [errorEmbed('Der konfigurierte Aufstellungs-Channel wurde nicht gefunden.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const datum = interaction.options.getString('datum').trim();
    const uhrzeit = interaction.options.getString('uhrzeit').trim();
    const grund = interaction.options.getString('grund')?.trim() || '';

    const dateMatch = datum.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    const timeMatch = uhrzeit.match(/^(\d{1,2}):(\d{2})$/);

    if (!dateMatch || !timeMatch) {
      await interaction.reply({
        embeds: [errorEmbed('Bitte gib das Datum im Format TT.MM.JJJJ und die Uhrzeit im Format HH:MM an.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const [, day, month, year] = dateMatch;
    const [, hour, minute] = timeMatch;
    const start = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));

    if (Number.isNaN(start.getTime()) || Number(hour) > 23 || Number(minute) > 59) {
      await interaction.reply({
        embeds: [errorEmbed('Das Datum oder die Uhrzeit ist ungültig.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const unix = Math.floor(start.getTime() / 1000);
    const emptyPoll = { da: [], nichtDa: [] };

    const message = await channel.send({
      content: `<@&${PING_ROLE_ID}>`,
      embeds: [buildAufstellungEmbed(interaction.client, unix, emptyPoll, grund)],
      components: [buildAufstellungRow()]
    });
    aufstellungStore.createPoll(message.id, unix, grund);

    await interaction.reply({
      embeds: [successEmbed(`Aufstellung wurde in ${channel} angekündigt. Mitglieder können über die Buttons angeben, ob sie da sind.`, interaction.client)],
      ephemeral: true
    });
  }
};

const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseKasse } = require('../utils/permissions');
const kasseStore = require('../utils/kasseStore');
const { postKasseList, postKasseLog, formatMoney } = require('../utils/kassePanel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kasse')
    .setDescription('Fraktionskasse verwalten (grünes & schwarzes Geld)')
    .addSubcommand(sub =>
      sub
        .setName('ein')
        .setDescription('Zahlt Geld in die Fraktionskasse ein')
        .addStringOption(o =>
          o
            .setName('typ')
            .setDescription('Welches Geld?')
            .setRequired(true)
            .addChoices(
              { name: 'Grünes Geld', value: 'gruen' },
              { name: 'Schwarzes Geld', value: 'schwarz' }
            )
        )
        .addIntegerOption(o =>
          o
            .setName('betrag')
            .setDescription('Betrag in $')
            .setRequired(true)
            .setMinValue(1)
        )
        .addStringOption(o =>
          o
            .setName('grund')
            .setDescription('Grund für die Einzahlung')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('aus')
        .setDescription('Zahlt Geld aus der Fraktionskasse aus')
        .addStringOption(o =>
          o
            .setName('typ')
            .setDescription('Welches Geld?')
            .setRequired(true)
            .addChoices(
              { name: 'Grünes Geld', value: 'gruen' },
              { name: 'Schwarzes Geld', value: 'schwarz' }
            )
        )
        .addIntegerOption(o =>
          o
            .setName('betrag')
            .setDescription('Betrag in $')
            .setRequired(true)
            .setMinValue(1)
        )
        .addStringOption(o =>
          o
            .setName('grund')
            .setDescription('Grund für die Auszahlung')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('liste')
        .setDescription('Aktualisiert die Kassenstand-Nachricht')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'liste') {
      // /kasse liste läuft im allgemeinen Command-Channel wie alle anderen
      // normalen Commands, nicht im Kasse-Channel.
      if (
        config.commandChannelId &&
        !config.commandChannelId.startsWith('CHANNEL_ID') &&
        interaction.channelId !== config.commandChannelId
      ) {
        await interaction.reply({
          embeds: [errorEmbed(`\`/kasse liste\` kann nur in <#${config.commandChannelId}> benutzt werden.`, interaction.client)],
          ephemeral: true
        });
        return;
      }

      if (!canUseKasse(interaction.member)) {
        await interaction.reply({
          embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      const channel = await postKasseList(interaction.client);
      if (!channel) {
        await interaction.reply({
          embeds: [errorEmbed('Der Kassenlisten-Channel (`kasseListChannelId`) wurde nicht gefunden.', interaction.client)],
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        embeds: [successEmbed(`Der Kassenstand in ${channel} wurde aktualisiert.`, interaction.client)],
        ephemeral: true
      });
      return;
    }

    // /kasse ein und /kasse aus: eigene Channel-Sperre, jeweils auf einen
    // eigenen Channel (kasseeinCommandChannelId / kasseausCommandChannelId).
    const requiredChannelId = sub === 'ein' ? config.kasseeinCommandChannelId : config.kasseausCommandChannelId;

    if (
      requiredChannelId &&
      !requiredChannelId.startsWith('CHANNEL_ID') &&
      interaction.channelId !== requiredChannelId
    ) {
      await interaction.reply({
        embeds: [errorEmbed(`\`/kasse ${sub}\` kann nur in <#${requiredChannelId}> benutzt werden.`, interaction.client)],
        ephemeral: true
      });
      return;
    }

    if (!canUseKasse(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const typ = interaction.options.getString('typ');
    const betrag = interaction.options.getInteger('betrag');
    const grund = interaction.options.getString('grund');

    const total = sub === 'ein'
      ? kasseStore.addMoney(typ, betrag)
      : kasseStore.removeMoney(typ, betrag);

    if (total === null) {
      await interaction.reply({
        embeds: [errorEmbed('Der Kassenstand reicht für diese Auszahlung nicht aus.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const results = [{ type: typ, amount: betrag, total }];

    await postKasseList(interaction.client);
    await postKasseLog(interaction.client, { action: sub, executor: interaction.user, results, grund });

    const typLabel = typ === 'gruen' ? '🟢 Grünes Geld' : '⚫ Schwarzes Geld';
    const summaryEmbed = baseEmbed(interaction.client)
      .setColor('#57F287')
      .setTitle(sub === 'ein' ? '📥 Kasse: Einzahlung' : '📤 Kasse: Auszahlung')
      .setDescription(`${typLabel} — ${formatMoney(betrag)} — Neuer Kontostand: ${formatMoney(total)}`);

    await interaction.reply({ embeds: [summaryEmbed], ephemeral: true });
  }
};

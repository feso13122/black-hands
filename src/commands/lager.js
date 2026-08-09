const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseAdminCommands } = require('../utils/permissions');
const inventoryStore = require('../utils/inventoryStore');

async function postInventoryList(interaction) {
  if (!config.lagerListChannelId || config.lagerListChannelId.startsWith('CHANNEL_ID')) {
    return null;
  }

  const channel = await interaction.guild.channels.fetch(config.lagerListChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return null;

  const items = inventoryStore.getAll();
  const embed = baseEmbed(interaction.client)
    .setColor('#FEE75C')
    .setTitle('📦 Lagerliste')
    .setDescription(
      items.length === 0
        ? 'Das Lager ist aktuell leer.'
        : items.map(i => `**${i.name}** — ${i.quantity}x`).join('\n')
    );

  const existingMessageId = inventoryStore.getListMessageId();
  if (existingMessageId) {
    const existingMessage = await channel.messages.fetch(existingMessageId).catch(() => null);
    if (existingMessage) {
      await existingMessage.edit({ embeds: [embed] });
      return channel;
    }
  }

  const message = await channel.send({ embeds: [embed] });
  inventoryStore.setListMessageId(message.id);
  return channel;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lager')
    .setDescription('Lagerbestand verwalten')
    .addSubcommand(sub =>
      sub
        .setName('rein')
        .setDescription('Legt Items ins Lager')
        .addStringOption(o => o.setName('item').setDescription('Name des Items').setRequired(true))
        .addIntegerOption(o => o.setName('menge').setDescription('Menge').setRequired(true).setMinValue(1))
    )
    .addSubcommand(sub =>
      sub
        .setName('raus')
        .setDescription('Nimmt Items aus dem Lager')
        .addStringOption(o =>
          o.setName('item').setDescription('Name des Items').setRequired(true).setAutocomplete(true)
        )
        .addIntegerOption(o => o.setName('menge').setDescription('Menge').setRequired(true).setMinValue(1))
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const choices = inventoryStore.getAll()
      .filter(i => i.name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map(i => ({ name: `${i.name} (${i.quantity}x vorhanden)`, value: i.name }));

    await interaction.respond(choices);
  },

  async execute(interaction) {
    // Eigene Channel-Sperre statt der globalen commandChannelId -
    // Lager-Commands duerfen NUR in lagerCommandChannelId benutzt werden.
    if (
      config.lagerCommandChannelId &&
      !config.lagerCommandChannelId.startsWith('CHANNEL_ID') &&
      interaction.channelId !== config.lagerCommandChannelId
    ) {
      await interaction.reply({
        embeds: [errorEmbed(`Lager-Befehle können nur in <#${config.lagerCommandChannelId}> benutzt werden.`, interaction.client)],
        ephemeral: true
      });
      return;
    }

    if (!canUseAdminCommands(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const sub = interaction.options.getSubcommand();
    const item = interaction.options.getString('item').trim();
    const menge = interaction.options.getInteger('menge');

    if (sub === 'rein') {
      const total = inventoryStore.addStock(item, menge);
      await postInventoryList(interaction);

      await interaction.reply({
        embeds: [successEmbed(`**${menge}x ${item}** wurde ins Lager gelegt. Neuer Bestand: **${total}x**.`, interaction.client)],
        ephemeral: true
      });
      return;
    }

    if (sub === 'raus') {
      const total = inventoryStore.removeStock(item, menge);

      if (total === null) {
        await interaction.reply({
          embeds: [errorEmbed(`**${item}** ist nicht im Lager oder der Bestand reicht nicht aus.`, interaction.client)],
          ephemeral: true
        });
        return;
      }

      await postInventoryList(interaction);

      await interaction.reply({
        embeds: [successEmbed(`**${menge}x ${item}** wurde aus dem Lager genommen. Neuer Bestand: **${total}x**.`, interaction.client)],
        ephemeral: true
      });
    }
  }
};

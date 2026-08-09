const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { canUseAdminCommands } = require('../utils/permissions');
const funkStore = require('../utils/funkStore');

async function postFunkList(interaction) {
  if (!config.funkListChannelId || config.funkListChannelId.startsWith('CHANNEL_ID')) {
    return null;
  }

  const channel = await interaction.guild.channels.fetch(config.funkListChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return null;

  const { funk, passwort } = funkStore.get();
  const embed = baseEmbed(interaction.client)
    .setColor('#5865F2')
    .setTitle('📻 Funkliste')
    .addFields(
      { name: 'Funk', value: funk || 'Noch nicht gesetzt', inline: true },
      { name: 'Passwort', value: passwort || 'Noch nicht gesetzt', inline: true }
    );

  const pingRoleId = '1535782072491180153';
  const content = `<@&${pingRoleId}>`;

  const existingMessageId = funkStore.getListMessageId();
  if (existingMessageId) {
    const existingMessage = await channel.messages.fetch(existingMessageId).catch(() => null);
    if (existingMessage) {
      await existingMessage.edit({ content, embeds: [embed] });
      return channel;
    }
  }

  const message = await channel.send({ content, embeds: [embed] });
  funkStore.setListMessageId(message.id);
  return channel;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('funk')
    .setDescription('Ändert Funk-Frequenz und Passwort')
    .addStringOption(o => o.setName('funk').setDescription('Neue Funk-Frequenz').setRequired(true))
    .addStringOption(o => o.setName('passwort').setDescription('Neues Passwort').setRequired(true)),

  async execute(interaction) {
    if (!canUseAdminCommands(interaction.member)) {
      await interaction.reply({
        embeds: [errorEmbed('Du hast keine Berechtigung, diesen Befehl zu benutzen.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    const funk = interaction.options.getString('funk');
    const passwort = interaction.options.getString('passwort');

    funkStore.set(funk, passwort);
    const channel = await postFunkList(interaction);

    if (!channel) {
      await interaction.reply({
        embeds: [errorEmbed('Funk/Passwort gespeichert, aber der Funkliste-Channel (`funkListChannelId`) wurde nicht gefunden.', interaction.client)],
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      embeds: [successEmbed(`Funk wurde auf **${funk}** und Passwort auf **${passwort}** geändert. Liste in ${channel} aktualisiert.`, interaction.client)],
      ephemeral: true
    });
  }
};

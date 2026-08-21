const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChannelType,
  PermissionFlagsBits
} = require('discord.js');
const config = require('../config.json');
const { baseEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const clipStore = require('../utils/clipStore');
const absenceStore = require('../utils/absenceStore');
const { updateAbsencePanel, notifyNewAbsence } = require('../utils/absencePanel');
const klamottenStore = require('../utils/klamottenStore');
const { updateKlamottenPanel, CATEGORY_LABELS } = require('../utils/klamottenPanel');
const abstimmungStore = require('../utils/abstimmungStore');
const { buildPollEmbed, buildPollRow } = require('../utils/abstimmungPanel');
const autofarbeStore = require('../utils/autofarbeStore');
const { updateAutofarbePanel, CATEGORY_LABELS: AUTOFARBE_CATEGORY_LABELS } = require('../utils/autofarbePanel');
const aufstellungStore = require('../utils/aufstellungStore');
const { buildAufstellungEmbed, buildAufstellungRow } = require('../utils/aufstellungPanel');

function sanitizeChannelName(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_äöüß]/g, '')
    .slice(0, 80) || 'clip';
}

// Baut "name: wert"-Paare aus den Command-Optionen, auch bei Subcommands
// (eine Ebene tief - reicht für alle aktuellen Commands).
function summarizeCommandOptions(interaction) {
  const data = interaction.options.data;
  const flatOptions = data.length === 1 && Array.isArray(data[0].options)
    ? data[0].options
    : data;
  return flatOptions.map(opt => `${opt.name}: ${opt.value}`).join(', ') || '—';
}

async function logCommandExecution(interaction) {
  const subcommand = interaction.options.getSubcommand(false);
  const fullName = subcommand ? `${interaction.commandName} ${subcommand}` : interaction.commandName;

  const embed = baseEmbed(interaction.client)
    .setColor('#5865F2')
    .setTitle('⚙️ Command ausgeführt')
    .addFields(
      { name: 'Command', value: `\`/${fullName}\``, inline: true },
      { name: 'Nutzer', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
      { name: 'Channel', value: `${interaction.channel}`, inline: true },
      { name: 'Optionen', value: summarizeCommandOptions(interaction).slice(0, 1024), inline: false }
    );

  await sendLog(interaction.client, embed);
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    const { client } = interaction;

    // Autocomplete für Slash-Command-Optionen
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command || !command.autocomplete) return;
      try {
        await command.autocomplete(interaction);
      } catch (err) {
        console.error('Fehler bei Autocomplete:', err);
      }
      return;
    }

    // Commands mit eigener, abweichender Channel-Sperre (statt der globalen
    // commandChannelId) - prüfen ihren erlaubten Channel selbst in execute().
    const COMMANDS_WITH_OWN_CHANNEL_LOCK = ['lager'];

    // Slash-Commands
    if (interaction.isChatInputCommand()) {
      if (
        config.commandChannelId &&
        !config.commandChannelId.startsWith('CHANNEL_ID') &&
        interaction.channelId !== config.commandChannelId &&
        !COMMANDS_WITH_OWN_CHANNEL_LOCK.includes(interaction.commandName)
      ) {
        await interaction.reply({
          embeds: [errorEmbed(`Befehle können nur in <#${config.commandChannelId}> benutzt werden.`, client)],
          ephemeral: true
        });
        return;
      }

      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      logCommandExecution(interaction).catch(err => {
        console.error('Fehler beim Loggen der Command-Ausführung:', err.message);
      });

      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(err);
        const payload = { embeds: [errorEmbed('Beim Ausführen des Befehls ist ein Fehler aufgetreten.', client)], ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload);
        } else {
          await interaction.reply(payload);
        }
      }
      return;
    }

    // Button: Clip-Channel erstellen -> Modal öffnen
    if (interaction.isButton() && interaction.customId === 'create_clip_channel') {
      const existingChannelId = clipStore.getUserChannel(interaction.user.id);
      if (existingChannelId) {
        const existingChannel = await interaction.guild.channels.fetch(existingChannelId).catch(() => null);
        if (existingChannel) {
          if (!clipStore.isUnlocked(interaction.user.id)) {
            await interaction.reply({
              embeds: [errorEmbed(
                `Du hast bereits einen Clip-Channel: ${existingChannel}\nEin Administrator muss dich mit \`/clip-unlock\` freischalten, bevor du einen weiteren erstellen kannst.`,
                client
              )],
              ephemeral: true
            });
            return;
          }
        } else {
          // Channel existiert nicht mehr (z. B. manuell gelöscht) -> Eintrag entfernen
          clipStore.removeUserChannel(interaction.user.id);
        }
      }

      const modal = new ModalBuilder()
        .setCustomId('clip_channel_modal')
        .setTitle('Clip-Channel erstellen');

      const nameInput = new TextInputBuilder()
        .setCustomId('channel_name')
        .setLabel('Wie soll dein Clip-Channel heißen?')
        .setStyle(TextInputStyle.Short)
        .setMinLength(2)
        .setMaxLength(50)
        .setPlaceholder('z. B. mein-clip')
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
      await interaction.showModal(modal);
      return;
    }

    // Modal-Submit: Channel tatsächlich erstellen
    if (interaction.isModalSubmit() && interaction.customId === 'clip_channel_modal') {
      await interaction.deferReply({ ephemeral: true });

      const rawName = interaction.fields.getTextInputValue('channel_name');
      const channelName = `🔫clip-${sanitizeChannelName(rawName)}`;
      const guild = interaction.guild;

      try {
        const categoryId = config.clipCategoryId && !config.clipCategoryId.startsWith('KATEGORIE_ID')
          ? config.clipCategoryId
          : null;
        const category = categoryId ? await guild.channels.fetch(categoryId).catch(() => null) : null;

        // Mit der Kategorie synchronisieren: ihre Overwrites übernehmen (wie
        // Discords "Berechtigungen synchronisieren"), danach Ersteller & Bot ergänzen.
        const overwrites = category
          ? category.permissionOverwrites.cache.map(ow => ({
              id: ow.id,
              type: ow.type,
              allow: ow.allow.bitfield,
              deny: ow.deny.bitfield
            }))
          : [];

        const upsertOverwrite = (id, type, allowPerms) => {
          const idx = overwrites.findIndex(o => o.id === id);
          if (idx >= 0) {
            overwrites[idx] = { id, type, allow: allowPerms, deny: [] };
          } else {
            overwrites.push({ id, type, allow: allowPerms, deny: [] });
          }
        };

        upsertOverwrite(interaction.user.id, 1, [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks
        ]);

        upsertOverwrite(client.user.id, 1, [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ReadMessageHistory
        ]);

        const newChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: category ? category.id : undefined,
          permissionOverwrites: overwrites,
          topic: `Privater Clip-Channel von ${interaction.user.tag}`
        });

        const welcomeEmbed = baseEmbed(client)
          .setTitle('🎬 Dein Clip-Channel')
          .setDescription(`Willkommen ${interaction.user}! Dies ist dein Clip-Channel.\nDu und Administratoren können hier immer schreiben, die restlichen Berechtigungen sind mit der Kategorie synchronisiert.`);
        await newChannel.send({ embeds: [welcomeEmbed] });

        clipStore.setUserChannel(interaction.user.id, newChannel.id);
        clipStore.consumeUnlock(interaction.user.id);

        await interaction.editReply({
          embeds: [successEmbed(`Dein Clip-Channel wurde erstellt: ${newChannel}`, client)]
        });

        const logEmbed = baseEmbed(client)
          .setColor('#57F287')
          .setTitle('🎬 Clip-Channel erstellt')
          .addFields(
            { name: 'Ersteller', value: `${interaction.user} (${interaction.user.tag})`, inline: false },
            { name: 'Channel', value: `${newChannel}`, inline: false },
            { name: 'ID', value: `${newChannel.id}`, inline: false }
          );
        await sendLog(client, logEmbed);
      } catch (err) {
        console.error('Fehler beim Erstellen des Clip-Channels:', err);
        await interaction.editReply({
          embeds: [errorEmbed('Der Clip-Channel konnte nicht erstellt werden. Bitte prüfe die Bot-Berechtigungen und die Konfiguration.', client)]
        });
      }
      return;
    }

    // Button: Abmelden -> Modal öffnen
    if (interaction.isButton() && interaction.customId === 'create_absence') {
      const modal = new ModalBuilder()
        .setCustomId('absence_modal')
        .setTitle('Abmelden');

      const reasonInput = new TextInputBuilder()
        .setCustomId('grund')
        .setLabel('Grund')
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(300)
        .setRequired(true);

      const dateInput = new TextInputBuilder()
        .setCustomId('datum')
        .setLabel('Datum, bis wann (TT.MM.JJJJ)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('z. B. 25.12.2026')
        .setRequired(true);

      const timeInput = new TextInputBuilder()
        .setCustomId('uhrzeit')
        .setLabel('Uhrzeit, bis wann (HH:MM)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('z. B. 18:00')
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(reasonInput),
        new ActionRowBuilder().addComponents(dateInput),
        new ActionRowBuilder().addComponents(timeInput)
      );

      await interaction.showModal(modal);
      return;
    }

    // Button: Zurückmelden -> eigene Abmeldung entfernen
    if (interaction.isButton() && interaction.customId === 'remove_absence') {
      const removed = absenceStore.removeAbsence(interaction.user.id);

      if (!removed) {
        await interaction.reply({
          embeds: [errorEmbed('Du bist aktuell nicht abgemeldet.', client)],
          ephemeral: true
        });
        return;
      }

      await updateAbsencePanel(client);

      await interaction.reply({
        embeds: [successEmbed('Du wurdest zurückgemeldet und aus der Abmeldungsliste entfernt.', client)],
        ephemeral: true
      });
      return;
    }

    // Modal-Submit: Abmeldung speichern
    if (interaction.isModalSubmit() && interaction.customId === 'absence_modal') {
      const grund = interaction.fields.getTextInputValue('grund');
      const datum = interaction.fields.getTextInputValue('datum').trim();
      const uhrzeit = interaction.fields.getTextInputValue('uhrzeit').trim();

      const dateMatch = datum.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      const timeMatch = uhrzeit.match(/^(\d{1,2}):(\d{2})$/);

      if (!dateMatch || !timeMatch) {
        await interaction.reply({
          embeds: [errorEmbed('Bitte gib das Datum im Format TT.MM.JJJJ und die Uhrzeit im Format HH:MM an.', client)],
          ephemeral: true
        });
        return;
      }

      const [, day, month, year] = dateMatch;
      const [, hour, minute] = timeMatch;
      const until = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));

      if (Number.isNaN(until.getTime()) || Number(hour) > 23 || Number(minute) > 59) {
        await interaction.reply({
          embeds: [errorEmbed('Das Datum oder die Uhrzeit ist ungültig.', client)],
          ephemeral: true
        });
        return;
      }

      if (until.getTime() <= Date.now()) {
        await interaction.reply({
          embeds: [errorEmbed('Der angegebene Zeitpunkt liegt in der Vergangenheit.', client)],
          ephemeral: true
        });
        return;
      }

      absenceStore.addAbsence({
        userId: interaction.user.id,
        tag: interaction.user.tag,
        reason: grund,
        until: until.getTime(),
        createdAt: Date.now()
      });

      await updateAbsencePanel(client);
      await notifyNewAbsence(client, interaction.user.id, grund, until.getTime());

      const unix = Math.floor(until.getTime() / 1000);
      await interaction.reply({
        embeds: [successEmbed(`Du bist jetzt abgemeldet bis <t:${unix}:f>. Danach wirst du automatisch wieder aus der Liste entfernt.`, client)],
        ephemeral: true
      });
      return;
    }

    // Button: Abstimmung - Ja/Nein
    if (interaction.isButton() && (interaction.customId === 'abstimmung_ja' || interaction.customId === 'abstimmung_nein')) {
      const poll = abstimmungStore.getActive();

      if (!poll || poll.messageId !== interaction.message.id) {
        await interaction.reply({
          embeds: [errorEmbed('Diese Abstimmung ist nicht mehr aktiv.', client)],
          ephemeral: true
        });
        return;
      }

      const userId = interaction.user.id;
      const choice = interaction.customId === 'abstimmung_ja' ? 'ja' : 'nein';

      poll.ja = poll.ja.filter(id => id !== userId);
      poll.nein = poll.nein.filter(id => id !== userId);
      poll[choice].push(userId);

      abstimmungStore.setActive(poll);

      await interaction.update({
        embeds: [buildPollEmbed(client, poll)],
        components: [buildPollRow()]
      });
      return;
    }

    // Select-Menu: Klamotten-Kategorie wählen -> Modal öffnen
    if (interaction.isStringSelectMenu() && interaction.customId === 'klamotten_select') {
      const category = interaction.values[0];
      const label = CATEGORY_LABELS[category] || category;

      const modal = new ModalBuilder()
        .setCustomId(`klamotten_modal_${category}`)
        .setTitle(`${label} aktualisieren`);

      const valueInput = new TextInputBuilder()
        .setCustomId('wert')
        .setLabel(`Neuer Wert für ${label}`)
        .setStyle(TextInputStyle.Short)
        .setMaxLength(100)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(valueInput));
      await interaction.showModal(modal);
      return;
    }

    // Modal-Submit: Klamotten-Wert speichern
    if (interaction.isModalSubmit() && interaction.customId.startsWith('klamotten_modal_')) {
      const category = interaction.customId.replace('klamotten_modal_', '');
      const label = CATEGORY_LABELS[category] || category;
      const wert = interaction.fields.getTextInputValue('wert').trim();

      klamottenStore.set(category, wert);
      const channel = await updateKlamottenPanel(client);

      await interaction.reply({
        embeds: [successEmbed(
          channel
            ? `**${label}** wurde auf **${wert}** gesetzt. Panel in ${channel} aktualisiert.`
            : `**${label}** wurde auf **${wert}** gesetzt, aber der Klamotten-Channel (\`klamottenListChannelId\`) wurde nicht gefunden.`,
          client
        )],
        ephemeral: true
      });
      return;
    }

    // Select-Menu: Autofarbe-Kategorie wählen -> Modal öffnen
    if (interaction.isStringSelectMenu() && interaction.customId === 'autofarbe_select') {
      const category = interaction.values[0];
      const label = AUTOFARBE_CATEGORY_LABELS[category] || category;

      const modal = new ModalBuilder()
        .setCustomId(`autofarbe_modal_${category}`)
        .setTitle(`${label} aktualisieren`);

      const valueInput = new TextInputBuilder()
        .setCustomId('wert')
        .setLabel(`Neuer Wert für ${label}`)
        .setStyle(TextInputStyle.Short)
        .setMaxLength(100)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(valueInput));
      await interaction.showModal(modal);
      return;
    }

    // Modal-Submit: Autofarbe-Wert speichern
    if (interaction.isModalSubmit() && interaction.customId.startsWith('autofarbe_modal_')) {
      const category = interaction.customId.replace('autofarbe_modal_', '');
      const label = AUTOFARBE_CATEGORY_LABELS[category] || category;
      const wert = interaction.fields.getTextInputValue('wert').trim();

      autofarbeStore.set(category, wert);
      const channel = await updateAutofarbePanel(client);

      await interaction.reply({
        embeds: [successEmbed(
          channel
            ? `**${label}** wurde auf **${wert}** gesetzt. Panel in ${channel} aktualisiert.`
            : `**${label}** wurde auf **${wert}** gesetzt, aber der Autofarbe-Channel (\`autofarbeListChannelId\`) wurde nicht gefunden.`,
          client
        )],
        ephemeral: true
      });
      return;
    }

    // Button: Aufstellung - Da/Nicht da
    if (interaction.isButton() && (interaction.customId === 'aufstellung_da' || interaction.customId === 'aufstellung_nicht_da')) {
      const poll = aufstellungStore.getPoll(interaction.message.id);

      if (!poll) {
        await interaction.reply({
          embeds: [errorEmbed('Diese Aufstellung wird nicht mehr getrackt.', client)],
          ephemeral: true
        });
        return;
      }

      const choice = interaction.customId === 'aufstellung_da' ? 'da' : 'nichtDa';
      const updated = aufstellungStore.setVote(interaction.message.id, interaction.user.id, choice);

      await interaction.update({
        embeds: [buildAufstellungEmbed(client, poll.unix, updated, poll.grund)],
        components: [buildAufstellungRow()]
      });
    }
  }
};

const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const user = newState.member?.user || oldState.member?.user;
    if (!user) return;

    let title = null;
    let description = null;

    if (!oldState.channel && newState.channel) {
      title = '🔊 Voice-Channel beigetreten';
      description = `${user} ist ${newState.channel} beigetreten.`;
    } else if (oldState.channel && !newState.channel) {
      title = '🔇 Voice-Channel verlassen';
      description = `${user} hat ${oldState.channel} verlassen.`;
    } else if (oldState.channelId !== newState.channelId) {
      title = '🔀 Voice-Channel gewechselt';
      description = `${user} ist von ${oldState.channel} zu ${newState.channel} gewechselt.`;
    } else if (oldState.mute !== newState.mute || oldState.deaf !== newState.deaf) {
      title = '🎙️ Voice-Status geändert';
      const changes = [];
      if (oldState.mute !== newState.mute) changes.push(`Stummgeschaltet: ${newState.mute}`);
      if (oldState.deaf !== newState.deaf) changes.push(`Taub geschaltet: ${newState.deaf}`);
      description = `${user} in ${newState.channel}: ${changes.join(', ')}`;
    } else {
      return;
    }

    const embed = baseEmbed(user.client)
      .setColor('#5865F2')
      .setTitle(title)
      .setDescription(description);

    await sendLog(user.client, embed);
  }
};

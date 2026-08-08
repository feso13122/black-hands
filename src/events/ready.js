module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Eingeloggt als ${client.user.tag}`);
    client.user.setActivity('über den Server', { type: 3 });
  }
};

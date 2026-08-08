const axios = require('axios');

let accessToken = '';

async function refreshAccessToken() {
  try {
    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_SECRET,
        grant_type: 'client_credentials'
      }
    });
    accessToken = response.data.access_token;
    console.log('🔑 Twitch Access Token erhalten');
  } catch (err) {
    console.error('❌ Fehler beim Holen des Twitch Tokens:', err.message);
  }
}

async function getStream(username) {
  try {
    const response = await axios.get('https://api.twitch.tv/helix/streams', {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`
      },
      params: { user_login: username }
    });
    return response.data.data.length > 0 ? response.data.data[0] : null;
  } catch (err) {
    console.error(`❌ Fehler beim Prüfen von ${username}:`, err.message);
    return null;
  }
}

async function getUser(username) {
  try {
    const response = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`
      },
      params: { login: username }
    });
    return response.data.data.length > 0 ? response.data.data[0] : null;
  } catch (err) {
    console.error(`❌ Fehler beim Holen der User-Info für ${username}:`, err.message);
    return null;
  }
}

module.exports = { refreshAccessToken, getStream, getUser };

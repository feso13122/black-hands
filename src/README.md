# Discord Bot

Ein Discord.js-Bot mit:
- Willkommens- & Verlassen-Nachrichten als Embed
- Clip-Channel-Button (Modal fragt nach einem Namen, erstellt einen privaten Channel — nur der Ersteller und Administratoren können dort schreiben). Jeder Nutzer darf maximal einen Clip-Channel gleichzeitig haben, danach muss ein Administrator ihn per `/clip-unlock` für einen weiteren freischalten.
- Autorole-System (automatische Rolle bei Beitritt)
- Komplettes Logging-System (Nachrichten bearbeitet/gelöscht, Mitglied beigetreten/verlassen, Bans, Channel- & Rollen-Änderungen, Clip-Channel-Erstellung/-Freischaltung)
- Bündnis-Commands (`/bundnisse`, `/auflosung`) für vorgefertigte Bündnis-Ankündigungen
- Zentrale `config.json` für alle Channel-/Rollen-IDs, Token separat in `.env`

## Setup

1. **Bot erstellen**: Gehe zum [Discord Developer Portal](https://discord.com/developers/applications) → New Application → Bot.
   - Aktiviere unter "Privileged Gateway Intents": **SERVER MEMBERS INTENT** und **MESSAGE CONTENT INTENT**.
   - Kopiere den Bot-**Token** und die **Application ID** (Client ID).

2. **Bot einladen**: Erstelle einen Invite-Link unter OAuth2 → URL Generator.
   - Scopes: `bot`, `applications.commands`
   - Bot-Permissions mindestens: `Manage Channels`, `Manage Roles`, `View Channels`, `Send Messages`, `Embed Links`, `Read Message History`, `Ban Members` (für Ban-Logs).
   - Wichtig: Die Rolle des Bots muss in der Rollenliste **über** der Autorole stehen, damit er sie vergeben kann.

3. **Abhängigkeiten installieren**:
   ```bash
   npm install
   ```

4. **`.env` ausfüllen** (liegt eine Ebene über `src/`, im Projekt-Root neben `docker-compose.yml`):
   - `BOT_TOKEN` = dein Bot-Token
   - `BOT_CLIENTID` = die Application/Client-ID
   - `BOT_GUILDID` = die ID deines Servers

5. **`config.json` ausfüllen** (Rechtsklick auf Server/Channel/Rolle → "ID kopieren", Entwicklermodus muss in Discord aktiviert sein):
   - `welcomeChannelId`, `leaveChannelId`, `logChannelId`
   - `clipPanelChannelId` (informativ, das Panel wird per Command gepostet), `clipCategoryId` (Kategorie, in der neue Clip-Channels erstellt werden)
   - `autoRoleId`
   - `commandRoleIds` (Liste von Rollen-IDs, die `/setup-clip-panel`, `/clip-unlock`, `/bundnisse` und `/auflosung` benutzen dürfen — Administratoren dürfen unabhängig davon immer)
   - `allianceChannelId` (Channel, in den `/bundnisse` und `/auflosung` posten), `allianceRoleId` (Rolle, die dabei immer erwähnt wird)

   Diese Datei kannst du jederzeit ersetzen/neu einspielen — das Clip-Channel-Tracking liegt bewusst getrennt in `data/clipData.json` und bleibt davon unberührt. Bei Docker/Portainer wird `config.json` **nicht** als Volume gemountet, sondern kommt aus dem Image (Dockerfile `COPY`) — nach einer Änderung also committen, pushen und den Stack neu bauen lassen.

6. **Slash-Commands registrieren**: Das passiert automatisch bei jedem Start (siehe Schritt 7) — `ready.js` registriert beim Login alle Commands aus `commands/` neu und listet sie in der Konsole auf. Manuell/vorab geht es weiterhin mit:
   ```bash
   npm run deploy
   ```

7. **Bot starten**:
   ```bash
   npm start
   ```

   Oder per Docker vom Projekt-Root aus: `docker compose up -d --build`.

## Clip-Channel-Panel posten

Nutze in dem gewünschten Channel den Befehl `/setup-clip-panel` (nur für Administratoren oder Rollen aus `commandRoleIds`). Das postet ein Embed mit einem Button. Klickt jemand darauf, öffnet sich ein Modal, in dem der Name für den neuen Channel eingegeben wird. Der Channel wird als `🔫clip-<name>` unter `clipCategoryId` erstellt und ist **mit der Kategorie synchronisiert** (wie Discords "Berechtigungen synchronisieren"):

- Alle Berechtigungen/Rollen, die auf der Kategorie `clipCategoryId` eingestellt sind, werden 1:1 auf den neuen Channel übernommen.
- Zusätzlich bekommt der **Ersteller** immer: sehen, schreiben, Verlauf lesen, Dateien anhängen.
- Der **Bot** bekommt immer: sehen, schreiben, verwalten.

Wichtig: Die Sichtbarkeit für alle anderen hängt jetzt von der Kategorie ab. Willst du, dass wirklich nur der Ersteller (und Admins) den Channel sehen, muss `@everyone` auf `clipCategoryId` selbst auf "Kanal anzeigen: Verweigern" stehen. Nutzer mit der Berechtigung **Administrator** sehen laut Discords Rechtesystem ohnehin automatisch **alle** Channels, unabhängig von den gesetzten Overwrites.

**Limit auf 1 Channel:** Hat ein Nutzer bereits einen (noch existierenden) Clip-Channel, wird beim Klick auf den Button abgelehnt, solange er nicht freigeschaltet ist. Ein Administrator schaltet mit `/clip-unlock nutzer:<@Nutzer>` einmalig einen weiteren Channel frei — die Freischaltung wird beim nächsten Erstellen automatisch wieder verbraucht. Wurde der bisherige Channel manuell gelöscht, erkennt der Bot das automatisch und erlaubt sofort wieder einen neuen.

## Bündnis-Commands

- `/bundnisse fraktion:<Name>` postet "Ab heute sind wir im Bündnis mit der **<Name>** Fraktion." in `allianceChannelId` und erwähnt dabei `allianceRoleId`.
- `/auflosung fraktion:<Name>` postet entsprechend die Auflösung des Bündnisses.

Beide sind wie `/setup-clip-panel`/`/clip-unlock` auf Administratoren und `commandRoleIds` beschränkt. `allianceRoleId` ist aktuell dieselbe Rolle wie `autoRoleId` — jedes neue Mitglied bekommt sie automatisch, wodurch die Erwähnung effektiv den ganzen Server pingt.

## Projektstruktur

```
black hands/
├── .env                     BOT_TOKEN, BOT_CLIENTID, BOT_GUILDID (Secrets, nicht in Git)
├── docker-compose.yml
├── Dockerfile
└── src/
    ├── index.js               Bot-Einstiegspunkt, lädt Events & Commands
    ├── deploy-commands.js      Registriert Slash-Commands manuell/vorab (optional, passiert sonst automatisch in ready.js)
    ├── config.json             Alle IDs & Einstellungen (kein Token)
    ├── data/
    │   └── clipData.json       Wer hat einen Clip-Channel / wer ist freigeschaltet
    ├── commands/
    │   ├── setup-clip-panel.js Postet das Clip-Channel-Panel
    │   ├── clip-unlock.js      Admin-Befehl: weiteren Clip-Channel freischalten
    │   ├── bundnisse.js        Bündnis-Ankündigung posten
    │   └── auflosung.js        Bündnis-Auflösung posten
    ├── events/
    │   ├── ready.js
    │   ├── guildMemberAdd.js   Willkommen + Autorole + Log
    │   ├── guildMemberRemove.js Leave + Log
    │   ├── interactionCreate.js Button/Modal/Slash-Command-Handling
    │   ├── messageDelete.js
    │   ├── messageUpdate.js
    │   ├── guildBanAdd.js
    │   ├── guildBanRemove.js
    │   ├── channelCreate.js
    │   ├── channelDelete.js
    │   ├── roleCreate.js
    │   ├── roleDelete.js
    │   └── guildMemberUpdate.js Log bei Rollenänderungen
    └── utils/
        ├── embeds.js            Embed-Helper
        ├── logger.js            Sendet Log-Embeds in den Log-Channel
        ├── clipStore.js         Lesen/Schreiben von data/clipData.json
        ├── permissions.js       Rollen-/Admin-Check für geschützte Commands
        └── deployCommands.js    Registriert Slash-Commands bei Discord (von ready.js aufgerufen)
```

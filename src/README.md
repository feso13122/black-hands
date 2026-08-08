# Discord Bot

Ein Discord.js-Bot mit:
- Willkommens- & Verlassen-Nachrichten als Embed
- Clip-Channel-Button (Modal fragt nach einem Namen, erstellt einen privaten Channel — nur der Ersteller und Administratoren können dort schreiben). Jeder Nutzer darf maximal einen Clip-Channel gleichzeitig haben, danach muss ein Administrator ihn per `/clip-unlock` für einen weiteren freischalten.
- Autorole-System (automatische Rolle bei Beitritt)
- Komplettes Logging-System (Nachrichten bearbeitet/gelöscht, Mitglied beigetreten/verlassen, Bans, Channel- & Rollen-Änderungen, Clip-Channel-Erstellung/-Freischaltung)
- Bündnis-Commands (`/bundnisse`, `/auflosung`) für vorgefertigte Bündnis-Ankündigungen
- Sanktions-System (`/sanktion add`, `/sanktion bezahlt`) mit automatisch gepflegter Sanktionsliste
- Abmelde-System mit Panel-Button, Modal (Grund/Datum/Uhrzeit) und automatischem Entfernen abgelaufener Abmeldungen
- `/command-liste` postet eine automatisch generierte Übersicht aller Befehle
- Alle Slash-Commands sind auf einen einzigen Channel gesperrt (`commandChannelId`)
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
   - `commandRoleIds` (Liste von Rollen-IDs, die `/setup-clip-panel` und `/clip-unlock` benutzen dürfen — Administratoren dürfen unabhängig davon immer)
   - `allianceChannelId` (Channel, in den `/bundnisse` und `/auflosung` posten), `allianceRoleId` (Rolle, die dabei immer erwähnt wird)
   - `sanctionListChannelId` (Channel für die laufend aktualisierte Sanktionsliste), `sanctionPaidChannelId` (Channel für Bezahlt-Bestätigungen), `sanctionAddChannelId` (Channel für Benachrichtigungen bei neuen Sanktionen)
   - `allianceSanctionRoleIds` (zusätzliche Rollen-IDs, die **nur** `/bundnisse`, `/auflosung` und `/sanktion` benutzen dürfen, unabhängig von `commandRoleIds`)
   - `absenceChannelId` (Channel für das Abmelde-Panel mit der Liste aller Abgemeldeten)
   - `commandListChannelId` (Channel, in den `/command-liste` die Befehlsübersicht postet)
   - `commandChannelId` (einziger Channel, in dem überhaupt irgendein Slash-Command benutzt werden darf — siehe unten)

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

**Clip-Channel entfernen:** `/clip-remove nutzer:<...>` löscht den Discord-Channel des Nutzers direkt und entfernt den Tracking-Eintrag, sodass der Nutzer danach sofort wieder einen neuen Clip-Channel erstellen kann (ohne `/clip-unlock`). Das `nutzer`-Feld ist ein Autocomplete-Feld und schlägt nur Nutzer vor, für die aktuell wirklich ein Clip-Channel in `data/clipData.json` gespeichert ist.

## Bündnis-Commands

- `/bundnisse fraktion:<Name>` postet "Ab heute sind wir im Bündnis mit der **<Name>** Fraktion." in `allianceChannelId`, erwähnt dabei `allianceRoleId` und speichert das Bündnis in `data/allianceData.json`.
- `/auflosung fraktion:<Name>` postet entsprechend die Auflösung des Bündnisses und entfernt es aus der gespeicherten Liste. Das `fraktion`-Feld ist ein Autocomplete-Feld und schlägt nur aktuell gespeicherte, aktive Bündnisse vor.

Beide sind auf Administratoren, `commandRoleIds` **und** `allianceSanctionRoleIds` beschränkt. `allianceRoleId` ist aktuell dieselbe Rolle wie `autoRoleId` — jedes neue Mitglied bekommt sie automatisch, wodurch die Erwähnung effektiv den ganzen Server pingt.

## Sanktions-System

- `/sanktion add nutzer:<@Nutzer> betrag:<Betrag> grund:<Grund> frist:<TT.MM.JJJJ>` speichert eine offene Sanktion für den Nutzer inklusive Zahlungsfrist, aktualisiert die Sanktionsliste-Nachricht in `sanctionListChannelId` **und** postet eine separate Benachrichtigung in `sanctionAddChannelId` (mit Feldern "Frist" und "Ausgestellt von"). Hat der Nutzer schon eine offene Sanktion, wird sie ersetzt.
- `/sanktion bezahlt nutzer:<...>` markiert die Sanktion als bezahlt, aktualisiert die Sanktionsliste-Nachricht (die Sanktion verschwindet dort) und postet eine Bestätigung in `sanctionPaidChannelId` (mit Feld "Bestätigt von"). Das `nutzer`-Feld ist ein Autocomplete-Feld und schlägt nur Nutzer mit einer aktuell offenen, gespeicherten Sanktion vor.
- `/sanktion list` aktualisiert die Sanktionsliste-Nachricht, ohne die Daten zu verändern.

Die Frist ist rein informativ (steht in Liste und Benachrichtigung) — es gibt **keine** automatische Entfernung, wenn sie verstreicht. Ein Eintrag verschwindet ausschließlich, wenn `/sanktion bezahlt` ausgeführt wird.

Sanktionen werden **nie gelöscht** — `bezahlt` markiert einen Eintrag nur als `status: "paid"` mit Zeitpunkt und Bestätiger, er bleibt als Historie in `data/sanctionsData.json` erhalten. Die Sanktionsliste-Nachricht zeigt nur die aktuell offenen Sanktionen. Bei jeder Aktion (`add`/`bezahlt`) wird außerdem gespeichert und angezeigt, wer sie ausgeführt hat (`issuedBy` bzw. `paidBy`).

Die Sanktionsliste ist **eine einzige Nachricht**, die immer bearbeitet statt neu gesendet wird (Message-ID wird in `data/sanctionsData.json` gemerkt). Wurde die Nachricht manuell gelöscht, erkennt der Bot das und postet automatisch eine neue.

Alle drei Subcommands sind wie die Bündnis-Commands auf Administratoren, `commandRoleIds` und `allianceSanctionRoleIds` beschränkt. Die Daten liegen getrennt von `config.json` in `data/sanctionsData.json` (wie beim Clip-Channel-Tracking).

## Abmelde-System

Nutze `/abmelde-panel` (nur für Administratoren oder Rollen aus `commandRoleIds`), um in `absenceChannelId` eine Nachricht zu posten: ein Embed mit der Liste aller aktuell Abgemeldeten und darunter zwei Buttons — **"Abmelden"** und **"Zurückmelden"**.

- Klickt jemand auf **"Abmelden"**, öffnet sich ein Modal mit **Grund**, **Datum** (`TT.MM.JJJJ`) und **Uhrzeit** (`HH:MM`), bis wann die Person abgemeldet ist.
- Nach dem Absenden wird die Abmeldung gespeichert und die Panel-Nachricht sofort mit dem neuen Eintrag aktualisiert (bearbeitet, nicht neu gepostet — wie bei der Sanktionsliste). Meldet sich jemand erneut ab, wird der alte Eintrag ersetzt.
- Klickt jemand auf **"Zurückmelden"**, wird die eigene Abmeldung sofort entfernt und das Panel aktualisiert — jeder kann so nur seine eigene Abmeldung vorzeitig beenden.
- Ein Hintergrund-Check läuft jede Minute: Ist die angegebene Zeit abgelaufen, wird der Eintrag automatisch aus der Liste entfernt und das Panel aktualisiert — ganz ohne weiteren Befehl.

Die Daten liegen in `data/absenceData.json`, komplett getrennt von `config.json`.

## Befehle auf einen Channel sperren

Ist `commandChannelId` gesetzt, kann **jeder** Slash-Command nur noch in genau diesem Channel ausgeführt werden — überall sonst antwortet der Bot ephemer mit einem Hinweis, in welchem Channel die Befehle erlaubt sind. Die Prüfung sitzt zentral in `interactionCreate.js`, bevor überhaupt ein einzelner Command aufgerufen wird.

Wichtig: Das betrifft auch Panel-Commands wie `/setup-clip-panel` und `/abmelde-panel`, die ihr Embed normalerweise in den Channel posten, in dem sie ausgeführt werden — die Panels landen dadurch ebenfalls in `commandChannelId`. Buttons/Modale (Clip-Channel erstellen, Abmelden/Zurückmelden) sind davon **nicht** betroffen, die funktionieren weiterhin in den jeweiligen Panel-Channels.

## Befehlsübersicht posten

`/command-liste` (nur für Administratoren oder Rollen aus `commandRoleIds`) liest alle aktuell registrierten Commands aus `client.commands` (inklusive Subcommands wie `/sanktion add`) und postet eine automatisch generierte Übersicht nach `commandListChannelId`. Es gibt keine feste, händisch gepflegte Liste — sie ist bei jedem Ausführen des Befehls aktuell.

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
    │   ├── clipData.json       Wer hat einen Clip-Channel / wer ist freigeschaltet
    │   ├── sanctionsData.json  Sanktionen (offen + Historie)
    │   ├── allianceData.json   Aktive Bündnisse
    │   └── absenceData.json    Aktuelle Abmeldungen
    ├── commands/
    │   ├── setup-clip-panel.js Postet das Clip-Channel-Panel
    │   ├── clip-unlock.js      Admin-Befehl: weiteren Clip-Channel freischalten
    │   ├── clip-remove.js      Admin-Befehl: Clip-Channel eines Nutzers entfernen
    │   ├── bundnisse.js        Bündnis-Ankündigung posten
    │   ├── auflosung.js        Bündnis-Auflösung posten
    │   ├── sanktion.js         /sanktion add, /sanktion bezahlt, /sanktion list
    │   ├── abmelde-panel.js    Postet/aktualisiert das Abmelde-Panel
    │   └── command-liste.js    Postet eine automatische Befehlsübersicht
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
        ├── sanctionStore.js     Lesen/Schreiben von data/sanctionsData.json
        ├── allianceStore.js     Lesen/Schreiben von data/allianceData.json
        ├── absenceStore.js      Lesen/Schreiben von data/absenceData.json
        ├── absencePanel.js      Baut/aktualisiert die Abmelde-Panel-Nachricht
        ├── absenceScheduler.js  Prüft minütlich auf abgelaufene Abmeldungen
        ├── permissions.js       Rollen-/Admin-Check für geschützte Commands
        └── deployCommands.js    Registriert Slash-Commands bei Discord (von ready.js aufgerufen)
```

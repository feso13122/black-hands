# Discord Bot

Ein Discord.js-Bot mit:
- Willkommens- & Verlassen-Nachrichten als Embed
- Clip-Channel-Button (Modal fragt nach einem Namen, erstellt einen privaten Channel — nur der Ersteller und Administratoren können dort schreiben). Jeder Nutzer darf maximal einen Clip-Channel gleichzeitig haben, danach muss ein Administrator ihn per `/clip-unlock` für einen weiteren freischalten.
- Autorole-System (automatische Rolle bei Beitritt)
- Umfassendes Logging-System: Nachrichten, Mitglieder, Channels, Rollen, Server, Threads, Voice, Einladungen, Emojis, Webhooks, Server-Events, Bans, Command-Ausführungen — praktisch alles, was Discord dem Bot meldet
- Bündnis-Commands (`/bundnisse`, `/auflosung`) für vorgefertigte Bündnis-Ankündigungen
- Sanktions-System (`/sanktion add`, `/sanktion bezahlt`) mit automatisch gepflegter Sanktionsliste
- Abmelde-System mit Panel-Button, Modal (Grund/Datum/Uhrzeit) und automatischem Entfernen abgelaufener Abmeldungen
- `/command-liste` postet eine automatisch generierte Übersicht aller Befehle
- Alle Slash-Commands sind auf einen einzigen Channel gesperrt (`commandChannelId`)
- Twitch-Live-Benachrichtigungen (`/addstreamer`, `/removestreamer`, `/streamers`) mit automatischem Live-Check
- `/test-willkommen` und `/test-leave` zum Testen der Willkommens-/Leave-Embeds, nur für den Bot-Owner
- Lager-System (`/lager rein`, `/lager raus`, `/lager liste`) mit eigener Channel-Sperre, Rollen-Berechtigung und Log-Channel
- `/serverstats` erstellt zwei Voice-Channels, die Mitgliederzahl und Rollen-Anzahl im Namen zeigen und sich automatisch aktualisieren
- `/funk` ändert Funk-Frequenz und Passwort und pflegt eine Funkliste-Nachricht
- `/klamotten` pflegt ein Kleidungs-Panel (Torso/Hose/Shirt/Aufkleber) über ein Auswahlmenü + Modal
- Blacklist-System (`/blacklist add`, `/blacklist remove`) mit automatisch gepflegter Liste
- Abstimmungs-System (`/abstimmung start`, `/abstimmung end`) mit Ja/Nein-Buttons
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
   - `TWITCH_CLIENT_ID` / `TWITCH_SECRET` = Zugangsdaten einer [Twitch-App](https://dev.twitch.tv/console/apps) (nur nötig für die Twitch-Live-Benachrichtigungen — ohne sie startet der Bot trotzdem, dieses Feature bleibt dann einfach deaktiviert)

5. **`config.json` ausfüllen** (Rechtsklick auf Server/Channel/Rolle → "ID kopieren", Entwicklermodus muss in Discord aktiviert sein):
   - `welcomeChannelId`, `leaveChannelId`, `logChannelId`
   - `clipPanelChannelId` (informativ, das Panel wird per Command gepostet), `clipCategoryId` (Kategorie, in der neue Clip-Channels erstellt werden)
   - `autoRoleId`
   - `commandRoleIds` (Liste von Rollen-IDs, die `/setup-clip-panel` und `/clip-unlock` benutzen dürfen — Administratoren dürfen unabhängig davon immer)
   - `allianceChannelId` (Channel, in den `/bundnisse` und `/auflosung` posten), `allianceRoleId` (Rolle, die dabei immer erwähnt wird)
   - `sanctionListChannelId` (Channel für die laufend aktualisierte Sanktionsliste), `sanctionPaidChannelId` (Channel für Bezahlt-Bestätigungen), `sanctionAddChannelId` (Channel für Benachrichtigungen bei neuen Sanktionen), `sanctionKatalogChannelId` (Channel für den festen Sanktionskatalog)
   - `allianceSanctionRoleIds` (zusätzliche Rollen-IDs, die **nur** `/bundnisse`, `/auflosung` und `/sanktion` benutzen dürfen, unabhängig von `commandRoleIds`)
   - `absenceChannelId` (Channel für das Abmelde-Panel mit der Liste aller Abgemeldeten)
   - `commandListChannelId` (Channel, in den `/command-liste` die Befehlsübersicht postet)
   - `commandChannelId` (einziger Channel, in dem überhaupt irgendein Slash-Command benutzt werden darf — siehe unten)
   - `twitchNotificationChannelId` (Channel für Live-Benachrichtigungen), `twitchPingRoleId` (Rolle, die dabei erwähnt wird), `twitchCheckIntervalMs` (wie oft geprüft wird, Standard 60000 = 1 Minute)
   - `lagerCommandChannelId` (einziger Channel, in dem `/lager rein`/`/lager raus` benutzt werden dürfen — für alle Nutzer offen), `lagerListChannelId` (Channel für die laufend aktualisierte Lagerliste), `lagerLogChannelId` (Channel für Rein/Raus-Logs), `lagerRoleIds` (zusätzliche Rollen-IDs, die `/lager liste` benutzen dürfen, unabhängig von `commandRoleIds`)
   - `serverStatsRoleId` (Rolle, deren Mitgliederzahl `/serverstats` im zweiten Stats-Channel anzeigt)
   - `funkListChannelId` (Channel für die Funkliste-Nachricht mit aktuellem Funk und Passwort)
   - `klamottenListChannelId` (Channel für das Klamotten-Panel mit Torso/Hose/Shirt/Aufkleber)
   - `blacklistListChannelId` (Channel für die laufend aktualisierte Blacklist)
   - `abstimmungChannelId` (Channel, in den `/abstimmung start` die Abstimmungs-Nachricht postet)

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
- `/sanktion katalog` postet/aktualisiert den festen Sanktionskatalog (Regelverstöße + Strafen, Zusatzregeln, Kurzversion) in `sanctionKatalogChannelId` — eine einzige Nachricht, die bearbeitet statt neu gesendet wird.

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

## Twitch-Live-Benachrichtigungen

- `/addstreamer username:<Name>` fügt einen Twitch-Namen zur Überwachungsliste hinzu (prüft vorher über die Twitch-API, ob der Name existiert).
- `/removestreamer username:<Name>` entfernt ihn wieder.
- `/streamers` zeigt die aktuelle Liste (ephemer, nur für dich sichtbar).

Alle drei sind auf Administratoren/`commandRoleIds` beschränkt. Im Hintergrund prüft der Bot alle `twitchCheckIntervalMs` (Standard 1 Minute) per Twitch-API, ob einer der gespeicherten Streamer live ist, und postet dann automatisch ein Embed mit Titel, Spiel, Zuschauerzahl und Vorschaubild in `twitchNotificationChannelId` (mit Erwähnung von `twitchPingRoleId`). Ohne `TWITCH_CLIENT_ID`/`TWITCH_SECRET` in der `.env` bleibt das Feature deaktiviert, der Rest des Bots läuft trotzdem normal weiter. Die Liste liegt in `data/twitchStreamers.json`.

## Test-Commands für Willkommen/Leave

`/test-willkommen` und `/test-leave` posten die exakt gleichen Embeds wie ein echter Beitritt/Austritt (inklusive aktuellem Server-Profilbild über `member.displayAvatarURL()`), ohne dass jemand wirklich beitreten/gehen muss — praktisch zum Prüfen, wie die Nachrichten aussehen. Optional per `nutzer`-Option mit einem anderen Mitglied testbar, sonst wird dein eigenes Profil verwendet. Beide sind fest auf die Discord-User-ID `1264008617586069586` beschränkt (nicht über Rollen, sondern hart im Code), unabhängig von `commandRoleIds` oder Administrator-Rechten.

## Lager-System

- `/lager rein item:<Name> menge:<Zahl>` legt Items ins Lager (legt das Item automatisch an, falls neu). **Jeder Nutzer** darf das, keine Rollen-Beschränkung — funktioniert aber ausschließlich in `lagerCommandChannelId`.
- `/lager raus item:<Name> menge:<Zahl>` nimmt Items raus — schlägt fehl, wenn nicht genug Bestand da ist. Das `item`-Feld ist ein Autocomplete-Feld und schlägt nur tatsächlich vorhandene Items mit ihrem aktuellen Bestand vor. Fällt der Bestand auf 0, wird das Item aus der Liste entfernt. Ebenfalls für **jeden Nutzer**, nur in `lagerCommandChannelId`.
- `/lager liste` aktualisiert die Lagerliste-Nachricht, ohne den Bestand zu verändern. Läuft im **allgemeinen** `commandChannelId` (wie die meisten anderen Commands), nicht in `lagerCommandChannelId`, und bleibt auf Administratoren/`commandRoleIds`/`lagerRoleIds` beschränkt.

Jede Aktion (`rein`/`raus`) aktualisiert automatisch die Lagerliste-Nachricht in `lagerListChannelId` (eine einzige Nachricht, die bearbeitet statt neu gesendet wird — wie bei der Sanktionsliste) und postet zusätzlich einen Log-Eintrag (Item, Menge, neuer Bestand, wer es ausgeführt hat) in `lagerLogChannelId`. Die Daten liegen in `data/inventoryData.json`.

## Server-Stats-Channel

`/serverstats` (nur für Administratoren/`commandRoleIds`) erstellt beim ersten Ausführen zwei gesperrte Voice-Channels (niemand kann ihnen beitreten, `@everyone` sieht sie nur):

- `👥 Mitglieder: <Zahl>` — alle Mitglieder **ohne Bots**.
- `Black Hands: <Zahl>` — nur Mitglieder mit der Rolle aus `serverStatsRoleId`. Ist `serverStatsRoleId` nicht gesetzt, wird dieser Channel übersprungen.

Beide Zahlen kommen aus **einem einzigen** `guild.members.fetch()`-Aufruf pro Aktualisierung — Discord limitiert volle Member-Abfragen scharf, zwei Aufrufe kurz hintereinander lösen sonst einen `GatewayRateLimitError` aus.

## Funkliste

`/funk funk:<Wert> passwort:<Wert>` (nur für Administratoren/`commandRoleIds`) speichert die aktuelle Funk-Frequenz und das Passwort und aktualisiert eine Funkliste-Nachricht in `funkListChannelId` (eine einzige Nachricht, die bearbeitet statt neu gesendet wird). Läuft wie die meisten anderen Commands nur im allgemeinen `commandChannelId`. Die Daten liegen in `data/funkData.json`.

Da Discord bei bearbeiteten Nachrichten keine neue Benachrichtigung auslöst, pingt der Bot die Rolle bei jeder Aktualisierung zusätzlich über eine eigene, neue Nachricht — so wird bei jeder Änderung wirklich frisch benachrichtigt.

## Klamotten-Panel

`/klamotten` (nur für Administratoren/`commandRoleIds`, läuft im allgemeinen `commandChannelId`) sorgt zuerst dafür, dass in `klamottenListChannelId` ein Panel-Embed **"👕 So ist unsere Kleidung"** mit den vier Feldern Torso, Hose, Shirt und Aufkleber existiert (Nachricht wird bearbeitet statt neu gepostet), und antwortet dir dann ephemer mit einem Auswahlmenü.

- Wählst du dort eine Kategorie aus, öffnet sich ein Modal mit einem freien Textfeld (Zahlen **und** Buchstaben erlaubt) für den neuen Wert dieser Kategorie.
- Nach dem Absenden wird der Wert gespeichert und das Panel in `klamottenListChannelId` sofort aktualisiert.

Die Daten liegen in `data/klamottenData.json`.

## Blacklist

- `/blacklist add grund:<Grund> [nutzer:<@Nutzer>] [fraktion:<Fraktion>]` fügt einen Eintrag zur Blacklist hinzu. `nutzer` und `fraktion` sind beide optional, aber mindestens einer muss angegeben werden — es kann also auch **nur eine Fraktion ohne Nutzer** geblacklistet werden. Aktualisiert die Blacklist-Nachricht in `blacklistListChannelId`.
- `/blacklist remove eintrag:<...>` entfernt einen Eintrag wieder — per Autocomplete wählbar, egal ob es ein Nutzer- oder ein reiner Fraktions-Eintrag ist. Die Vorschau zeigt die gespeicherten Werte (Tag/Fraktion/Grund) direkt an, die Bestätigung nennt sie danach noch einmal.

Beide auf Administratoren/`commandRoleIds` beschränkt, laufen im allgemeinen `commandChannelId`. Die Liste ist eine einzige Nachricht, die bearbeitet statt neu gesendet wird, und zeigt bei jedem Eintrag zusätzlich, wer ihn hinzugefügt hat. Die Daten liegen in `data/blacklistData.json`.

## Abstimmungen

- `/abstimmung start frage:<Frage>` postet eine Abstimmung mit Ja/Nein-Buttons in `abstimmungChannelId`. Es kann immer nur eine Abstimmung gleichzeitig laufen.
- `/abstimmung end` beendet die aktuelle Abstimmung, deaktiviert die Buttons und zeigt das Endergebnis.

Klickt jemand auf Ja/Nein, wird die Stimme sofort in der Nachricht selbst aktualisiert (Klick auf die jeweils andere Option wechselt die Stimme). Beide Subcommands sind auf Administratoren/`commandRoleIds` beschränkt und laufen im allgemeinen `commandChannelId`. Die Daten liegen in `data/abstimmungData.json`.

## Logging

Alles, was der Bot über die Discord-Gateway-Events mitbekommen kann, landet als Embed in `logChannelId` — zusätzlich zu den feature-eigenen Logs (z. B. `sanctionAddChannelId`, `lagerLogChannelId`). Abgedeckt sind:

- **Command-Ausführung**: Jede erfolgreiche Slash-Command-Interaktion (wer, welcher Befehl inkl. Subcommand, in welchem Channel, mit welchen Optionen) — zentral in `interactionCreate.js`.
- **Nachrichten**: bearbeitet, gelöscht, massenhaft gelöscht.
- **Mitglieder**: beigetreten, verlassen, Rollen/Nickname/Timeout geändert, gebannt, entbannt.
- **Channels**: erstellt, gelöscht, umbenannt/Thema/NSFW geändert.
- **Rollen**: erstellt, gelöscht, Name/Farbe/Berechtigungen/Einstellungen geändert.
- **Server**: Name/Icon/Beschreibung geändert.
- **Threads**: erstellt, gelöscht.
- **Voice**: beigetreten, verlassen, gewechselt, stummgeschaltet/taub geschaltet.
- **Einladungen**: erstellt, gelöscht/abgelaufen.
- **Emojis**: erstellt, gelöscht, umbenannt.
- **Webhooks**: geändert (Channel).
- **Server-Events**: erstellt, gelöscht.
- **Clip-Channel-Erstellung**.

Dafür sind zusätzliche (nicht-privilegierte) Gateway-Intents in `index.js` aktiviert: `GuildInvites`, `GuildEmojisAndStickers`, `GuildVoiceStates`, `GuildWebhooks`, `GuildScheduledEvents`.

## Projektstruktur

```
black hands/
├── .env                     BOT_TOKEN, BOT_CLIENTID, BOT_GUILDID, TWITCH_CLIENT_ID, TWITCH_SECRET (Secrets, nicht in Git)
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
    │   ├── absenceData.json    Aktuelle Abmeldungen
    │   ├── twitchStreamers.json Überwachte Twitch-Streamer
    │   ├── inventoryData.json  Lagerbestand
    │   ├── serverStatsData.json Server-Stats-Channel-IDs
    │   ├── funkData.json       Aktueller Funk und Passwort
    │   ├── klamottenData.json  Torso/Hose/Shirt/Aufkleber
    │   ├── blacklistData.json  Blacklist-Einträge
    │   ├── abstimmungData.json Aktive Abstimmung
    │   └── sanctionKatalogData.json Sanktionskatalog-Message-ID
    ├── commands/
    │   ├── setup-clip-panel.js Postet das Clip-Channel-Panel
    │   ├── clip-unlock.js      Admin-Befehl: weiteren Clip-Channel freischalten
    │   ├── clip-remove.js      Admin-Befehl: Clip-Channel eines Nutzers entfernen
    │   ├── bundnisse.js        Bündnis-Ankündigung posten
    │   ├── auflosung.js        Bündnis-Auflösung posten
    │   ├── sanktion.js         /sanktion add, /sanktion bezahlt, /sanktion list, /sanktion katalog
    │   ├── abmelde-panel.js    Postet/aktualisiert das Abmelde-Panel
    │   ├── command-liste.js    Postet eine automatische Befehlsübersicht
    │   ├── addstreamer.js      Twitch-Streamer zur Überwachung hinzufügen
    │   ├── removestreamer.js   Twitch-Streamer von der Überwachung entfernen
    │   ├── streamers.js        Überwachte Twitch-Streamer anzeigen
    │   ├── test-willkommen.js  [Nur Owner] Willkommens-Embed testen
    │   ├── test-leave.js       [Nur Owner] Leave-Embed testen
    │   ├── lager.js            /lager rein, /lager raus, /lager liste
    │   ├── serverstats.js      Erstellt/aktualisiert die Stats-Channels
    │   ├── funk.js             Ändert Funk-Frequenz und Passwort
    │   ├── klamotten.js        Öffnet das Klamotten-Auswahlmenü
    │   ├── blacklist.js        /blacklist add, /blacklist remove
    │   └── abstimmung.js       /abstimmung start, /abstimmung end
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
    │   ├── channelUpdate.js
    │   ├── roleCreate.js
    │   ├── roleDelete.js
    │   ├── roleUpdate.js
    │   ├── guildUpdate.js
    │   ├── guildMemberUpdate.js Log bei Rollen-/Nickname-/Timeout-Änderungen
    │   ├── messageDeleteBulk.js
    │   ├── inviteCreate.js
    │   ├── inviteDelete.js
    │   ├── emojiCreate.js
    │   ├── emojiDelete.js
    │   ├── emojiUpdate.js
    │   ├── voiceStateUpdate.js
    │   ├── threadCreate.js
    │   ├── threadDelete.js
    │   ├── webhookUpdate.js
    │   ├── guildScheduledEventCreate.js
    │   └── guildScheduledEventDelete.js
    └── utils/
        ├── embeds.js            Embed-Helper
        ├── logger.js            Sendet Log-Embeds in den Log-Channel
        ├── clipStore.js         Lesen/Schreiben von data/clipData.json
        ├── sanctionStore.js     Lesen/Schreiben von data/sanctionsData.json
        ├── sanctionKatalogStore.js Lesen/Schreiben von data/sanctionKatalogData.json
        ├── allianceStore.js     Lesen/Schreiben von data/allianceData.json
        ├── absenceStore.js      Lesen/Schreiben von data/absenceData.json
        ├── absencePanel.js      Baut/aktualisiert die Abmelde-Panel-Nachricht
        ├── absenceScheduler.js  Prüft minütlich auf abgelaufene Abmeldungen
        ├── twitchStore.js       Lesen/Schreiben von data/twitchStreamers.json
        ├── twitchApi.js         Twitch-Helix-API (Token, Stream-/User-Abfragen)
        ├── twitchScheduler.js   Prüft periodisch, ob Streamer live sind
        ├── memberEmbeds.js      Baut Willkommen/Leave-Embeds (auch für Test-Commands)
        ├── inventoryStore.js    Lesen/Schreiben von data/inventoryData.json
        ├── serverStats.js       Erstellt/aktualisiert den Mitgliederzahl-Channel
        ├── serverStatsStore.js  Lesen/Schreiben von data/serverStatsData.json
        ├── serverStatsScheduler.js Aktualisiert die Channel-Namen alle 10 Minuten
        ├── funkStore.js         Lesen/Schreiben von data/funkData.json
        ├── klamottenStore.js    Lesen/Schreiben von data/klamottenData.json
        ├── klamottenPanel.js    Baut/aktualisiert das Klamotten-Panel
        ├── blacklistStore.js    Lesen/Schreiben von data/blacklistData.json
        ├── abstimmungStore.js   Lesen/Schreiben von data/abstimmungData.json
        ├── abstimmungPanel.js   Baut das Abstimmungs-Embed & die Ja/Nein-Buttons
        ├── permissions.js       Rollen-/Admin-/Owner-Check für geschützte Commands
        └── deployCommands.js    Registriert Slash-Commands bei Discord (von ready.js aufgerufen)
```

# Verwende offizielles Node.js-Image
FROM node:20

# Arbeitsverzeichnis im Container
WORKDIR /usr/src/app

# Nur package.json zuerst kopieren (nutzt den Docker-Layer-Cache)
COPY src/package*.json ./

# Abhängigkeiten installieren
RUN npm install --omit=dev

# Restlichen Bot-Code kopieren
COPY src/ .

# Startbefehl für den Bot
CMD ["node", "index.js"]
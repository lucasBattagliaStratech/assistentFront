const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();

// Cargar los certificados SSL
const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/avatar.stratech.srl/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/avatar.stratech.srl/fullchain.pem')
};

// Servir los archivos estáticos de la build de React
app.use(express.static(path.join(__dirname, 'build')));

// Redirigir todas las solicitudes a index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Crear el servidor HTTPS
const server = https.createServer(options, app);

// Escuchar en el puerto 3000
server.listen(3000, () => {
    console.log('Servidor HTTPS ejecutándose en https://avatar.stratech.srl');
});

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serveer statische bestanden
app.use(express.static(path.join(__dirname, 'frontend/public')));

// Catch-all middleware voor alle andere requests
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Start webserver op poort ${PORT}`);
  console.log(`✅ Webserver klaar!`);
});
let express = require('express');
let path = require('path');
let app = express();
let PORT = process.env.PORT || 3000;

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
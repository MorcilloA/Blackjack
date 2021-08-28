const express = require('express');
const path = require("path");

const app = express();
app.use(express.static("static"));
const port = 8000;

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
});
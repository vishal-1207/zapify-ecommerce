const dotenv = require('dotenv');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

dotenv.config();

app.get('/', (req, res) => {
    res.send("Hello world.");
})

app.listen(PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`);
})
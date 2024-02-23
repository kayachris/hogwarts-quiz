const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');

// Umweltvariable Passwortschutz
require('dotenv').config();
const uri = process.env.MONGO_URI;

const app = express();
app.use(express.json());

// MongoDB Verbindung
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let quizCollection;

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("Erfolgreich mit MongoDB verbunden!");
        
        // Verbindung zur Sammlung
        quizCollection = client.db("quizDatenbank").collection("fragen");

    } catch (e) {
        console.error("Fehler bei der Verbindung mit MongoDB: ", e);
    }
}

// Funktion für die Verbindung der Datenbank
connectToMongoDB();

// Quiz-Endpunkt
app.get('/quiz', async (req, res) => {
    try {
        const fragen = await quizCollection.find({}).toArray();
        res.json(fragen);
    } catch (e) {
        console.error(e);
        res.status(500).send('Ein Fehler ist aufgetreten');
    }
});

app.get('/', (req, res) => {
    res.send('Hallo, Hogwarts-Quiz!');
});

// Antwort-Routen
app.post('/antworten', async (req, res) => {
    try {
        const fragen = await quizCollection.find({}).toArray();
        let hausPunkte = { Gryffindor: 0, Hufflepuff: 0, Ravenclaw: 0, Slytherin: 0 };

        req.body.antworten.forEach(antwort => {
            fragen.forEach(frage => {
                if (frage.antworten[antwort]) {
                    hausPunkte[frage.antworten[antwort]]++;
                }
            });
        });

        let zugewiesenesHaus = Object.keys(hausPunkte).reduce((a, b) => hausPunkte[a] > hausPunkte[b] ? a : b);
        res.json({ haus: zugewiesenesHaus });
    } catch (e) {
        console.error(e);
        res.status(500).send('Ein Fehler ist aufgetreten');
    }
});

const PORT = process.env.PORT || 3000;

process.on('SIGINT', async () => {
    await client.close();
    console.log('MongoDB Verbindung geschlossen');
    process.exit();
});

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});

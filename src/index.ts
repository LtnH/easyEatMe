const  { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();
const express  = require("express")

const app = express();
app.use(express.json());

app.post('/openai-api', async (req, res) => {
    try {
        const { prompt } = req.body;

        const configuration = new Configuration({
            apiKey: process.env.OPEN_API_KEY
        });
        const openai = new OpenAIApi(configuration);

        const completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [{"role": "user", "content": prompt}]
        });

        console.log(completion.data.choices[0].message)
        const answer = completion.data.choices[0].message.content; // Récupère la réponse générée
        res.json({ answer });
    } catch (error) {
        console.error('Erreur lors de l\'appel à l\'API OpenAI:', error);
        res.status(500).json({ error: 'Une erreur est survenue' });
    }
});

app.listen(3000, () => {
    console.log('Serveur démarré sur le port 3000');
});

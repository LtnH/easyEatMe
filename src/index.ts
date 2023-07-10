const {Configuration, OpenAIApi} = require('openai');
require('dotenv').config();
const express = require("express")
const {initializeApp} = require("firebase/app");
const {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} = require("firebase/auth");
const { getFirestore, setDoc, doc } = require("firebase/firestore");

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
        res.json({answer});
    } catch (error) {
        console.error('Erreur lors de l\'appel à l\'API OpenAI:', error);
        res.status(500).json({error: 'Une erreur est survenue'});
    }
});

app.post("/register", async (req, res) => {

    const { email, password, lastname, firstname, birth, phone  } = req.body;

    const firebaseConfig = {
        apiKey: "AIzaSyB3wuPps2WsDQGVVgDyZycb8PK7Cos6vG4",
        authDomain: "projet-annuel-75dfa.firebaseapp.com",
        databaseURL: "https://projet-annuel-75dfa-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "projet-annuel-75dfa",
        storageBucket: "projet-annuel-75dfa.appspot.com",
        messagingSenderId: "761252172313",
        appId: "1:761252172313:web:f1f00ef432bbcbcda45088",
        measurementId: "G-5PN0D9132L"
    };

    const app = initializeApp(firebaseConfig)

    const db = getFirestore(app)

    const auth = getAuth(app);
    createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            // Signed in
            const user = userCredential.user;
            const docRef = await setDoc(doc(db, "user", user.uid), {
                nom: lastname,
                prenom: firstname,
                email: email,
                number: phone,
                birth: birth,
            });
            res.json({ message: 'Utilisateur créé avec succès', uid: user.uid });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage)
            res.status(500).json({ error: 'Une erreur est survenue lors de la création de l\'utilisateur' });
        });
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const firebaseConfig = {
        apiKey: "AIzaSyB3wuPps2WsDQGVVgDyZycb8PK7Cos6vG4",
        authDomain: "projet-annuel-75dfa.firebaseapp.com",
        databaseURL: "https://projet-annuel-75dfa-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "projet-annuel-75dfa",
        storageBucket: "projet-annuel-75dfa.appspot.com",
        messagingSenderId: "761252172313",
        appId: "1:761252172313:web:f1f00ef432bbcbcda45088",
        measurementId: "G-5PN0D9132L"
    };

    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app);

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            // ...
            res.json({ message: 'Authentification réussie', uid: user.uid });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;

            res.status(401).json({ error: 'Identifiants invalides' });
        });
})

app.listen(3000, () => {
    console.log('Serveur démarré sur le port 3000');
});

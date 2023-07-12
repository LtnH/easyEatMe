const {Configuration, OpenAIApi} = require('openai');
require('dotenv').config();
const express = require("express")
const {initializeApp} = require("firebase/app");
const {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} = require("firebase/auth");
const { getFirestore, setDoc, doc, getDocs,getDoc, collection, addDoc,  query, where} = require("firebase/firestore");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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
const appfirebase = initializeApp(firebaseConfig)
const db = getFirestore(app)

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

    const auth = getAuth(appfirebase);

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

    const auth = getAuth(appfirebase);

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

app.post("/ingredient", async (req, res) => {

    const { name } = req.body;

    try {
        const docRef = await setDoc(doc(db, "ingredient", name), {
            name: name
        });
        res.json({ message: 'ingrédient créé avec succès' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la création de l\'ingrédient' });
    }
    
});

app.get("/ingredients", async (req, res) => {
    
    const ingredientsRef = collection(db, "ingredient");
  
    try {
      const ingredientsQuerySnapshot = await getDocs(ingredientsRef);
  
      const ingredientsList = [];
      ingredientsQuerySnapshot.forEach((doc) => {
        const ingredientData = doc.data();
        ingredientsList.push(ingredientData.name);
      });
  
      res.json({ ingredients: ingredientsList });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Une erreur est survenue lors de la récupération de la liste des ingrédients" });
    }
  });

app.get("/ingredients/:name", async (req, res) => {
    const ingredientName = req.params.name;
  
    const ingredientDocRef = doc(db, "ingredient", ingredientName);
  
    try {
      const ingredientDocSnap = await getDoc(ingredientDocRef);
  
      if (!ingredientDocSnap.exists()) {
        return res.status(404).json({ error: "Ingrédient non trouvé" });
      }
  
      const ingredientData = ingredientDocSnap.data();
  
      const recetteQuery = query(collection(db, "recette"), where("ingredients", "array-contains", ingredientName));
      const recetteQuerySnapshot = await getDocs(recetteQuery);
  
      const recettes = recetteQuerySnapshot.docs.map((doc) => doc.data());
      
      res.json({ ingredient: ingredientData, recettes });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Une erreur est survenue lors de la récupération des détails de l'ingrédient" });
    }
  });
  
app.get("/recettes/:id", async (req, res) => {
    const recetteId = req.params.id;
  
    try {
      const recetteDocRef = doc(db, "recette", recetteId);
      const recetteDocSnap = await getDoc(recetteDocRef);
  
      if (!recetteDocSnap.exists()) {
        return res.status(404).json({ error: "Recette non trouvée" });
      }
  
      const recetteData = recetteDocSnap.data();
  
      res.json({ recette: recetteData });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Une erreur est survenue lors de la récupération des détails de la recette" });
    }
  });
  
  
app.post("/recette", async (req, res) => {
    
    const { name, description, ingredients, allergene } = req.body;
    
    if (!Array.isArray(req.body.ingredients)) {
        return res.status(400).json({ error: "Les ingrédients doivent être un tableau" });
      }
    try {
      // Vérifier si les ingrédients existent dans la collection "ingredient"
      const ingredientCollectionRef = collection(db, "ingredient");
      const ingredientQuery = query(ingredientCollectionRef);
      const ingredientSnapshot = await getDocs(ingredientQuery);
      const ingredientIds = ingredientSnapshot.docs.map((doc) => doc.id);
  
      const validIngredients = ingredients.filter((ingredient) => ingredientIds.includes(ingredient));
      const invalidIngredients = ingredients.filter((ingredient) => !ingredientIds.includes(ingredient));
  
      if (invalidIngredients.length > 0) {
        return res.status(400).json({ error: `Les ingrédients suivants n'existent pas : ${invalidIngredients.join(", ")}` });
      }
  
      // Créer un nouvel objet recette
      const recetteData = {
        name: name,
        description: description,
        ingredients: validIngredients,
        allergene: allergene
      };
  
      const recetteRef = await addDoc(collection(db, "recette"), recetteData);
      const recetteId = recetteRef.id;
  
      res.json({ message: "Recette créée avec succès", recetteId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Une erreur est survenue lors de la création de la recette" });
    }
  });
app.get("/recettes", async (req, res) => {
    try {
      const recettesQuerySnapshot = await getDocs(collection(db, "recette"));
      const recettes = recettesQuerySnapshot.docs.map((doc) => doc.data());
  
      res.json({ recettes });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Une erreur est survenue lors de la récupération des recettes" });
    }
  });

app.listen(3000, () => {
    console.log('Serveur démarré sur le port 3000');
});

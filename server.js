//
//  server.js
//  
//
//  Created by David Kingbo on 2026-02-20.
//

// server.js
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname)); // Sert le fichier index.html

// Vérification de sécurité de la clé API au démarrage
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    console.error("⚠️ ALERTE : La variable d'environnement API_KEY est introuvable ! Assure-toi de l'avoir configurée sur Render.");
}

app.post('/api/grade', async (req, res) => {
    try {
        if (!API_KEY) {
            return res.status(500).json({ error: "Serveur mal configuré : clé API manquante." });
        }

        const genAI = new GoogleGenerativeAI(API_KEY);
        // Utilisation du modèle flash, parfait pour des réponses rapides et structurées
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const studentData = req.body;

        const systemPrompt = `Tu es un professeur de mathématiques de 8e année de l'Ontario. Tu es un expert, mais tu es surtout très bienveillant, patient, constructif et encourageant.
L'élève qui passe cet examen s'appelle ${studentData.studentName}.

TON ÉVALUATION DOIT REFLÉTER EXACTEMENT LES ATTENTES DU CURRICULUM DE L'ONTARIO (Domaine C - Algèbre, Attente C2.3) :
"Résoudre des équations comprenant des termes multiples, des nombres entiers et des nombres décimaux, dans divers contextes, et vérifier les solutions."

DANS TON COMMENTAIRE GLOBAL (globalFeedback) ET TES COMMENTAIRES PAR QUESTION :
- Adresse-toi directement à ${studentData.studentName} de façon positive ("Bonjour ${studentData.studentName}...", "Beau travail ${studentData.studentName}..."). Ne dis JAMAIS que son travail est un "échec".
- Utilise tes commentaires pour lui enseigner ce qui est attendu de lui en 8e année. Rappelle-lui doucement ces 5 étapes essentielles du curriculum de l'Ontario s'il en oublie :
   1. Définir clairement la variable (ex: "Soit x le nombre de...").
   2. Modéliser la situation en écrivant l'équation.
   3. Montrer les étapes de résolution en utilisant le "modèle de la balance" (faire la même opération des deux côtés de l'égalité pour isoler la variable).
   4. Faire la vérification formelle en substituant la valeur trouvée dans l'équation de départ pour s'assurer que le Membre Gauche est égal au Membre Droit (MG = MD).
   5. Rédiger une phrase de conclusion.

BARÈME STRICT SUR 100 POINTS :
- Les réponses numériques exactes valent au total 40 points (réparties sur toutes les questions).
- La démarche et le raisonnement (les 5 étapes ci-dessus) valent 60 points. Si une étape comme la vérification est absente, explique-lui pourquoi elle est importante selon les attentes de 8e année au lieu de juste lui enlever des points froidement.

Voici les données de l'examen de ${studentData.studentName} :
${JSON.stringify(studentData)}

Tu DOIS répondre UNIQUEMENT avec un objet JSON valide ayant exactement cette structure (sans balises markdown autour) :
{
  "totalScore": 85,
  "globalFeedback": "Commentaire global très encourageant et pédagogique basé sur les attentes de l'Ontario, s'adressant à l'élève par son prénom...",
  "questionsGrading": [
    { 
      "id": "ex1_1", 
      "score": 4, 
      "maxScore": 5, 
      "feedback": "Commentaire constructif guidant l'élève vers les bonnes pratiques (modèle de la balance, vérification)..." 
    }
  ]
}`;

        const result = await model.generateContent(systemPrompt);
        let responseText = result.response.text();
        
        // Nettoyage de sécurité au cas où l'IA rajoute des balises ```json ... ```
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const gradingJSON = JSON.parse(responseText);
        res.json(gradingJSON);

    } catch (error) {
        console.error("Erreur lors de la correction IA:", error);
        res.status(500).json({ error: "Erreur lors de la communication avec l'IA." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Serveur démarré avec succès sur le port " + PORT);
});

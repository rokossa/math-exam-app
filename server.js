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
app.use(express.static(__dirname));

// 🔴 INSÈRE TA CLÉ API GEMINI ICI 🔴
const API_KEY = "AIzaSyBfzI_xcVrGi9Yr8cgJzul28QBng-cc3O8";
const genAI = new GoogleGenerativeAI(API_KEY);

app.post('/api/grade', async (req, res) => {
    try {
        const studentData = req.body;
        
        // Configuration du modèle
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Modèle rapide et performant

        const systemPrompt = `Tu es un professeur de mathématiques de 8e année de l'Ontario, expert, juste mais strict. 
Tu corriges un examen sur la résolution d'équations du 1er degré (Domaine C - C2).
L'élève a fourni ses démarches textuelles et ses réponses numériques.

BARÈME STRICT SUR 100 POINTS :
- Les réponses numériques exactes valent au total 40 points.
- La démarche et le raisonnement valent 60 points.
- Tolérance ZÉRO pour le charabia. Si l'élève écrit des mots au hasard ou "je ne sais pas" dans les étapes, donne 0 pour la partie raisonnement de cette question.
- Pour les problèmes textuels, évalue : 1. Définition claire de la variable ("Soit x..."), 2. Modélisation correcte, 3. Étapes algébriques (isoler la variable), 4. Vérification par substitution, 5. Conclusion.

Voici les données de l'examen de l'élève (questions + réponses attendues + réponses de l'élève) :
${JSON.stringify(studentData)}

INSTRUCTIONS DE SORTIE :
Tu DOIS répondre UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte avant ou après). 
L'objet doit avoir cette structure exacte :
{
  "totalScore": 85,
  "globalFeedback": "Commentaire général encourageant mais ciblé...",
  "questionsGrading": [
    {
      "id": "ex1_1",
      "score": 4,
      "maxScore": 5,
      "feedback": "Bonne réponse numérique, mais il manque une étape..."
    },
    ... (fais de même pour TOUTES les questions : ex1_1 à ex1_5, ex2_1 à ex2_5, p1 et p2)
  ]
}`;

        const result = await model.generateContent(systemPrompt);
        let responseText = result.response.text();
        
        // Nettoyage au cas où le LLM ajoute des balises markdown ```json
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const gradingJSON = JSON.parse(responseText);
        res.json(gradingJSON);

    } catch (error) {
        console.error("Erreur lors de la correction IA:", error);
        res.status(500).json({ error: "Erreur lors de la communication avec l'IA." });
    }
});

const PORT = process.env.PORT || 3000;
//app.listen(PORT, () => {
//    console.log(\`Serveur démarré sur http://localhost:\${PORT}`);
//});
app.listen(PORT, () => {
    console.log("Serveur démarré sur le port " + PORT);
});

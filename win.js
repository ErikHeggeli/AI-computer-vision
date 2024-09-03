const gameTranslations = {
    en: {
        congratulations: "Congratulations! YOU WON!",
        restart: "Press button to play again!",
        objects: {
            "scallop": "Scallop", 
            "watering can": "Watering Can", 
            "bomb": "Bomb", 
            "stapler": "Stapler", 
            "smoke detector": "Smoke Detector", 
            "dinosaur": "Dinosaur", 
            "sunglasses": "Sunglasses", 
            "spoon": "Spoon", 
            "foraminifera": "Foraminifera", 
            "football boot":"Fotball Boot", 
            "headset": "Headset", 
            "bottle": "Bottle", 
            "coat rack": "Coat Rack", 
            "tape": "Tape", 
            "teddy bear": "Teddy Bear", 
            "ruler": "Ruler", 
            "chainsaw": "Chainsaw", 
            "computer mouse": "Computer Mouse", 
            "flag": "Flag", 
            "sword": "Sword", 
            "ipad" : "Ipad"
        }
    },
    no: {
        congratulations: "Gratulerer! DU VANT!",
        restart: "Trykk på knappen for å spille på nytt!",
        objects: {
            "scallop": "Kamskjell", 
            "watering can": "Vannkanne", 
            "bomb": "Bombe", 
            "stapler": "Stiftemaskin", 
            "smoke detector": "Brannalarm", 
            "dinosaur": "Dinosaur", 
            "sunglasses": "Solbriller", 
            "spoon": "Skje", 
            "foraminifera": "Foraminifera", 
            "football boot":"Fotballsko", 
            "headset": "Hodetelefoner", 
            "bottle": "Flaske", 
            "coat rack": "Knagg", 
            "tape": "Teip", 
            "teddy bear": "Bamse", 
            "ruler": "Linjal", 
            "chainsaw": "Motorsag", 
            "computer mouse": "Datamus", 
            "flag": "Flagg", 
            "sword": "Sverd", 
            "ipad" : "Ipad"
        }
    },
    sami: {
        congratulations: "Ollu lihkku! DON VUITET!",
        restart: "Speallu álgá go coahkkalat boalu!",
        objects: {
            "scallop": "Heastaskálžžu",
            "watering can": "Čáhcegátnu",  
            "bomb": "Bombba",
            "stapler": "Bábirduorrama", 
            "smoke detector": "Buollinalárpma",  
            "dinosaur": "Dinosaurusa",
            "sunglasses": "Beaivečalbmelásiid",  
            "spoon": "Bastte", 
            "foraminifera": "Foraminifera",  
            "football boot": "Spabbačiekčanskuovaid",  
            "headset": "Belljosiid",  
            "bottle": "Bohttala", 
            "coat rack": "Bivttasfakki",  
            "tape": "Teaippa",  
            "teddy bear": "Uvjaguovžža",  
            "ruler": "Linjála",  
            "chainsaw": "Mohtorsahá",  
            "computer mouse": "Sáhpána", 
            "flag": "Leavgga", 
            "sword": "Miehka",  
            "ipad": "Dihtordulbosa"  
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const foundObjects = JSON.parse(localStorage.getItem('foundObjects') || '[]');
    const listElement = document.getElementById('foundObjectsList');
    const savedLang = localStorage.getItem('lastLanguageUsed') || 'en'; // Retrieve the language or default to English
    const translations = gameTranslations[savedLang].objects; // Get the translations for the current language
    console.log(foundObjects)
    foundObjects.forEach(obj => {
        const translatedName = translations[obj.name]; // Get the translated name
        const item = document.createElement('li');
        item.innerHTML = `${translatedName} <img src="${obj.emoji}" alt="${translatedName}" style="width:100px; height:100px;">`;
        listElement.appendChild(item);
    });

    // Update other UI elements based on the language
    document.getElementById('congratulationsMessage').textContent = gameTranslations[savedLang].congratulations;
    document.getElementById('restartMessage').textContent = gameTranslations[savedLang].restart;

    // Set up the play again button
    setupPlayAgainButton();

    // Redirect to index.html after 30 seconds of inactivity
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 30000);
});

function setupPlayAgainButton() {
    const lang = localStorage.getItem('lastLanguageUsed') || 'en'; // Retrieve the last used language
    const playLink = document.getElementById('play-link');
    playLink.href = `game.html?lang=${lang}`; // Set the href to include the language
}

function playAgain() {
    const lang = localStorage.getItem('lastLanguageUsed') || 'en'; // Optionally, ensure language consistency
    window.location.href = `game.html?lang=${lang}`; // Redirect to start a new game
}
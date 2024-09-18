const gameTranslations = {
    en: {
        congratulations: "Congratulations! You found ",
        restart: "Press button to play again!",
        objects: {
            "scallop": "Scallop", 
            "watering can": "Watering Can", 
            "cauliflower": "Cauliflower", 
            "dinosaur": "Dinosaur", 
            "carrot": "Carrot", 
            "foraminifera": "Foraminifera", 
            "football boot":"Fotball Boot", 
            "bottle": "Bottle", 
            "teddy bear": "Teddy Bear", 
            "chainsaw": "Chainsaw", 
            "computer mouse": "Computer Mouse", 
            "flag": "Flag", 
            "sword": "Sword", 
            "potato": "Potato",
            "banana": "Banana",
            "paint brush": "Paint Brush",
            "pepper": "Pepper" 
        }
    },
    no: {
        congratulations: "Gratulerer! Du fant ",
        restart: "Trykk på knappen for å spille på nytt!",
        objects: {
            "scallop": "Kamskjell", 
            "watering can": "Vannkanne", 
            "cauliflower": "Blomkål", 
            "dinosaur": "Dinosaur", 
            "carrot": "Gulrot", 
            "foraminifera": "Foraminifera", 
            "football boot":"Fotballsko", 
            "bottle": "Flaske", 
            "teddy bear": "Bamse", 
            "chainsaw": "Motorsag", 
            "computer mouse": "Datamus", 
            "flag": "Flagg", 
            "sword": "Sverd",
            "potato": "Potet",
            "banana": "Banan",
            "paint brush": "Malekost",
            "pepper": "Paprika"    
        }
    },
    sami: {
        congratulations: "Ollu lihkku! Don gávdnet ",
        restart: "Speallu álgá go coahkkalat boalu!",
        objects: {
            "scallop": "Heastaskálžžu",
            "watering can": "Čáhcegátnu",  
            "cauliflower": "Diehppegála",
            "dinosaur": "Dinosaurusa",
            "carrot": "Rušppi", 
            "foraminifera": "Foraminifera",  
            "football boot": "Spabbačiekčanskuovaid",  
            "bottle": "Bohttala", 
            "teddy bear": "Uvjaguovžža",   
            "chainsaw": "Mohtorsahá",  
            "computer mouse": "Sáhpána", 
            "flag": "Leavgga",
            "sword": "Miehka", 
            "potato": "Buđeha",
            "banana": "Banána",
            "paint brush": "Málenguštta",
            "pepper": "Paprika" 
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
        item.innerHTML = `${translatedName} <img src="${obj.emoji}" alt="${translatedName}" style="width:75px; height: 75px;">`;
        listElement.appendChild(item);
    });

    // Update the congratulations message to include the number of found objects
    const totalObjects = 10; // Total number of objects to find
    const foundCount = foundObjects.length; // Number of objects actually found
    const congratulationsText = `${gameTranslations[savedLang].congratulations} ${foundCount} / ${totalObjects}`;
    document.getElementById('congratulationsMessage').textContent = congratulationsText;

    // Display fireworks if 5 or more objects were found
    if (foundCount >= 5) {
        const fireworksContainer = document.getElementById('fireworksContainer');
        const fireworksImage = document.createElement('img');
        fireworksImage.src = '/img/fireworks.webp';
        fireworksImage.alt = 'Celebratory fireworks';
        fireworksImage.style.width = '30%'; // Adjust size as needed
        fireworksContainer.appendChild(fireworksImage);
    }

    // Update other UI elements based on the language
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

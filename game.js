const VIDEO = document.getElementById('webcam');
const STATUS = document.getElementById('status');
const MESSAGE = document.getElementById('message');
const PREDICT = document.getElementById('predict');
const modelUrl = '/model/model.json';
const totalObjects = 10
const MOBILE_NET_INPUT_WIDTH = 224;
const MOBILE_NET_INPUT_HEIGHT = 224;
const CLASS_NAMES = ["scallop",
    "watering can",
    "bomb",
    "dinosaur",
    "spoon",
    "foraminifera",
    "football boot",
    "bottle",
    "teddy bear",
    "chainsaw",
    "computer mouse",
    "flag",
    "sword",
    "potato",
    "banana",
    "paint brush"];
const TIMELIMIT = 15000;
let model, mobilenet;
let videoPlaying = false;
let currentIdx = -1;
let timer, countdown;
let texts;
let objectsToFind = [];
let objectsFound = [];
let foundCount = 0;
let canCheck = true;

const EMOJI_MAP = {
  "scallop": "/img/emoji/scallop.png", 
  "watering can": "/img/emoji/watering-can.svg", 
  "bomb": "/img/emoji/bomb.svg",  
  "dinosaur": "/img/emoji/t-rex.svg", 
  "spoon": "/img/emoji/spoon.svg", 
  "foraminifera": "/img/emoji/foraminifera-white.png", 
  "football boot": "/img/emoji/football-boot.png", 
  "bottle": "/img/emoji/cola.svg", 
  "teddy bear": "/img/emoji/teddy-bear.svg", 
  "chainsaw": "/img/emoji/chainsaw.svg", 
  "computer mouse": "/img/emoji/mouse.svg", 
  "flag": "/img/emoji/norway.svg", 
  "sword": "/img/emoji/sword.svg", 
  "potato": "/img/emoji/potato.svg",
  "banana": "/img/emoji/banana.png",
  "paint brush": "/img/emoji/paint-brush.png"
};

function selectRandomObjects() {
    objectsToFind = [];
    let availableIndices = [...CLASS_NAMES.keys()]; // Create an array of indices

    for (let i = 0; i < totalObjects; i++) {
        let randomIndex = Math.floor(Math.random() * availableIndices.length);
        objectsToFind.push(CLASS_NAMES[availableIndices[randomIndex]]);
        availableIndices.splice(randomIndex, 1); // Remove the used index
    }

    foundCount = 0; // Reset found count
    selectNextObject();
}

const gameTranslations = {
    en: {
        find: "Find ",
        congratulations: "Congratulations! You found ",
        timeUp: "Time is up!",
        timer: "Timer",
        objects: {
            "scallop": "scallop", 
            "watering can": "watering can", 
            "bomb": "bomb", 
            "dinosaur": "dinosaur", 
            "spoon": "spoon", 
            "foraminifera": "foraminifera", 
            "football boot":"fotball boot", 
            "bottle": "bottle", 
            "teddy bear": "teddy Bear", 
            "chainsaw": "chainsaw", 
            "computer mouse": "computer Mouse", 
            "flag": "flag", 
            "sword": "sword",
            "potato": "potato",
            "banana": "banana",
            "paint brush": "paint brush" 
        }
    },
    no: {
        find: "Finn ",
        congratulations: "Gratulerer! Du fant ",
        timeUp: "Tiden er ute!",
        timer: "Tidtaker",
        objects: {
            "scallop": "kamskjell", 
            "watering can": "vannkanne", 
            "bomb": "bombe", 
            "dinosaur": "dinosaur",  
            "spoon": "skje", 
            "foraminifera": "foraminifera", 
            "football boot":"fotballsko", 
            "bottle": "flaske", 
            "teddy bear": "bamse", 
            "chainsaw": "motorsag", 
            "computer mouse": "datamus", 
            "flag": "flagg", 
            "sword": "sverd",
            "potato": "potet",
            "banana": "banan",
            "paint brush": "malekost"  
        }
    },
    sami: {
        find: "Etsi ",
        congratulations: "Onnittelut! Löysit ",
        timeUp: "Aika loppui!",
        timer: "Ajastin",
        objects: {
            "scallop": "heastaskálžžu",
            "watering can": "čáhcegátnu",  
            "bomb": "bombba", 
            "dinosaur": "dinosaurusa",
            "spoon": "bastte", 
            "foraminifera": "foraminifera",  
            "football boot": "spabbačiekčanskuovaid",  
            "bottle": "bohttala", 
            "teddy bear": "uvjaguovžža",  
            "chainsaw": "mohtorsahá",  
            "computer mouse": "sáhpána", 
            "flag": "leavgga", 
            "sword": "miehka",  
            "potato": "potet",
            "banana": "banan",
            "paint brush": "malekost"    
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const lang = new URLSearchParams(window.location.search).get('lang') || 'en';
    localStorage.setItem('lastLanguageUsed', lang);
    updateGameLanguage(lang);
    initializeModels(); // Start the game initialization
});

function updateGameLanguage(lang) {
    texts = gameTranslations[lang]; // Update the global texts variable
    
    if (currentIdx !== -1) {
        updateObjectUI(); // This will refresh the display with the new language
    }
}

window.updateGameLanguage = updateGameLanguage;
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
      navigator.serviceWorker.register('/service.js').then(function(registration) {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(err) {
          console.log('ServiceWorker registration failed: ', err);
      });
  });
}
*/
async function loadMobileNetFeatureModel() {
    //const URL = 'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1';
    mobilenet = await tf.loadGraphModel('mobilenet/model.json');
    console.log('MobileNet loaded successfully!');
}

async function loadModel() {
    try {
        model = await tf.loadLayersModel(modelUrl);
        console.log('Model loaded successfully.');
    } catch (error) {
        console.error('Failed to load model:', error);
    }
}

async function initializeModels() {
    await Promise.all([loadMobileNetFeatureModel(), loadModel()]);
    enableCam();
}

function enableCam() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const constraints = {
            video: true,
            width: 1080,
            height: 1920
        };

        navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
            VIDEO.srcObject = stream;
            VIDEO.addEventListener('loadeddata', function() {
                videoPlaying = true;
                selectRandomObjects(); // Initialize the list of objects to find
                gameLoop(); // Start the game loop
                startTimer(); // Start the timer
            });
        }).catch(function(error) {
            console.error('Camera access denied:', error);
            MESSAGE.innerHTML = "Failed to access the camera.";
        });
    } else {
        console.warn('getUserMedia() is not supported by your browser');
        MESSAGE.innerHTML = "Your browser does not support accessing the camera.";
    }
}

function selectNextObject() {
    if (objectsToFind.length > 0) {
        currentIdx = CLASS_NAMES.indexOf(objectsToFind.shift()); // Get the next object
        updateObjectUI();
        startTimer();
    } else {
        showWinScreen(); // Show win screen if all objects are found
    }
}

function updateObjectUI() {
    const targetName = CLASS_NAMES[currentIdx];
    const translatedName = texts.objects[targetName];
    const emojiSrc = EMOJI_MAP[targetName]; // || "img/emoji/unknown.png";
    STATUS.innerHTML = `${texts.find} <img src="${emojiSrc}" alt="${translatedName}" class="emoji-image">`;
    MESSAGE.innerHTML = ""; // Clear message
}


function startTimer() {
    clearTimeout(timer); // Clear any existing timeout
    clearInterval(countdown); // Clear any existing interval

    let timeLeft = 15; // 15 seconds countdown
    document.getElementById('timeLeft').textContent = timeLeft; // Initialize the countdown display

    // Update the timer every second
    countdown = setInterval(() => {
        timeLeft--;
        document.getElementById('timeLeft').textContent = timeLeft; // Update the display

        if (timeLeft <= 0) {
            clearInterval(countdown); // Stop the interval
            showTimeoutMessage(); // Show timeout message and handle redirection
        }
    }, 1000);

    // Set a timeout to clear the interval and handle timeout event
    timer = setTimeout(() => {
        clearInterval(countdown); // Ensure the interval is cleared if not already
    }, TIMELIMIT); // 15000 milliseconds = 15 seconds
}

function showTimeoutMessage() {
    STATUS.innerHTML = "";
    MESSAGE.innerHTML = `${texts.timeUp}`;
    setTimeout(() => {
        const lang = localStorage.getItem('lastLanguageUsed') || 'en';
        window.location.href = `index.html?lang=${lang}`; // Redirect to the index page after 3 seconds
    }, 3000);
}
function showWinScreen() {
    const foundObjects = objectsFound.map(obj => ({
        name: obj,
        emoji: EMOJI_MAP[obj]
    }));
    localStorage.setItem('foundObjects', JSON.stringify(foundObjects));
    console.log("Storing found objects:", foundObjects);
    const lang = localStorage.getItem('lastLanguageUsed') || 'en';
    window.location.href = `win.html?lang=${lang}`; // Redirect to the win page
}


function clearMessage() {
    MESSAGE.innerHTML = ""; // Clear the message content
}

function showMessage(message) {
    MESSAGE.innerHTML = message; // Set new message content
    MESSAGE.style.display = 'block'; // Ensure the element is visible
}

function gameLoop() {
    if (videoPlaying && mobilenet && model && canCheck) {
        tf.tidy(() => {
            const videoFrameAsTensor = tf.browser.fromPixels(VIDEO).div(255);
            const resizedTensorFrame = tf.image.resizeBilinear(videoFrameAsTensor, [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH], true);
            const features = mobilenet.predict(resizedTensorFrame.expandDims());
            const prediction = model.predict(features).squeeze();
            const highestIndex = prediction.argMax().arraySync();
            const predictionArray = prediction.arraySync();
            const className = CLASS_NAMES[highestIndex];
            const translatedName = texts.objects[className];
            const emojiSrc = EMOJI_MAP[className];
            PREDICT.innerHTML = `Prediction: ${translatedName} <img src="${emojiSrc}" alt="${translatedName}" style="width:24px;height:24px;"> with ${Math.floor(predictionArray[highestIndex] * 100)}% confidence`;
            if (Math.floor(predictionArray[highestIndex] * 100) >= 99 && highestIndex === currentIdx && canCheck) {
                objectsFound.push(className);
                foundCount++;
                console.log(foundCount);  
                canCheck = false; // Prevent further checks until the next object is ready
                clearTimeout(timer);         
                clearInterval(countdown);
                MESSAGE.innerHTML = `${texts.congratulations} ${translatedName} <img src="${emojiSrc}" alt="${translatedName}" style="width:120px;height:120px;">`;
                setTimeout(clearMessage, 3000);
                if (foundCount >= totalObjects) {
                    setTimeout(showWinScreen, 3000);
                } else {
                    setTimeout(() => {
                        selectNextObject();
                        canCheck = true; // Re-enable checking when the next object is ready
                    }, 3000);
                }
            }
        });
    }
    window.requestAnimationFrame(gameLoop);
}


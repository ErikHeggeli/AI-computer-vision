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
    "cauliflower",
    "dinosaur",
    "carrot",
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
    "paint brush",
    "pepper"];

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
let isProcessing = false;
const EMOJI_MAP = {
  "scallop": "img/emoji/scallop.png", 
  "watering can": "img/emoji/watering-can.svg", 
  "cauliflower": "img/emoji/cauliflower.png",  
  "dinosaur": "img/emoji/t-rex.svg", 
  "carrot": "img/emoji/carrot.png", 
  "foraminifera": "img/emoji/foraminifera.webp", 
  "football boot": "img/emoji/football-boot.png", 
  "bottle": "img/emoji/cola.svg", 
  "teddy bear": "img/emoji/teddy-bear.svg", 
  "chainsaw": "img/emoji/chainsaw.svg", 
  "computer mouse": "img/emoji/mouse.svg", 
  "flag": "img/emoji/norway.svg", 
  "sword": "img/emoji/sword.svg", 
  "potato": "img/emoji/potato.svg",
  "banana": "img/emoji/banana.png", 
  "paint brush": "img/emoji/paint-brush.png",
  "pepper": "img/emoji/pepper.png"
};

function selectRandomObjects() {
    objectsToFind = [];
    let availableIndices = [...CLASS_NAMES.keys()]; // Create an array of indices

    while (objectsToFind.length < totalObjects) {
        let randomIndex = Math.floor(Math.random() * availableIndices.length);
        objectsToFind.push(CLASS_NAMES[availableIndices[randomIndex]]);
        availableIndices.splice(randomIndex, 1); // Remove the used index
    }

    foundCount = 0; // Reset found count
    initializeBoxes(); // Initialize boxes for the game
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
            "cauliflower": "cauliflower", 
            "dinosaur": "dinosaur", 
            "carrot": "carrot", 
            "foraminifera": "foraminifera", 
            "football boot":"fotball boot", 
            "bottle": "bottle", 
            "teddy bear": "teddy bear", 
            "chainsaw": "chainsaw", 
            "computer mouse": "computer mouse", 
            "flag": "flag", 
            "sword": "sword",
            "potato": "potato",
            "banana": "banana",
            "paint brush": "paint brush",
            "pepper": "pepper" 
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
            "cauliflower": "blomkål", 
            "dinosaur": "dinosaur",  
            "carrot": "gulrot", 
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
            "paint brush": "malekost",
            "pepper": "paprika"  
        }
    },
    sami: {
        find: "Oza ",
        congratulations: "Ollu lihkku! Don gávdnet ",
        timeUp: "Áigi nogai!",
        timer: "Áigemihttár",
        objects: {
            "scallop": "heastaskálžžu",
            "watering can": "čáhcegátnu",  
            "cauliflower": "diehppegála", 
            "dinosaur": "dinosaurusa",
            "carrot": "rušppi", 
            "foraminifera": "foraminifera",  
            "football boot": "spabbačiekčanskuovaid",  
            "bottle": "bohttala", 
            "teddy bear": "uvjaguovžža",  
            "chainsaw": "mohtorsahá",  
            "computer mouse": "sáhpána", 
            "flag": "leavgga", 
            "sword": "miehka",  
            "potato": "buđeha",
            "banana": "banána",
            "paint brush": "málenguštta",
            "pepper": "paprika"    
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const lang = new URLSearchParams(window.location.search).get('lang') || 'no';
    localStorage.setItem('lastLanguageUsed', lang);
    initializeBoxes();
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

function initializeBoxes() {
    const boxContainer = document.getElementById('objectBoxes');
    boxContainer.innerHTML = ''; // Clear previous boxes

    for (let i = 0; i < totalObjects; i++) {
        const box = document.createElement('div');
        box.className = 'box neutral';
        boxContainer.appendChild(box);
    }
}

function updateObjectBoxes() {
    const boxContainer = document.getElementById('objectBoxes');
    const boxes = boxContainer.children;

    // Clear all boxes first
    for (let i = 0; i < boxes.length; i++) {
        boxes[i].innerHTML = ''; // Clear the content
        boxes[i].className = 'box neutral'; // Reset to neutral
    }

    // Update boxes for found objects
    objectsFound.forEach(obj => {
        const index = CLASS_NAMES.indexOf(obj);
        if (index !== -1 && index < boxes.length) {
            boxes[index].className = 'box found';
            boxes[index].innerHTML = `<img src="${EMOJI_MAP[obj]}" style="width:50px; height:50px;"><span class="checkmark">✓</span>`;
        }
    });

    // Update boxes for not found objects
    objectsToFind.forEach(obj => {
        const index = CLASS_NAMES.indexOf(obj);
        if (index !== -1 && index < boxes.length) {
            boxes[index].className = 'box not-found';
            boxes[index].innerHTML = `<img src="${EMOJI_MAP[obj]}" style="width:50px; height:50px;"><span class="cross">&#x2716;</span>`;
        }
    });
}

async function loadMobileNetFeatureModel() {
    //const URL = 'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1';
    mobilenet = await tf.loadGraphModel('mobilenet/model.json');
    console.log('MobileNet loaded successfully!');
}

async function loadModel() {
    try {
        model = await tf.loadLayersModel(modelUrl);
        console.log('Model loaded successfully.');
        model.summary();
    } catch (error) {
        console.error('Failed to load model:', error);
    }
}

function initializeModels() {
    loadMobileNetFeatureModel().then(() => {
        loadModel().then(() => {
            enableCam();
        });
    });
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
    if (foundCount < totalObjects) {
        currentIdx = CLASS_NAMES.indexOf(objectsToFind[foundCount]);
        updateObjectUI();
        startTimer();
    } else {
        showWinScreen(); // End the game after all objects have been processed
    }
}

function updateObjectUI() {
    const targetName = CLASS_NAMES[currentIdx];
    const translatedName = texts.objects[targetName];
    const emojiSrc = EMOJI_MAP[targetName];
    const boxContainer = document.getElementById('objectBoxes');
    const box = boxContainer.children[foundCount]; // Get the box corresponding to the current count
    box.innerHTML = `<img src="${emojiSrc}" style="width:50px; height:50px;">`; // Place emoji in the box
    let findText = texts.find;
    if (targetName === "cauliflower" && localStorage.getItem('lastLanguageUsed') === 'sami') {
        findText = "Oze ";
    }
    STATUS.innerHTML = `<div class="status-content">${findText}<img src="${emojiSrc}" alt="${translatedName}" class="emoji-image"></div>`;
    MESSAGE.innerHTML = "";
}


function startTimer() {
    clearTimeout(timer);
    clearInterval(countdown);

    const radius = 70; // Radius of the circle
    const fullCircle = 2 * Math.PI * radius; // Circumference of the circle (2πr)
    const duration = 15; // Timer duration in seconds
    let timeLeft = duration;

    const circle = document.getElementById('timer-circle');
    const timeDisplay = document.getElementById('time-display');

    // Reset circle and text
    circle.style.strokeDasharray = fullCircle;
    circle.style.strokeDashoffset = fullCircle;
    timeDisplay.textContent = timeLeft;

    const intervalTime = 1000; // 1 second
    const step = fullCircle / duration; // Decrement for each second

    countdown = setInterval(() => {
        // Decrement time left
        timeLeft--;

        // Update circle stroke and text display
        const newOffset = step * timeLeft; // Calculate new offset
        circle.style.strokeDashoffset = newOffset;
        timeDisplay.textContent = timeLeft;

        // Timer ends
        if (timeLeft <= 0) {
            clearInterval(countdown);
            circle.style.strokeDashoffset = 0; // Ensure circle fully fills
            timeDisplay.textContent = "0"; // Show "0" when timer ends

            if (!isProcessing) {
                isProcessing = true; // Prevent multiple triggers
                showTimeoutMessage(); // Handle timeout
            }
        }
    }, intervalTime);

    canCheck = true;
}


function showTimeoutMessage() {
    canCheck = false;
    if (!objectsFound.includes(CLASS_NAMES[currentIdx])) {
        updateBox(foundCount, false, EMOJI_MAP[CLASS_NAMES[currentIdx]]);
    }

    STATUS.innerHTML = `${texts.timeUp}`;
    setTimeout(() => {
        proceedToNextObject();
        isProcessing = false; // Reset the flag after processing
    }, 1000);
}

function showWinScreen() {
    updateObjectBoxes();
    const foundObjects = objectsFound.map(obj => ({
        name: obj,
        emoji: EMOJI_MAP[obj]
    }));
    localStorage.setItem('foundObjects', JSON.stringify(foundObjects));
    const lang = localStorage.getItem('lastLanguageUsed') || 'no';
    window.location.href = `win.html?lang=${lang}`; // Redirect to the win page
}


function proceedToNextObject() {
    foundCount++;
    if (foundCount < totalObjects) {
        setTimeout(() => {
            selectNextObject();
            isProcessing = false; 
        }, 3000);
    } else {
        showWinScreen();
    }
}

function updateBox(index, found, emojiSrc) {
    const boxContainer = document.getElementById('objectBoxes');
    const box = boxContainer.children[index];
    box.innerHTML = `<img src="${emojiSrc}" style="width:50px; height:50px;">`;
    box.className = found ? 'box found' : 'box not-found';
    box.innerHTML += found ? `<span class="checkmark">✓</span>` : `<span class="cross">&#x2716;</span>`;
}


function gameLoop() {
    if (videoPlaying && mobilenet && model) {
        if (canCheck && !isProcessing) {
            tf.tidy(() => {
                const videoFrameAsTensor = tf.browser.fromPixels(VIDEO).div(255);
                const resizedTensorFrame = tf.image.resizeBilinear(videoFrameAsTensor, [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH], true);
                const features = mobilenet.predict(resizedTensorFrame.expandDims());
                const prediction = model.predict(features).squeeze();
                const highestIndex = prediction.argMax().arraySync();
                const highestConfidence = prediction.arraySync()[highestIndex];
                const className = CLASS_NAMES[highestIndex];
                const translatedName = texts.objects[className];
                const emojiSrc = EMOJI_MAP[className];

                // Remove comment to view live prediction of objects
                // PREDICT.innerHTML = `Prediction: ${translatedName} <img src="${emojiSrc}" alt="${translatedName}" style="width:24px;height:24px;"> with ${Math.floor(highestConfidence * 100)}% confidence`;

                if (highestIndex === currentIdx && highestConfidence >= 0.99) {
                    isProcessing = true; 
                    STATUS.innerHTML = `${texts.congratulations} ${translatedName} <img src="${emojiSrc}" alt="${translatedName}" style="width:120px;height:120px;">`;
                    objectsFound.push(className);
                    updateBox(foundCount, true, emojiSrc);
                    canCheck = false;
                    isProcessing = true;
                    proceedToNextObject();
                    
                }
            });
        }
    }
    window.requestAnimationFrame(gameLoop);
}

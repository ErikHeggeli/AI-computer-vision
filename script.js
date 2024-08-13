const VIDEO = document.getElementById('webcam');
const STATUS = document.getElementById('status');
const MESSAGE = document.getElementById('message');
const PREDICT = document.getElementById('predict');
const modelUrl = '/model/model.json';
const numObjects = 12
const MOBILE_NET_INPUT_WIDTH = 224;
const MOBILE_NET_INPUT_HEIGHT = 224;
const CLASS_NAMES = ["scallop", "watering can", "bomb", "stapler", "smoke detector", "dinosaur", "sunglasses", "spoon", "foraminifera", "football boot", "headset", "bottle", "coat rack", "tape", "teddy bear", "ruler", "chainsaw", "computer mouse", "flag", "sword", "ipad"];
const TIMELIMIT = 15000;
let model;
let mobilenet;
let videoPlaying = false;
let currentIdx = -1;
let timer;
let countdown;

const EMOJI_MAP = {
  "scallop": "/img/emoji/scallop.svg", 
  "watering can": "/img/emoji/watering-can.svg", 
  "bomb": "/img/emoji/bomb.svg", 
  "stapler": "/img/emoji/stapler.svg", 
  "smoke detector": "/img/emoji/t-rex.svg", 
  "dinosaur": "/img/emoji/t-rex.svg", 
  "sunglasses": "/img/emoji/sunglasses.svg", 
  "spoon": "/img/emoji/spoon.svg", 
  "foraminifera": "/img/emoji/foraminifera-white.png", 
  "football boot": "/img/emoji/soccer-shoe.svg", 
  "headset": "/img/emoji/headphones.svg", 
  "bottle": "/img/emoji/cola.svg", 
  "coat rack": "/img/emoji/coatrack.svg", 
  "tape": "/img/emoji/adhesive-tape.svg", 
  "teddy bear": "/img/emoji/teddy-bear.svg", 
  "ruler": "/img/emoji/straight-ruler.svg", 
  "chainsaw": "/img/emoji/chainsaw.svg", 
  "computer mouse": "/img/emoji/mouse.svg", 
  "flag": "/img/emoji/norway.svg", 
  "sword": "/img/emoji/sword.svg", 
  "ipad": "/img/emoji/ipad.svg"
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
      navigator.serviceWorker.register('/service.js').then(function(registration) {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(err) {
          console.log('ServiceWorker registration failed: ', err);
      });
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
                selectRandomObject();
                gameLoop();
            });
        }).catch(function(error) {
            console.error('Camera access denied:', error);
        });
    } else {
        console.warn('getUserMedia() is not supported by your browser');
    }
}

function selectRandomObject() {
    currentIdx = Math.floor(Math.random() * CLASS_NAMES.length);
    const targetName = CLASS_NAMES[currentIdx];
    const emojiSrc = EMOJI_MAP[targetName] || "img/emoji/unknown.png";
    STATUS.innerHTML = `Find <img src="${emojiSrc}" alt="${targetName}" class="emoji-image">`;
    MESSAGE.innerHTML = "";
    
    startTimer();
}

function startTimer() {
    let timeLeft = 15; // 15 seconds countdown
    document.getElementById('timer').innerHTML = timeLeft; // Display the starting time

    // Clear any existing timers and intervals
    clearTimeout(timer);
    clearInterval(countdown);

    // Update the timer every second
    countdown = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerHTML = timeLeft; // Update the display

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
    MESSAGE.innerHTML = 'Time is up!';
    setTimeout(() => {
        window.location.href = 'index.html'; // Redirect to the index page after 3 seconds
    }, 3000);
}

function gameLoop() {
    if (videoPlaying && mobilenet && model) {
        tf.tidy(() => {
            const videoFrameAsTensor = tf.browser.fromPixels(VIDEO).div(255);
            const resizedTensorFrame = tf.image.resizeBilinear(videoFrameAsTensor, [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH], true);
            const features = mobilenet.predict(resizedTensorFrame.expandDims());
            const prediction = model.predict(features).squeeze();
            const highestIndex = prediction.argMax().arraySync();
            const predictionArray = prediction.arraySync();
            const className = CLASS_NAMES[highestIndex];
            const emojiSrc = EMOJI_MAP[className];

            PREDICT.innerHTML = `Prediction: ${className} <img src="${emojiSrc}" alt="${className}" style="width:24px;height:24px;"> with ${Math.floor(predictionArray[highestIndex] * 100)}% confidence`;
            if (Math.floor(predictionArray[highestIndex] * 100) >= 98) {  
                clearTimeout(timer);         
                MESSAGE.innerHTML = `Congratulations! You found ${className} <img src="${emojiSrc}" alt="${className}" style="width:24px;height:24px;">`;
                setTimeout(selectRandomObject, 3000);
            }
        });
    }
    window.requestAnimationFrame(gameLoop);
}

// Initialize models and start the application
initializeModels();
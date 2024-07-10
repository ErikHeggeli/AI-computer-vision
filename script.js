/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
const STATUS = document.getElementById('status');
const VIDEO = document.getElementById('webcam');
const ENABLE_CAM_BUTTON = document.getElementById('enableCam');
const RESET_BUTTON = document.getElementById('reset');
const TRAIN_BUTTON = document.getElementById('train');
const MOBILE_NET_INPUT_WIDTH = 224;
const MOBILE_NET_INPUT_HEIGHT = 224;
const STOP_DATA_GATHER = -1;
const modelUrl = '/model/model.json';
const CLASS_NAMES = ["scallop",
  "watering can",
  "bomb",
  "stapler",
  "smoke detector",
  "dinosaur",
  "sunglasses",
  "spoon",
  "foraminifera",
  "football boot",
  "headset",
  "bottle",
  "coat rack",
  "tape",
  "teddy bear",
  "ruler",
  "chainsaw",
  "computer mouse",
  "flag",
  "sword",
  "ipad"];
const status = document.getElementById('status');
status.innerText = 'Loaded TensorFlow.js - version: ' + tf.version.tfjs;

ENABLE_CAM_BUTTON.addEventListener('click', enableCam);
TRAIN_BUTTON.addEventListener('click', trainAndPredict);
RESET_BUTTON.addEventListener('click', reset);

let mobilenet = undefined;
let gatherDataState = STOP_DATA_GATHER;
let videoPlaying = false;
let trainingDataInputs = [];
let trainingDataOutputs = [];
let examplesCount = [];
let predict = false;

async function loadAndProcessImage(imagePath) {
    const img = await tf.browser.fromPixels(imagePath);
    const resized = tf.image.resizeBilinear(img, [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH]);
    const normalized = resized.div(255.0).expandDims();
    return normalized;
}

async function createTrainingData(imagePaths, labels) {
    const classIndices = labels.map(label => CLASS_NAMES.indexOf(label));
    const imagesAsTensors = [];
    for (let i = 0; i < imagePaths.length; i++) {
        const processedImage = await loadAndProcessImage(imagePaths[i]);
        imagesAsTensors.push(processedImage);
    }
    const labelsAsTensor = tf.tensor1d(classIndices, 'int32');
    const imagesAsTensor = tf.stack(imagesAsTensors);
    const oneHotLabels = tf.oneHot(labelsAsTensor, CLASS_NAMES.length);
    return { imagesAsTensor, oneHotLabels };
}

async function trainWithPreloadedData() {
    const { imagesAsTensor, oneHotLabels } = await createTrainingData(imagePaths, labels);

    let results = await model.fit(imagesAsTensor, oneHotLabels, {
        shuffle: true,
        batchSize: 5,
        epochs: 10,
        callbacks: { onEpochEnd: logProgress }
    });

    imagesAsTensor.dispose();
    oneHotLabels.dispose();
    predict = true;
    predictLoop();
}
async function loadModel() {
    try {
        model = await tf.loadLayersModel(modelUrl);
        console.log('Model loaded from the same directory.');
        compileModel();  // Ensure the model is compiled
    } catch (error) {
        console.error('Failed to load model from the same directory:', error);
        // Optionally, define and compile a new model here if loading fails
    }
    model.summary();
}


function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
  
function enableCam() {
if (hasGetUserMedia()) {
    // getUsermedia parameters.
    const constraints = {
    video: true,
    width: 1920, 
    height: 1080 
    };

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    VIDEO.srcObject = stream;
    VIDEO.addEventListener('loadeddata', function() {
        videoPlaying = true;
        ENABLE_CAM_BUTTON.classList.add('removed');
        
    if (loadModel()) {
        predict = true;
        predictLoop();
    }
    
    });
    });
} else {
    console.warn('getUserMedia() is not supported by your browser');
}
}

function predictLoop() {
    if (predict) {
      tf.tidy(function() {
        let videoFrameAsTensor = tf.browser.fromPixels(VIDEO).div(255);
        let resizedTensorFrame = tf.image.resizeBilinear(videoFrameAsTensor,[MOBILE_NET_INPUT_HEIGHT, 
            MOBILE_NET_INPUT_WIDTH], true);
  
        let imageFeatures = mobilenet.predict(resizedTensorFrame.expandDims());
        let prediction = model.predict(imageFeatures).squeeze();
        let highestIndex = prediction.argMax().arraySync();
        let predictionArray = prediction.arraySync();
  
        STATUS.innerText = 'Prediction: ' + CLASS_NAMES[highestIndex] + ' with ' + Math.floor(predictionArray[highestIndex] * 100) + '% confidence';
        if ((predictionArray[highestIndex] > 0.98))
          {
            STATUS.innerText = 'CONGRATULATIONS you found ' + CLASS_NAMES[highestIndex];
          }
      });
  
      window.requestAnimationFrame(predictLoop);
    }
  }

  async function trainAndPredict() {
    predict = false;
    tf.util.shuffleCombo(trainingDataInputs, trainingDataOutputs);
    let outputsAsTensor = tf.tensor1d(trainingDataOutputs, 'int32');
    let oneHotOutputs = tf.oneHot(outputsAsTensor, CLASS_NAMES.length);
    let inputsAsTensor = tf.stack(trainingDataInputs);
    
    let results = await model.fit(inputsAsTensor, oneHotOutputs, {
        shuffle: true, 
        batchSize: 5, 
        epochs: 10, 
        callbacks: {onEpochEnd: logProgress}
    });
    
    // Save and download the model
    await model.save('downloads://my-model');

    outputsAsTensor.dispose();
    oneHotOutputs.dispose();
    inputsAsTensor.dispose();
    predict = true;
    predictLoop();
}
  
  function logProgress(epoch, logs) {
    console.log('Data for epoch ' + epoch, logs);
  }


/**
 * Purge data and start over. Note this does not dispose of the loaded 
 * MobileNet model and MLP head tensors as you will need to reuse 
 * them to train a new model.
 **/
function reset() {
  predict = false;
  examplesCount.length = 0;
  for (let i = 0; i < trainingDataInputs.length; i++) {
    trainingDataInputs[i].dispose();
  }
  trainingDataInputs.length = 0;
  trainingDataOutputs.length = 0;
  STATUS.innerText = 'No data collected';
  
  console.log('Tensors in memory: ' + tf.memory().numTensors);
}

let dataCollectorButtons = document.querySelectorAll('button.dataCollector');
for (let i = 0; i < dataCollectorButtons.length; i++) {
    dataCollectorButtons[i].addEventListener('mousedown', () => startGatheringData(i));
    dataCollectorButtons[i].addEventListener('mouseup', stopGatheringData);
    // Populate the human-readable names for classes.
    CLASS_NAMES.push(dataCollectorButtons[i].getAttribute('data-name'));
}

function startGatheringData(classIndex) {
    gatherDataState = classIndex;
    dataGatherLoop();
}

function stopGatheringData() {
    gatherDataState = STOP_DATA_GATHER;
}

function compileModel() {
    model.compile({
        optimizer: 'adam',
        loss: (CLASS_NAMES.length === 2) ? 'binaryCrossentropy' : 'categoricalCrossentropy',
        metrics: ['accuracy']
    });
    console.log('Model compiled.');
}

/**
 * Handle Data Gather for button mouseup/mousedown.
 **/
function gatherDataForClass() {
    let classNumber = parseInt(this.getAttribute('data-1hot'));
    gatherDataState = (gatherDataState === STOP_DATA_GATHER) ? classNumber : STOP_DATA_GATHER;
    dataGatherLoop();
  }

  function dataGatherLoop() {
    if (videoPlaying && gatherDataState !== STOP_DATA_GATHER) {
        let imageFeatures = tf.tidy(function() {
            let videoFrameAsTensor = tf.browser.fromPixels(VIDEO);
            let resizedTensorFrame = tf.image.resizeBilinear(videoFrameAsTensor, [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH], true);
            let normalizedTensorFrame = resizedTensorFrame.div(255);
            return mobilenet.predict(normalizedTensorFrame.expandDims()).squeeze();
        });

        trainingDataInputs.push(imageFeatures);
        trainingDataOutputs.push(gatherDataState);
        
        if (examplesCount[gatherDataState] === undefined) {
            examplesCount[gatherDataState] = 0;
        }
        examplesCount[gatherDataState]++;

        STATUS.innerText = '';
        for (let n = 0; n < CLASS_NAMES.length; n++) {
            STATUS.innerText += CLASS_NAMES[n] + ' data count: ' + examplesCount[n] + '. ';
        }
        window.requestAnimationFrame(dataGatherLoop);
    }
}
/**
 * Loads the MobileNet model and warms it up so ready for use.
 **/
async function loadMobileNetFeatureModel() {
    const URL = 
      'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1';
    
    mobilenet = await tf.loadGraphModel(URL, {fromTFHub: true});
    STATUS.innerText = 'MobileNet v3 loaded successfully!';
    
    // Warm up the model by passing zeros through it once.
    tf.tidy(function () {
      let answer = mobilenet.predict(tf.zeros([1, MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH, 3]));
      console.log(answer.shape);
    });
  }
  
  // Call the function immediately to start loading.
  loadMobileNetFeatureModel();

let model = tf.sequential();
model.add(tf.layers.dense({inputShape: [1024], units: 128, activation: 'relu'}));
model.add(tf.layers.dense({units: CLASS_NAMES.length, activation: 'softmax'}));

model.summary();

// Compile the model with the defined optimizer and specify a loss function to use.
model.compile({
  // Adam changes the learning rate over time which is useful.
  optimizer: 'adam',
  // Use the correct loss function. If 2 classes of data, must use binaryCrossentropy.
  // Else categoricalCrossentropy is used if more than 2 classes.
  loss: (CLASS_NAMES.length === 2) ? 'binaryCrossentropy': 'categoricalCrossentropy', 
  // As this is a classification problem you can record accuracy in the logs too!
  metrics: ['accuracy']  
});


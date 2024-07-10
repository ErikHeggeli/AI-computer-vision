const fs = require('fs');
const path = require('path');
const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');

const IMAGE_WIDTH = 224;
const IMAGE_HEIGHT = 224;
const dataDir = '/home/erik/video-emoji/data/images/';
const os = require('os');

function logMemoryUsage() {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    const total = os.totalmem() / 1024 / 1024;
    console.log(`Memory usage: ${Math.round(used)} MB used of ${Math.round(total)} MB total`);
}
async function loadImage(imagePath) {
    const imageBuffer = fs.readFileSync(imagePath);
    // Decode the image file buffer into a tensor
    const tfImage = tf.node.decodeImage(imageBuffer, 3); // Ensure 3 channels for RGB
    const resizedImage = tf.image.resizeBilinear(tfImage, [IMAGE_HEIGHT, IMAGE_WIDTH]);
    const normalizedImage = resizedImage.div(255.0).expandDims();
    return normalizedImage;  // Return the final processed tensor
}

function logTensorCounts() {
    console.log(`Number of tensors in memory: ${tf.memory().numTensors}`);
}

async function buildModel() {
    const featureExtractor = await loadMobileNetFeatureExtractor();

    const model = tf.sequential();
    model.add(featureExtractor);
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({units: 100, activation: 'relu'}));
    model.add(tf.layers.dense({units: 22, activation: 'softmax'})); // Adjust number of units to match number of categories

    return model;
}
async function loadMobileNetFeatureExtractor() {
    const mobilenetModel = await mobilenet.load({
        version: 2,
        alpha: 1.0
    });

    

    const featureExtractor = mobilenetModel.infer({
        inputShape: [IMAGE_WIDTH, IMAGE_HEIGHT, 3]
    }, 'conv_preds'); // Use an appropriate layer name or use true for the last layer
    // Freeze the MobileNet layers to prevent them from being trained
    featureExtractor.trainable = false;
    return featureExtractor;
}


async function loadBatch(files, categories) {
    const imageTensors = await Promise.all(files.map(async file => {
        const imagePath = path.join(dataDir, file.category, file.name);
        return loadImage(imagePath);
    }));

    return tf.tidy(() => {
        const labelIndices = files.map(file => categories.indexOf(file.category));
        const images = tf.stack(imageTensors);
        const labels = tf.oneHot(tf.tensor1d(labelIndices, 'int32'), categories.length);
        return { xs: images, ys: labels };
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}

async function createDataset() {
    const batchSize = 16; // Reduced batch size
    const categories = fs.readdirSync(dataDir);
    let files = [];

    categories.forEach(category => {
        const categoryDir = path.join(dataDir, category);
        const filenames = fs.readdirSync(categoryDir).map(name => ({ name, category }));
        files = files.concat(filenames);
    });

    console.log(`Total files: ${files.length}`);
    shuffleArray(files); // Use the custom shuffle function

    const dataset = tf.data.generator(function* () {
        while (files.length > 0) {
            const batch = files.splice(0, batchSize);
            yield batch;
            logMemoryUsage(); // Log memory usage at each batch yield
        }
    });

    return dataset.mapAsync(async fileBatch => {
        // Properly await the asynchronous loadBatch function
        return await loadBatch(fileBatch, categories);
    });
}

async function trainModel() {
    const dataset = await createDataset();
    const model = await buildModel();

    model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });

    await model.fitDataset(dataset, {
        epochs: 10,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                console.log(`Epoch ${epoch + 1}: Loss = ${logs.loss}, Accuracy = ${logs.acc}`);
                logTensorCounts(); // Log tensor counts after each epoch
            }
        }
    });

    await model.save('file://model-saved');
}

trainModel().catch(error => {
    console.error("Failed to train the model:", error);
});
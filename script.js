// Password Checker by 3L173 H4CK3R 1337 (@imlegendadi)
// Github - github.com/ImLegendAdi


// Variables to hold image objects and processed image data
let image = null;
let processedImageData = null;

// Getting references to DOM elements
const fileInput = document.getElementById("file-input");
const dropZone = document.getElementById("drop-zone");
const uploadedImg = document.getElementById("uploaded-image");
const processedImg = document.getElementById("processed-image");
const outputSection = document.getElementById("output-section");
const encryptBtn = document.getElementById("encrypt-btn");
const decryptBtn = document.getElementById("decrypt-btn");
const downloadBtn = document.getElementById("download-btn");
const selectFileBtn = document.getElementById("select-file-btn");

// Click event for custom Select Image button (triggers hidden file input)
selectFileBtn.addEventListener("click", () => fileInput.click());

// File input change event (user selected file manually)
fileInput.addEventListener("change", (e) => handleImageUpload(e.target.files[0]));

// Drag over event to allow dropping files (add visual feedback)
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();  // Prevent default browser behavior
  dropZone.classList.add("border-blue-400", "bg-gray-700");  // Highlight border
});

// Drag leave event (remove visual feedback)
dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("border-blue-400", "bg-gray-700");
});

// Drop event handler (user dropped a file)
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();  // Prevent browser from opening the image file
  dropZone.classList.remove("border-blue-400", "bg-gray-700");
  const file = e.dataTransfer.files[0];  // Get the dropped file
  if (file) handleImageUpload(file);  // Proceed with upload
});

// Function to handle file upload and preview
function handleImageUpload(file) {
  const reader = new FileReader();  // Create file reader
  reader.onload = (event) => {
    image = new Image();  // Create Image object
    image.src = event.target.result;  // Set image source from file data URL
    image.onload = () => {
      uploadedImg.src = image.src;  // Set uploaded image preview
      uploadedImg.classList.remove("hidden");  // Show the preview image
    };
  };
  reader.readAsDataURL(file);  // Start reading file as Data URL
}

// Function to encrypt or decrypt image pixels
function processImage(encrypt = true) {
  if (!image) return;  // If no image is loaded, exit function

  // Create an off-screen canvas to draw and manipulate pixels
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);  // Draw image on canvas

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;  // Pixel data array (RGBA)

  const key = 123;  // XOR encryption key

  // Loop through each pixel and manipulate RGB values
  for (let i = 0; i < data.length; i += 4) {
    data[i] ^= key;       // Red channel
    data[i + 1] ^= key;   // Green channel
    data[i + 2] ^= key;   // Blue channel
    // Alpha channel (data[i + 3]) is left unchanged
  }

  ctx.putImageData(imageData, 0, 0);  // Put the modified data back on canvas
  processedImageData = canvas.toDataURL();  // Get the final image as Data URL
  processedImg.src = processedImageData;  // Show processed image
  outputSection.classList.remove("hidden");  // Show the output section
}

// Get DOM references for new buttons and textarea
const secretMessageInput = document.getElementById("secret-message");
const hideMessageBtn = document.getElementById("hide-message-btn");
const visualizeLsbBtn = document.getElementById("visualize-lsb-btn");
const extractMessageBtn = document.getElementById("extract-message-btn");

// Event Listeners for New Buttons
hideMessageBtn.addEventListener("click", hideMessageInLSB);
visualizeLsbBtn.addEventListener("click", visualizeLSBChanges);
extractMessageBtn.addEventListener("click", extractHiddenMessageFromLSB);

// Function to Hide Secret Message in LSB
function hideMessageInLSB() {
  if (!image) return;

  let secretMessage = secretMessageInput.value;
  if (!secretMessage) {
    alert("Please enter a secret message....");
    return;
  }

  // Add Null Terminator to indicate end of message
  secretMessage += '\0';

  // Convert message to binary string
  let binaryMessage = "";
  for (let i = 0; i < secretMessage.length; i++) {
    binaryMessage += secretMessage.charCodeAt(i).toString(2).padStart(8, '0');
  }

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let bitIndex = 0;

  for (let i = 0; i < data.length && bitIndex < binaryMessage.length; i += 4) {
    for (let channel = 0; channel < 3; channel++) {
      if (bitIndex >= binaryMessage.length) break;
      const bit = parseInt(binaryMessage[bitIndex]);
      data[i + channel] = (data[i + channel] & 0xFE) | bit;
      bitIndex++;
    }
  }

  if (bitIndex < binaryMessage.length) {
    alert("Message too large for this image!");
    return;
  }

  ctx.putImageData(imageData, 0, 0);
  processedImageData = canvas.toDataURL();
  processedImg.src = processedImageData;
  outputSection.classList.remove("hidden");
  alert("Message successfully hidden in LSB!");
}

// Function to Visualize LSB-flipped Pixels
function visualizeLSBChanges() {
  if (!image) return;

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const maskData = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    let lsbChanged = false;

    for (let channel = 0; channel < 3; channel++) {
      if ((data[i + channel] & 1) === 1) {
        lsbChanged = true;
        break;
      }
    }

    if (lsbChanged) {
      maskData[i] = 255;    // R
      maskData[i + 1] = 0;  // G
      maskData[i + 2] = 0;  // B
      maskData[i + 3] = 255; // A
    } else {
      maskData[i] = 0;
      maskData[i + 1] = 0;
      maskData[i + 2] = 0;
      maskData[i + 3] = 255;
    }
  }

  ctx.putImageData(new ImageData(maskData, canvas.width, canvas.height), 0, 0);
  processedImageData = canvas.toDataURL();
  processedImg.src = processedImageData;
  outputSection.classList.remove("hidden");
}

// Function to Extract Hidden Message from LSB
function extractHiddenMessageFromLSB() {
  if (!image) return;

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let binaryMessage = "";
  let extractedMessage = "";

  for (let i = 0; i < data.length; i += 4) {
    for (let channel = 0; channel < 3; channel++) {
      binaryMessage += (data[i + channel] & 1).toString();

      if (binaryMessage.length === 8) {
        const charCode = parseInt(binaryMessage, 2);
        if (charCode === 0) {
          alert(`Extracted Message: ${extractedMessage}`);
          return;
        }
        extractedMessage += String.fromCharCode(charCode);
        binaryMessage = "";
      }
    }
  }

  alert(`Extracted Message: ${extractedMessage} (No terminator found)`);
}

// Function to download the processed image
function downloadImage() {
  if (!processedImageData) return;  // No image processed, exit
  const link = document.createElement("a");
  link.href = processedImageData;  // Set download link to the image data
  link.download = "processed-image.png";  // File name for download
  link.click();  // Trigger download
}

function processImageLSBManipulation() {
  if (!image) return;

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Flip LSB of Red channel
    data[i] ^= 1;
    // Flip LSB of Green channel
    data[i + 1] ^= 1;
    // Flip LSB of Blue channel
    data[i + 2] ^= 1;
    // Alpha channel (data[i + 3]) is untouched
  }

  ctx.putImageData(imageData, 0, 0);
  processedImageData = canvas.toDataURL();
  processedImg.src = processedImageData;
  outputSection.classList.remove("hidden");
}

// Event listeners for Encrypt, Decrypt, and Download buttons
encryptBtn.addEventListener("click", () => processImage(true));
decryptBtn.addEventListener("click", () => processImage(false));
downloadBtn.addEventListener("click", downloadImage);
const lsbBtn = document.getElementById("lsb-btn");
lsbBtn.addEventListener("click", processImageLSBManipulation);

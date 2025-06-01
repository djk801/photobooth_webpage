const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const finalImage = document.getElementById('final-image');
const captureBtn = document.querySelector('button[onclick="takePhoto()"]');
const timerDisplay = document.createElement('div');
timerDisplay.id = 'timer-overlay';
document.getElementById('camera-container').appendChild(timerDisplay);
const photos = [];
let isCapturing = false;
let photoCount = 0;

navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
  .then(stream => video.srcObject = stream)
  .catch(err => alert('Camera access denied: ' + err));

function updatePhotoCount() {
    document.getElementById('photo-count').textContent = photoCount;
    if (photoCount >= 4) {
        // Disable capture button after 4 photos
        document.querySelector('#controls button').disabled = true;
    }
}

function takePhoto() {
  if (isCapturing || photos.length >= 4) return;
  
  isCapturing = true;
  captureBtn.disabled = true;
  let count = 5;  // Changed from 8 to 5
  
  timerDisplay.style.display = 'block';
  timerDisplay.textContent = count;
  
  const countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      timerDisplay.textContent = count;
    } else {
      clearInterval(countdownInterval);
      timerDisplay.style.display = 'none';
      captureImage();
      isCapturing = false;
      if (photos.length < 4) {
        captureBtn.disabled = false;
      }
    }
  }, 1000);
}

function captureImage() {
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imgData = canvas.toDataURL('image/png');
  photos.push(imgData);
  photoCount++;

  // Show preview
  const preview = document.getElementById('capture-preview');
  preview.src = imgData;
  preview.style.display = 'block';
  
  setTimeout(() => {
    preview.style.display = 'none';
  }, 800);

  updatePhotoCount();

  if (photos.length === 4) {
    mergePhotos();
  }
}

function resetPhotos() {
  // Reset photos array
  photos.length = 0;
  photoCount = 0;
  
  // Reset UI elements
  document.getElementById('camera-container').style.display = 'flex';
  document.getElementById('final-result').style.display = 'none';
  finalImage.src = '';
  captureBtn.disabled = false;
  
  updatePhotoCount();
  
  // Reset camera preview
  if (video.srcObject) {
    video.play();
  } else {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(stream => {
        video.srcObject = stream;
        video.play();
      })
      .catch(err => alert('Camera access denied: ' + err));
  }
}

function mergePhotos() {
  const width = 1200;   // 2:3 ratio width
  const height = 1800;  // 2:3 ratio height
  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = width;
  mergedCanvas.height = height;
  const ctx = mergedCanvas.getContext('2d');

  // Fill background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // Define the positions and sizes for each photo (adjust as needed for your frame)
  const photoPositions = [
    { x: 70, y: 380, w: 490, h: 650 },    // Top-left
    { x: 70, y: 1080, w: 490, h: 650  },   // Bottom-left
    { x: 630, y: 130, w: 490, h: 650  },   // Top-right
    { x: 630, y: 830, w: 490, h: 650  },  // Bottom-right
  ];

  let loaded = 0;
  const totalImages = photos.length + 1; // +1 for the frame

  // Load and draw frame first
  const frame = new Image();
  frame.onload = () => {
    ctx.drawImage(frame, 0, 0, width, height);
    loaded++;
    // Now load and draw photos over the frame
    photos.forEach((src, i) => {
      const img = new Image();
      img.onload = () => {
        const pos = photoPositions[i];
        ctx.drawImage(img, pos.x, pos.y, pos.w, pos.h);
        loaded++;
        checkComplete();
      };
      img.src = src;
    });
  };
  frame.src = 'frame.png';

  function checkComplete() {
    if (loaded === totalImages) {
      finalImage.src = mergedCanvas.toDataURL('image/png');
      showFinalResult();
    }
  }
}

function showFinalResult() {
  document.getElementById('camera-container').style.display = 'none';
  document.getElementById('final-result').style.display = 'flex';

    // Stop all video tracks
  if (video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
  }
}

// Utility: Log mouse click coordinates relative to a 1600x1600 frame
document.addEventListener('DOMContentLoaded', () => {
  const finalImg = document.getElementById('final-image');
  if (finalImg) {
    finalImg.addEventListener('click', function (e) {
      // Get bounding rect of the image
      const rect = finalImg.getBoundingClientRect();
      // Calculate scale (in case image is resized in the browser)
      const scaleX = 1200 / rect.width;
      const scaleY = 1800 / rect.height;
      // Calculate click position relative to the image
      const x = Math.round((e.clientX - rect.left) * scaleX);
      const y = Math.round((e.clientY - rect.top) * scaleY);
      console.log(`Click at: x=${x}, y=${y} (relative to 1600x1600 frame)`);
    });
  }
});

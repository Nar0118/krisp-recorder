const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const volumeControl = document.getElementById("volume");
const imageInput = document.getElementById("image");
const addImageButton = document.getElementById("addImage");

const preview = document.getElementById("preview");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

let mediaRecorder;
let recordedChunks = [];
let audioContext;
let microphone;
let gainNode;
let image;

async function init() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  preview.srcObject = stream;
  console.log("window.AudioContext", window.AudioContext);
  console.log("window.webkitAudioContext", window.webkitAudioContext);
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  microphone = audioContext.createMediaStreamSource(stream);
  gainNode = audioContext.createGain();
  gainNode.gain.value = volumeControl.value;
  microphone.connect(gainNode);
  const destination = audioContext.createMediaStreamDestination();
  gainNode.connect(destination);

  const canvasStream = canvas.captureStream(30);
  const combinedStream = new MediaStream([
    ...destination.stream.getAudioTracks(),
    ...canvasStream.getVideoTracks(),
  ]);

  mediaRecorder = new MediaRecorder(combinedStream);
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

  volumeControl.addEventListener("input", () => {
    gainNode.gain.value = volumeControl.value;
  });

  preview.addEventListener("play", drawFrame);
}

function handleDataAvailable(event) {
  if (event.data.size > 0) {
    recordedChunks.push(event.data);
  }
}

function handleStop() {
  const recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
  const recordedUrl = URL.createObjectURL(recordedBlob);
  const video = document.createElement("video");
  video.src = recordedUrl;
  video.controls = true;
  document.body.appendChild(video);
}

startButton.addEventListener("click", () => {
  recordedChunks = [];
  mediaRecorder.start();
});

stopButton.addEventListener("click", () => {
  mediaRecorder.stop();
});

addImageButton.addEventListener("click", () => {
  if (imageInput.files && imageInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      image = new Image();
      image.src = e.target.result;
    };
    reader.readAsDataURL(imageInput.files[0]);
  }
});

function drawFrame() {
  if (preview.paused || preview.ended) {
    return;
  }
  context.drawImage(preview, 0, 0, canvas.width, canvas.height);
  if (image) {
    context.drawImage(image, 0, 0, 100, 100);
  }
  requestAnimationFrame(drawFrame);
}

init();

volumeControl.addEventListener("input", () => {
  gainNode.gain.value = volumeControl.value;
});

const btns = document.querySelectorAll("button");

btns.forEach((btn) => {
  btn.addEventListener("click", () => {
    btns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

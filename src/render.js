const { desktopCapturer, remote } = require('electron')
const { dialog, Menu } = remote;
const { writeFile } = require('fs');

let mediaRecorder;
const recordChunks = [];

const video = document.querySelector('video');

const start = document.getElementById('start');
start.onclick = e => {
    mediaRecorder.start();
    start.classList.add('is-danger');
    start.innerText = 'RECORDING';
};

const stop = document.getElementById('stop');
stop.onclick = e => {
    mediaRecorder.stop();
    start.classList.remove('is-danger');
    start.innerText = 'RECORD';
};

const sourceToggle = document.getElementById('source');
source.onclick = getSource;

async function getSource() {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });

    const videoOption = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            };
        })
    );

    videoOption.popup();
}

async function selectSource(source) {
    sourceToggle.innerText = source.name;
    
    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    video.srcObject = stream;
    video.play();

    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(e) {
    console.log('video data available');
    recordChunks.push(e.data);
}

async function handleStop(e) {
    const blob = new Blob(recordChunks, {
        type: 'video/webm; codecs=vp9'
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `vid-${Date.now()}.webm`
    });

    console.log(filePath);

    writeFile(filePath, buffer, () => console.log("Video Saved!!"));
}
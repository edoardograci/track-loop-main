import { isValidAudioBuffer } from './audioVisualizer.js';

export let masterWaveSurfer;

let masterContext = new (window.AudioContext || window.webkitAudioContext)();
let animationFrameId;

const totalDuration = 60; // 60 seconds timeline
const pixelsPerSecond = 100; // Adjust this for desired zoom level

export function setupTimeline() {
    createTimelineHeader();
}

function createTimelineHeader() {
    const timelineHeader = document.getElementById('timelineHeader');
    timelineHeader.style.width = `${totalDuration * pixelsPerSecond}px`;
    for (let i = 0; i <= totalDuration; i += 1) {
        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.style.left = `${i * pixelsPerSecond}px`;
        timestamp.textContent = formatTime(i);
        timelineHeader.appendChild(timestamp);
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function addTrackToTimeline(audioBuffer, fileName) {
    if (!audioBuffer || !isValidAudioBuffer(audioBuffer)) {
        console.error('Invalid audio buffer:', audioBuffer);
        return;
    }

    const trackElement = createTrackElement(audioBuffer, fileName);
    if (!trackElement) {
        console.error('Failed to create track element');
        return;
    }

    const timeline = document.getElementById('timeline');
    timeline.appendChild(trackElement);
    updateMasterTrack();
}

function createTrackElement(audioBuffer, fileName) {
    const trackElement = document.createElement('div');
    trackElement.className = 'timeline-track';
    
    const waveformContainer = document.createElement('div');
    trackElement.appendChild(waveformContainer);

    console.log('Creating WaveSurfer instance');
    const wavesurfer = WaveSurfer.create({
        container: waveformContainer,
        waveColor: 'violet',
        progressColor: 'purple',
        cursorColor: 'navy',
        barWidth: 2,
        barGap: 1,
        height: 100,
        normalize: true,
        responsive: true,
        partialRender: true
    });

    console.log('WaveSurfer instance created:', wavesurfer);

    wavesurfer.load(`/uploads/${fileName}`);

    wavesurfer.on('ready', function() {
        console.log('WaveSurfer is ready');
    });

    wavesurfer.on('error', function(e) {
        console.error('WaveSurfer error:', e);
    });

    trackElement.wavesurfer = wavesurfer;
    trackElement.fileName = fileName;

    return trackElement;
}

function updateMasterTrack() {
    console.log('Updating master track');
    if (masterWaveSurfer) {
        const timeline = document.getElementById('timeline');
        const tracks = timeline.querySelectorAll('.timeline-track');
        if (tracks.length > 0) {
            console.log('Tracks found, updating master');
            // For now, just load the first track. In the future, implement multi-track mixing.
            const firstTrack = tracks[0];
            masterWaveSurfer.load(`/uploads/${firstTrack.fileName}`);
        } else {
            console.log('No tracks found');
        }
    } else {
        console.log('masterWaveSurfer not initialized');
    }
}

export function addTrackToMaster(fileName) {
    if (!masterWaveSurfer) {
        initializeMasterTrack();
    }
    fetch(`/uploads/${fileName}`)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => masterContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            addTrackToTimeline(audioBuffer, fileName);
        })
        .catch(error => console.error('Error loading audio file:', error));
}

export function initializeMasterTrack() {
    const masterTrackContainer = document.querySelector('.master-track-container');
    if (!masterTrackContainer) {
        console.error('Master track container not found');
        return;
    }

    const waveformContainer = document.createElement('div');
    waveformContainer.className = 'master-waveform';
    masterTrackContainer.appendChild(waveformContainer);

    masterWaveSurfer = WaveSurfer.create({
        container: waveformContainer,
        waveColor: 'violet',
        progressColor: 'purple',
        cursorColor: 'navy',
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 1,
        height: 100,
        barGap: 3,
        responsive: true,
        normalize: true,
        partialRender: true
    });

    console.log('Master WaveSurfer initialized:', masterWaveSurfer);

    masterWaveSurfer.on('ready', function() {
        console.log('WaveSurfer is ready');
    });

    masterWaveSurfer.on('audioprocess', function() {
        // Handle audio processing if needed
    });

    masterWaveSurfer.on('seek', function() {
        // Handle seeking if needed
    });
}

export function setupPlayControls() {
    const playPauseButton = document.getElementById('playPauseButton');
    
    if (playPauseButton) {
        playPauseButton.addEventListener('click', () => {
            if (masterWaveSurfer) {
                masterWaveSurfer.playPause();
                updatePlayPauseButton();
            }
        });
    }
}

function updatePlayPauseButton() {
    const playPauseButton = document.getElementById('playPauseButton');
    if (playPauseButton) {
        if (masterWaveSurfer.isPlaying()) {
            playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
        }
    }
}

export function playMaster() {
    if (masterWaveSurfer) {
        masterWaveSurfer.play();
    }
}

export function stopMaster() {
    if (masterWaveSurfer) {
        masterWaveSurfer.pause();
        masterWaveSurfer.seekTo(0);
    }
}
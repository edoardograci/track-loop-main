import { startRecording, stopRecording, getIsRecording } from './audioRecorder.js';
import { playMaster, stopMaster, addTrackToMaster, setupPlayControls } from './timeline.js';
import { masterWaveSurfer } from './timeline.js';
import { playAudioBuffer, stopAudioBuffer } from './audioPlayer.js';  // You'll need to create this file

let isMasterPlaying = false;
let isRecording = false;

export function setupUI() {
    const startStopButton = document.getElementById('startStopButton');
    const recordingStatus = document.getElementById('recordingStatus');
    const playControlsContainer = document.querySelector('.play-controls');
    playControlsContainer.innerHTML = ''; // Clear any existing buttons

    const playFromStartButton = document.createElement('button');
    playFromStartButton.id = 'playFromStart';
    playFromStartButton.textContent = 'Play from Start';
    playControlsContainer.appendChild(playFromStartButton);

    const stopMasterButton = document.createElement('button');
    stopMasterButton.id = 'stopMaster';
    stopMasterButton.textContent = 'Stop Master';
    playControlsContainer.appendChild(stopMasterButton);

    if (startStopButton) {
        startStopButton.addEventListener('click', () => {
            if (getIsRecording()) {
                stopRecording();
                recordingStatus.style.display = 'none';
                startStopButton.textContent = 'Start Recording';
            } else {
                startRecording();
                recordingStatus.style.display = 'inline';
                startStopButton.textContent = 'Stop Recording';
            }
        });
    } else {
        console.error('Start/stop button not found');
    }

    playFromStartButton.addEventListener('click', playMaster); // Updated to use playMaster

    stopMasterButton.addEventListener('click', stopMaster); // Updated to use stopMaster

    const playPauseButton = document.createElement('button');
    playPauseButton.id = 'playPauseButton';
    playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
    playControlsContainer.appendChild(playPauseButton);

    setupPlayControls();

    // Add this function to handle adding tracks to the master
    window.addTrackToMaster = addTrackToMaster;
}

function hideTrackAcceptanceModal() {
    const modal = document.getElementById('trackAcceptanceModal');
    const overlay = modal.parentElement;
    if (overlay && overlay.classList.contains('modal-overlay')) {
        document.body.removeChild(overlay);
        document.body.appendChild(modal);
    }
    modal.style.display = 'none';
}

export function showTrackAcceptanceModal(fileName) {
    const modal = document.createElement('div');
    modal.className = 'modal modal-overlay';  // Added 'modal-overlay' class
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Add new track?</h2>
            <div class="track-preview">
                <button class="play-button">
                    <i class="fas fa-play"></i>
                </button>
                <div class="waveform" id="waveform"></div>
            </div>
            <div class="action-buttons">
                <button class="reject-button">
                    <i class="fas fa-times"></i>
                </button>
                <button class="accept-button">
                    <i class="fas fa-check"></i>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);  // Changed from document.body.appendChild(modal) to ensure it's on top

    // Initialize waveform
    const waveform = WaveSurfer.create({
        container: '#waveform',
        waveColor: 'violet',
        progressColor: 'purple',
        cursorColor: 'navy',
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 1,
        height: 100,
        barGap: 3
    });
    waveform.load(`/uploads/${fileName}`);

    // Play button functionality
    const playButton = modal.querySelector('.play-button');
    playButton.addEventListener('click', () => {
        waveform.playPause();
    });

    // Accept button functionality
    const acceptButton = modal.querySelector('.accept-button');
    acceptButton.addEventListener('click', () => {
        addTrackToMaster(fileName);
        document.body.removeChild(modal);
    });

    // Reject button functionality
    const rejectButton = modal.querySelector('.reject-button');
    rejectButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupUI();
});
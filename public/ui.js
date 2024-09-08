import { startRecording, stopRecording, getIsRecording, setUpdateUICallback } from './audioRecorder.js';
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
        startStopButton.addEventListener('click', async () => {
            try {
                if (getIsRecording()) {
                    // Immediately update the UI
                    startStopButton.textContent = 'Start Recording';
                    recordingStatus.style.display = 'none';
                    // Then stop the recording and show loading
                    await stopRecording();
                    showLoadingIndicator();
                } else {
                    // Update UI before starting recording
                    startStopButton.textContent = 'Stop Recording';
                    recordingStatus.style.display = 'inline';
                    await startRecording();
                }
            } catch (error) {
                console.error('Error during recording operation:', error.name, error.message);
                startStopButton.textContent = 'Start Recording';
                recordingStatus.style.display = 'none';
                alert(`An error occurred while trying to record: ${error.message}. Please try again.`);
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

    // Use the existing setUpdateUICallback function
    setUpdateUICallback((state) => {
        if (state === 'recording') {
            startStopButton.textContent = 'Stop Recording';
            recordingStatus.style.display = 'inline';
        } else if (state === 'stopped') {
            startStopButton.textContent = 'Start Recording';
            recordingStatus.style.display = 'none';
        }
    });
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

export function showLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const startStopButton = document.getElementById('startStopButton');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    if (startStopButton) {
        startStopButton.textContent = 'Start Recording';
    }
    // Ensure the recording status is hidden when showing the loading indicator
    const recordingStatus = document.getElementById('recordingStatus');
    if (recordingStatus) {
        recordingStatus.style.display = 'none';
    }
}

function updateUIForStoppedRecording() {
    const startStopButton = document.getElementById('startStopButton');
    const recordingStatus = document.getElementById('recordingStatus');
    startStopButton.textContent = 'Start Recording';
    recordingStatus.style.display = 'none';
    showLoadingIndicator();
}

function updateUIForStartedRecording() {
    const startStopButton = document.getElementById('startStopButton');
    const recordingStatus = document.getElementById('recordingStatus');
    startStopButton.textContent = 'Stop Recording';
    recordingStatus.style.display = 'inline';
}

export function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const loadingBar = document.getElementById('loadingBar');
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (loadingBar) loadingBar.style.width = '0%';
    // Don't change the start/stop button text here
}

export function updateLoadingProgress(progress, status) {
    const loadingBar = document.getElementById('loadingBar');
    const loadingStatus = document.getElementById('loadingStatus');
    if (loadingBar) {
        loadingBar.style.width = `${progress}%`;
    }
    if (loadingStatus) {
        loadingStatus.textContent = status;
        loadingStatus.style.display = 'block'; // Ensure the status is visible
    }
    console.log(`Loading progress: ${progress}%, Status: ${status}`); // For debugging
}
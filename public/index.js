import { setupAudioRecorder } from './audioRecorder.js';
import { setupAudioProcessor } from './audioProcessor.js';
import { setupTimeline } from './timeline.js';
import { setupUI } from './ui.js';
import { initializeMasterTrack, setupPlayControls } from './timeline.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, setting up application...');
    setupUI();
    setupAudioRecorder();
    setupAudioProcessor();
    setupTimeline();
    initializeMasterTrack();
    setupPlayControls();
});
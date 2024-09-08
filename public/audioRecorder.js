import { sendAudioForProcessing } from './audioProcessor.js';
import { getAudioContext } from './timeline.js';

let mediaRecorder;
let isRecording = false;
let audioChunks = [];
let audioContext;
let updateUICallback = () => {}; // Initialize with an empty function

export function setupAudioRecorder() {
    // Don't create AudioContext here, we'll do it on user interaction
    console.log('Audio Recorder setup complete');
}

export function setUpdateUICallback(callback) {
    updateUICallback = callback;
}

export function startRecording() {
    return new Promise((resolve, reject) => {
        const audioContext = getAudioContext();
        if (!audioContext) {
            console.error('AudioContext could not be created');
            reject(new Error('AudioContext could not be created'));
            return;
        }

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                console.log('Media stream created successfully');
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };
                mediaRecorder.onstop = async () => {
                    if (audioChunks.length > 0) {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                        audioChunks = [];
                        updateUICallback('recording');
                        try {
                            await sendAudioForProcessing(audioBlob);
                            updateUICallback('stopped');
                        } catch (error) {
                            console.error('Error processing audio:', error);
                            updateUICallback('stopped');
                        } finally {
                            updateUICallback('stopped');
                        }
                    } else {
                        console.warn('No audio data recorded');
                    }
                    isRecording = false;
                };
                mediaRecorder.start();
                isRecording = true;
                console.log('Recording started');
                resolve();
            })
            .catch(error => {
                console.error('Error accessing media devices:', error.name, error.message);
                reject(error);
            });
    });
}

export function stopRecording() {
    return new Promise((resolve, reject) => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            console.log('Recording stopped');
            // The actual resolution of the promise will happen in the onstop event
            updateUICallback('stopped');
            // Then start your audio processing
        } else {
            console.error('MediaRecorder is not initialized or not recording.');
            reject(new Error('Not recording'));
        }
    });
}

export function getIsRecording() {
    return isRecording;
}

export { isRecording };
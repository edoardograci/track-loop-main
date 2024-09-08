import { sendAudioForProcessing } from './audioProcessor.js';

let mediaRecorder;
let isRecording = false;
let audioChunks = [];

export function setupAudioRecorder() {
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContextClass();
        // Use audioContext as needed
    } else {
        console.error('Web Audio API is not supported in this browser');
    }
    console.log('Audio Recorder setup complete');
}

export function startRecording() {
    return new Promise((resolve, reject) => {
        if (isRecording) {
            console.log('Already recording');
            resolve();
            return;
        }
        
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };
                mediaRecorder.onstop = async () => {
                    if (audioChunks.length > 0) {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                        audioChunks = [];
                        await sendAudioForProcessing(audioBlob);
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
                console.error('Error accessing media devices.', error);
                reject(error);
            });
    });
}

export function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        console.log('Recording stopped');
    } else {
        console.error('MediaRecorder is not initialized or not recording.');
    }
}

export function getIsRecording() {
    return isRecording;
}

export { isRecording };
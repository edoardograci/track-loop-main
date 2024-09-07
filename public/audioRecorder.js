import { sendAudioForProcessing } from './audioProcessor.js';

let mediaRecorder;
let isRecording = false;
let audioChunks = [];

export function setupAudioRecorder() {
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
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    audioChunks = [];
                    await sendAudioForProcessing(audioBlob);
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
import { decodeAudioData, isValidAudioBuffer } from './audioVisualizer.js';
import { showLoadingIndicator, hideLoadingIndicator, updateLoadingProgress, showTrackAcceptanceModal } from './ui.js';  // Adjust the import path as needed
import { addTrackToMaster as addTrackToMasterTimeline } from './timeline.js';

let isProcessing = false;

export function setupAudioProcessor() {
    console.log('Audio Processor setup complete');
}

export async function sendAudioForProcessing(audioBlob) {
    showLoadingIndicator();
    updateLoadingProgress(0, "Initializing...");
    try {
        updateLoadingProgress(25, "Analyzing audio...");
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');
        
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error details:', errorData);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}`);
        }
        
        const result = await response.json();
        console.log('Processing result:', result);
        
        updateLoadingProgress(50, "Converting to instrument...");
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        updateLoadingProgress(75, "Finalizing...");
        // Simulate some more processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        updateLoadingProgress(100, "Processing complete");
        hideLoadingIndicator();
        
        if (result.message === 'File processed successfully') {
            console.log('Showing modal for file:', result.convertedFile);
            showTrackAcceptanceModal(result.convertedFile);
        }
        
        return result;
    } catch (error) {
        console.error('Error in sendAudioForProcessing:', error);
        updateLoadingProgress(100, "Processing failed");
        hideLoadingIndicator();
        throw error;
    }
}

function addTrackToMaster(fileName) {
    // Implement the logic to add the new track to the master track or timeline
    console.log('Adding track to master:', fileName);
    // ... code to add the track to the UI ...
}
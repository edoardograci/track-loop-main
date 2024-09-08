let audioContext;

export async function decodeAudioData(audioUrl) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();

    return new Promise((resolve, reject) => {
        audioContext.decodeAudioData(arrayBuffer, 
            (buffer) => {
                if (isValidAudioBuffer(buffer)) {
                    resolve(buffer);
                } else {
                    reject(new Error('Invalid audio buffer'));
                }
            },
            (error) => {
                reject(error);
            }
        );
    });
}

export function isValidAudioBuffer(buffer) {
    return buffer && 
           buffer.length > 0 && 
           buffer.duration > 0 && 
           buffer.numberOfChannels > 0 && 
           buffer.sampleRate > 0;
}
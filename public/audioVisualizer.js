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

/* export function createAudioVisualizer(audioBuffer, pixelsPerSecond) {
    console.log('Creating audio visualizer');
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(audioBuffer.duration * pixelsPerSecond);
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;

    ctx.fillStyle = 'violet'; // Use violet color to match WaveSurfer
    ctx.beginPath();

    for (let i = 0; i < canvas.width; i++) {
        let min = 1.0;
        let max = -1.0;
        for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }
        ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }

    return canvas;
} */
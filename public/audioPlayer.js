let audioContext;
let source;

export function playAudioBuffer(buffer) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (source) {
        source.stop();
    }
    
    source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
}

export function stopAudioBuffer() {
    if (source) {
        source.stop();
    }
}
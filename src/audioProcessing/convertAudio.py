import sys
import os
import numpy as np
import librosa
import soundfile as sf
from scipy.signal import medfilt
from pydub import AudioSegment
from midiutil import MIDIFile
import subprocess
import logging
import traceback

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def load_audio(file_path):
    """Load audio file with librosa and normalize it."""
    y, sr = librosa.load(file_path, sr=None)
    return librosa.util.normalize(y), sr

def extract_audio_from_webm(input_file, audio_file):
    """Extract audio from a WebM file using FFmpeg."""
    try:
        subprocess.run([
            'ffmpeg', '-i', input_file, '-acodec', 'pcm_s16le', '-ar', '44100', audio_file
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error extracting audio: {e}")
        sys.exit(1)

def hz_to_midi(frequencies):
    """Convert frequencies to MIDI note numbers, clamping to valid MIDI range."""
    midi_notes = np.round(69 + 12 * np.log2(frequencies / 440.0)).astype(int)
    return np.clip(midi_notes, 0, 127)  # Clamp values to 0-127 range

def voice_to_midi(input_file, output_midi):
    try:
        print("Loading audio file...")
        y, sr = load_audio(input_file)
        print(f"Loaded audio: shape={y.shape}, sr={sr}")

        print("Performing pitch detection...")
        f0, voiced_flag, voiced_probs = librosa.pyin(y, fmin=librosa.note_to_hz('C2'), 
                                                     fmax=librosa.note_to_hz('C7'),
                                                     sr=sr, frame_length=2048, 
                                                     win_length=1024, hop_length=256)
        
        print("Applying median filter for smoother pitch...")
        f0_filtered = medfilt(f0, kernel_size=5)
        
        print("Detecting onsets...")
        onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=256)
        onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, 
                                            units='time', hop_length=256, 
                                            backtrack=True, pre_max=5, post_max=5, 
                                            pre_avg=10, post_avg=10, delta=0.1, wait=10)
        print(f"Detected {len(onsets)} onsets")

        print("Creating MIDI file...")
        # Slow down the tempo
        tempo = 120  # Adjust this value to slow down or speed up the output

        midi = MIDIFile(1)
        midi.addTempo(0, 0, tempo)

        current_note = None
        for i, onset in enumerate(onsets):
            start_frame = int(onset * sr / 256)
            end_frame = int(onsets[i+1] * sr / 256) if i < len(onsets) - 1 else len(f0_filtered)
            
            pitch_segment = f0_filtered[start_frame:end_frame]
            voiced_segment = voiced_flag[start_frame:end_frame]
            
            if len(pitch_segment) > 0 and np.any(voiced_segment):
                freq = np.median(pitch_segment[voiced_segment])
                note = int(hz_to_midi(freq))
                logging.debug(f"Frequency: {freq}, MIDI note: {note}")
                if 0 < note < 128:
                    if current_note is not None and current_note != note:
                        duration = max(0, onset - onsets[i-1] if i > 0 else onset) * 2  # Double the duration
                        midi.addNote(0, 0, current_note, (onsets[i-1] if i > 0 else 0) * 2, duration, 100)
                        logging.debug(f"Added note: {current_note}, onset: {(onsets[i-1] if i > 0 else 0) * 2}, duration: {duration}")
                    current_note = note
                else:
                    logging.warning(f"Invalid MIDI note {note} detected and skipped.")
                    current_note = None

        if current_note is not None:
            duration = max(0, (onsets[-1] - (onsets[-2] if len(onsets) > 1 else 0)) * 2)
            midi.addNote(0, 0, current_note, onsets[-1] * 2, duration, 100)
            logging.debug(f"Added last note: {current_note}, onset: {onsets[-1] * 2}, duration: {duration}")

        print(f"Saving MIDI file to {output_midi}")
        logging.debug(f"MIDI event list: {midi.tracks[0].eventList}")
        with open(output_midi, "wb") as output_file:
            midi.writeFile(output_file)
        print("MIDI file saved successfully")

    except Exception as e:
        logging.error(f"Error in voice_to_midi: {str(e)}")
        logging.error(traceback.format_exc())
        raise  # Re-raise the exception after logging

def midi_to_audio(midi_file, output_audio_file):
    """Convert MIDI file to audio using FluidSynth."""
    try:
        print(f"Converting MIDI to audio using FluidSynth...")
        
        soundfont_path = os.path.abspath('./soundFont/Essential Keys-sfzBanks-v9.6.sf2')
        
        midi_file = os.path.abspath(midi_file)
        output_audio_file = os.path.abspath(output_audio_file)
        
        command = [
            'fluidsynth',
            '-ni',
            '-g', '1',
            '-F', output_audio_file,
            soundfont_path,
            midi_file
        ]
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print("FluidSynth stdout:", result.stdout)
        print("FluidSynth stderr:", result.stderr)
        
        if not os.path.exists(output_audio_file):
            raise FileNotFoundError(f"FluidSynth failed to create output file: {output_audio_file}")
        
        print("Audio conversion complete")

    except subprocess.CalledProcessError as e:
        print(f"Error in midi_to_audio: {str(e)}")
        print("FluidSynth stdout:", e.stdout)
        print("FluidSynth stderr:", e.stderr)
        raise
    except Exception as e:
        print(f"Error in midi_to_audio: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

def main(input_file, output_file):
    logging.info(f"Starting conversion process...")
    logging.info(f"Input file: {input_file}")
    logging.info(f"Output file: {output_file}")
    
    temp_audio = 'temp.wav'
    temp_midi = 'temp.mid'
    
    try:
        if input_file.endswith('.webm'):
            logging.info("Extracting audio from WebM file...")
            extract_audio_from_webm(input_file, temp_audio)
            input_file = temp_audio
        
        logging.info("Converting voice to MIDI...")
        voice_to_midi(input_file, temp_midi)
        logging.info("MIDI conversion complete.")
        
        logging.info("Converting MIDI to audio...")
        # Ensure the output directory exists
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        midi_to_audio(temp_midi, output_file)
        logging.info("Audio conversion complete.")
        
        if os.path.exists(output_file):
            logging.info(f"Conversion complete. Output file: {output_file}")
            logging.info(f"Absolute path of output file: {os.path.abspath(output_file)}")
        else:
            raise FileNotFoundError(f"Output file not found at {output_file}")
    except Exception as e:
        logging.error(f"Error during conversion process: {str(e)}")
        logging.error(traceback.format_exc())
        sys.exit(1)
    finally:
        # Clean up temporary files
        for temp_file in [temp_audio, temp_midi]:
            if os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except Exception as e:
                    logging.error(f"Error removing temporary file {temp_file}: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        logging.error("Usage: python convertAudio.py <input_file> <output_file>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    try:
        main(input_file, output_file)
    except Exception as e:
        logging.error(f"Error in main: {str(e)}")
        sys.exit(1)
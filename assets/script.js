class VoiceOverController {
    constructor() {
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.voices = [];
        this.isPlaying = false;
        this.isPaused = false;
        this.currentText = '';
        this.textSegments = [];
        this.currentSegmentIndex = 0;
        
        this.initializeElements();
        this.loadVoices();
        this.setupEventListeners();
        this.prepareScript();
    }

    initializeElements() {
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.voiceSelect = document.getElementById('voiceSelect');
        this.speedRange = document.getElementById('speedRange');
        this.speedValue = document.getElementById('speedValue');
        this.pitchRange = document.getElementById('pitchRange');
        this.pitchValue = document.getElementById('pitchValue');
        this.progressFill = document.getElementById('progressFill');
        this.status = document.getElementById('status');
        this.scriptContent = document.getElementById('scriptContent');
    }

    loadVoices() {
        const updateVoices = () => {
            this.voices = this.synth.getVoices();
            this.voiceSelect.innerHTML = '';
            
            this.voices.forEach((voice, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${voice.name} (${voice.lang})`;
                this.voiceSelect.appendChild(option);
            });
        };

        updateVoices();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = updateVoices;
        }
    }

    setupEventListeners() {
        this.playBtn.addEventListener('click', () => this.play());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        this.speedRange.addEventListener('input', (e) => {
            this.speedValue.textContent = e.target.value + 'x';
        });
        
        this.pitchRange.addEventListener('input', (e) => {
            this.pitchValue.textContent = e.target.value;
        });
    }

    prepareScript() {
        const textElements = this.scriptContent.querySelectorAll('p, em');
        this.textSegments = Array.from(textElements)
            .map(el => el.textContent.trim())
            .filter(text => text.length > 0);
    }

    play() {
        if (this.isPaused && this.utterance) {
            this.synth.resume();
            this.isPaused = false;
            this.updateControls();
            this.status.textContent = 'Resuming...';
            return;
        }

        if (this.isPlaying) return;

        this.isPlaying = true;
        this.currentSegmentIndex = 0;
        this.playNextSegment();
        this.updateControls();
    }

    playNextSegment() {
        if (this.currentSegmentIndex >= this.textSegments.length) {
            this.stop();
            return;
        }

        const text = this.textSegments[this.currentSegmentIndex];
        this.utterance = new SpeechSynthesisUtterance(text);
        
        const selectedVoiceIndex = this.voiceSelect.value;
        if (this.voices[selectedVoiceIndex]) {
            this.utterance.voice = this.voices[selectedVoiceIndex];
        }
        
        this.utterance.rate = parseFloat(this.speedRange.value);
        this.utterance.pitch = parseFloat(this.pitchRange.value);
        
        this.utterance.onstart = () => {
            this.status.textContent = `Reading segment ${this.currentSegmentIndex + 1} of ${this.textSegments.length}`;
            this.highlightCurrentText(text);
        };
        
        this.utterance.onend = () => {
            this.currentSegmentIndex++;
            this.updateProgress();
            
            if (this.currentSegmentIndex < this.textSegments.length && this.isPlaying) {
                setTimeout(() => this.playNextSegment(), 100);
            } else if (this.currentSegmentIndex >= this.textSegments.length) {
                this.stop();
            }
        };
        
        this.utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.status.textContent = 'Error occurred during playback';
        };
        
        this.synth.speak(this.utterance);
    }

    highlightCurrentText(text) {
        // Remove previous highlights
        const highlighted = this.scriptContent.querySelectorAll('.highlight');
        highlighted.forEach(el => {
            el.classList.remove('highlight');
        });

        // Find and highlight current text
        const textElements = this.scriptContent.querySelectorAll('p, em');
        textElements.forEach(el => {
            if (el.textContent.trim() === text.trim()) {
                el.classList.add('highlight');
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    pause() {
        if (this.isPlaying && !this.isPaused) {
            this.synth.pause();
            this.isPaused = true;
            this.updateControls();
            this.status.textContent = 'Paused';
        }
    }

    stop() {
        this.synth.cancel();
        this.isPlaying = false;
        this.isPaused = false;
        this.currentSegmentIndex = 0;
        this.updateControls();
        this.updateProgress();
        this.status.textContent = 'Stopped';
        
        // Remove highlights
        const highlighted = this.scriptContent.querySelectorAll('.highlight');
        highlighted.forEach(el => el.classList.remove('highlight'));
    }

    reset() {
        this.stop();
        this.currentSegmentIndex = 0;
        this.status.textContent = 'Ready to start voice-over';
    }

    updateControls() {
        this.playBtn.disabled = this.isPlaying && !this.isPaused;
        this.pauseBtn.disabled = !this.isPlaying || this.isPaused;
        this.stopBtn.disabled = !this.isPlaying;
    }

    updateProgress() {
        const progress = (this.currentSegmentIndex / this.textSegments.length) * 100;
        this.progressFill.style.width = `${progress}%`;
    }
}

// Initialize the voice-over controller when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VoiceOverController();
});
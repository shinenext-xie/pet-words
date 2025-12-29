/**
 * PET Words Adventure - Flashcard Module
 * Interactive flashcard learning mode
 */

const flashcard = {
    words: [],
    currentIndex: 0,
    isFlipped: false,
    topicId: null,
    speechSynthesis: window.speechSynthesis,
    preferredVoice: null,
    
    /**
     * Find the best English voice available
     */
    getBestVoice() {
        if (this.preferredVoice) return this.preferredVoice;
        
        const voices = this.speechSynthesis.getVoices();
        if (voices.length === 0) return null;
        
        // Priority list of good voices (in order of preference)
        const preferredVoices = [
            // macOS high-quality voices
            'Samantha',
            'Karen',
            'Daniel',
            'Moira',
            'Tessa',
            // Google Chrome voices
            'Google US English',
            'Google UK English Female',
            'Google UK English Male',
            // Microsoft voices (Windows/Edge)
            'Microsoft Zira',
            'Microsoft David',
            'Microsoft Mark',
            // Generic good options
            'English United States',
            'English (United States)',
        ];
        
        // Try to find a preferred voice
        for (const name of preferredVoices) {
            const voice = voices.find(v => 
                v.name.includes(name) || v.name === name
            );
            if (voice) {
                this.preferredVoice = voice;
                console.log('🔊 Using voice:', voice.name);
                return voice;
            }
        }
        
        // Fallback: find any English voice that's not "Google" generic
        const englishVoice = voices.find(v => 
            v.lang.startsWith('en') && 
            !v.name.includes('Google') || v.name.includes('Google US')
        ) || voices.find(v => v.lang.startsWith('en'));
        
        if (englishVoice) {
            this.preferredVoice = englishVoice;
            console.log('🔊 Using fallback voice:', englishVoice.name);
        }
        
        return this.preferredVoice;
    },
    
    /**
     * Initialize flashcard mode with words
     */
    async init(topicId) {
        this.topicId = topicId;
        this.words = await dataLoader.getWords(topicId);
        this.currentIndex = 0;
        this.isFlipped = false;
        
        // Shuffle words for variety
        this.words = [...this.words].sort(() => Math.random() - 0.5);
        
        this.render();
        this.updateProgress();
        
        // Track study activity
        progress.incrementStreak();
    },
    
    /**
     * Render current card
     */
    render() {
        if (this.words.length === 0) return;
        
        const word = this.words[this.currentIndex];
        const card = document.getElementById('flashcard');
        
        // Reset flip state
        if (this.isFlipped) {
            card.classList.remove('flipped');
            this.isFlipped = false;
        }
        
        // Update content
        document.getElementById('card-english').textContent = word.english;
        document.getElementById('card-chinese').textContent = word.chinese;
        document.getElementById('card-english-back').textContent = word.english;
        
        // Update example sentence
        const exampleEnglish = document.getElementById('example-english');
        const exampleChinese = document.getElementById('example-chinese');
        if (exampleEnglish && exampleChinese) {
            exampleEnglish.textContent = word.example || 'No example available';
            exampleChinese.textContent = word.exampleChinese || '';
        }
        
        // Add animation
        card.classList.add('animate-popIn');
        setTimeout(() => card.classList.remove('animate-popIn'), 400);
    },
    
    /**
     * Speak the current word using Web Speech API
     */
    speak() {
        const word = this.words[this.currentIndex];
        if (!word) return;
        
        // Cancel any ongoing speech
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(word.english);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;  // Natural speed, slightly slower for clarity
        utterance.pitch = 1.0; // Natural pitch
        utterance.volume = 1.0;
        
        // Use the best available voice
        const voice = this.getBestVoice();
        if (voice) {
            utterance.voice = voice;
        }
        
        this.speechSynthesis.speak(utterance);
        
        // Visual feedback
        this.showSpeakingFeedback();
    },
    
    /**
     * Speak the word slowly (for learning)
     */
    speakSlow() {
        const word = this.words[this.currentIndex];
        if (!word) return;
        
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(word.english);
        utterance.lang = 'en-US';
        utterance.rate = 0.6;  // Slower for careful listening
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        const voice = this.getBestVoice();
        if (voice) {
            utterance.voice = voice;
        }
        
        this.speechSynthesis.speak(utterance);
        this.showSpeakingFeedback();
    },
    
    /**
     * Speak the example sentence
     */
    speakExample() {
        const word = this.words[this.currentIndex];
        if (!word || !word.example) return;
        
        // Cancel any ongoing speech
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(word.example);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;  // Natural speed
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        const voice = this.getBestVoice();
        if (voice) {
            utterance.voice = voice;
        }
        
        this.speechSynthesis.speak(utterance);
    },
    
    /**
     * Show visual feedback when speaking
     */
    showSpeakingFeedback() {
        const btns = document.querySelectorAll('.sound-btn');
        btns.forEach(btn => {
            btn.classList.add('animate-pulse');
            setTimeout(() => btn.classList.remove('animate-pulse'), 1000);
        });
    },
    
    /**
     * Flip the card
     */
    flip() {
        const card = document.getElementById('flashcard');
        this.isFlipped = !this.isFlipped;
        
        if (this.isFlipped) {
            card.classList.add('flipped');
        } else {
            card.classList.remove('flipped');
        }
    },
    
    /**
     * Go to next card
     */
    next() {
        if (this.currentIndex < this.words.length - 1) {
            this.currentIndex++;
            this.render();
            this.updateProgress();
        } else {
            // Loop back to start or show completion
            this.showCompletion();
        }
    },
    
    /**
     * Go to previous card
     */
    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.render();
            this.updateProgress();
        }
    },
    
    /**
     * Mark current word as correct (remembered)
     */
    markCorrect() {
        const word = this.words[this.currentIndex];
        progress.markAsLearned(word.id);
        
        // Visual feedback
        const btn = document.querySelector('.correct-btn');
        btn.classList.add('animate-pulse');
        setTimeout(() => btn.classList.remove('animate-pulse'), 500);
        
        // Show encouragement
        this.showEncouragement('🎉 太棒了！');
        
        // Auto advance after short delay
        setTimeout(() => this.next(), 800);
    },
    
    /**
     * Mark current word as wrong (need more practice)
     */
    markWrong() {
        const word = this.words[this.currentIndex];
        progress.updateWordProgress(word.id, false);
        
        // Visual feedback
        const btn = document.querySelector('.wrong-btn');
        btn.classList.add('animate-shake');
        setTimeout(() => btn.classList.remove('animate-shake'), 500);
        
        // Add to end of deck for review
        this.words.push(word);
        
        // Show encouragement
        this.showEncouragement('💪 加油！');
        
        // Auto advance
        setTimeout(() => this.next(), 800);
    },
    
    /**
     * Update progress display
     */
    updateProgress() {
        const counter = document.getElementById('card-counter');
        const progressFill = document.getElementById('card-progress-fill');
        
        counter.textContent = `${this.currentIndex + 1} / ${this.words.length}`;
        
        const percent = ((this.currentIndex + 1) / this.words.length) * 100;
        progressFill.style.width = `${percent}%`;
    },
    
    /**
     * Show encouragement message
     */
    showEncouragement(message) {
        // Create floating message
        const msg = document.createElement('div');
        msg.className = 'encouragement-msg';
        msg.textContent = message;
        msg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 2rem;
            font-weight: bold;
            color: var(--primary);
            z-index: 1000;
            animation: fadeInUp 0.3s ease, fadeOut 0.3s ease 0.5s forwards;
            pointer-events: none;
        `;
        
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 800);
    },
    
    /**
     * Show completion screen
     */
    showCompletion() {
        const topicProgress = progress.getTopicProgress(this.topicId, this.words);
        
        // Simple alert for now - can be enhanced with modal
        const message = `
🎉 完成一轮学习！

✅ 已学会: ${topicProgress.learned}/${topicProgress.total} 词
📊 掌握度: ${topicProgress.percent}%

继续学习还是返回？
        `;
        
        if (confirm(message)) {
            // Restart
            this.currentIndex = 0;
            this.words = [...this.words].sort(() => Math.random() - 0.5);
            this.render();
            this.updateProgress();
        } else {
            app.goToTopic();
        }
    },
    
    /**
     * Keyboard navigation
     */
    handleKeypress(e) {
        switch(e.key) {
            case ' ':
            case 'Enter':
                this.flip();
                break;
            case 'ArrowRight':
                this.next();
                break;
            case 'ArrowLeft':
                this.prev();
                break;
            case 'ArrowUp':
                this.markCorrect();
                break;
            case 'ArrowDown':
                this.markWrong();
                break;
            case 's':
                this.speak();
                break;
            case 'S': // Shift+S for slow
                this.speakSlow();
                break;
            case 'e':
            case 'E':
                this.speakExample();
                break;
        }
    }
};

// Load voices when available (some browsers load them async)
if (window.speechSynthesis) {
    // Initial load attempt
    window.speechSynthesis.getVoices();
    
    // Listen for voices to be loaded (Chrome loads them async)
    window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('🔊 Available voices:', voices.length);
        
        // Reset preferred voice so it gets re-selected
        flashcard.preferredVoice = null;
        
        // Pre-select the best voice
        flashcard.getBestVoice();
    };
    
    // Workaround for some browsers that don't fire onvoiceschanged
    setTimeout(() => {
        if (window.speechSynthesis.getVoices().length > 0) {
            flashcard.getBestVoice();
        }
    }, 100);
}

// Add keyboard listener when flashcard screen is active
document.addEventListener('keydown', (e) => {
    const flashcardScreen = document.getElementById('flashcard-screen');
    if (flashcardScreen.classList.contains('active')) {
        flashcard.handleKeypress(e);
    }
});

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);


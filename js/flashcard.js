/**
 * PET Words Adventure - Flashcard Module
 * Interactive flashcard learning mode
 */

const flashcard = {
    words: [],
    allWords: [],  // Store all words for "Learn All" option
    currentIndex: 0,
    isFlipped: false,
    topicId: null,
    mode: 'unlearned',  // 'unlearned' or 'all'
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
     * @param {string} topicId - The topic ID
     * @param {string} mode - 'unlearned' (default) or 'all'
     */
    async init(topicId, mode = 'unlearned') {
        this.topicId = topicId;
        this.mode = mode;
        this.allWords = await dataLoader.getWords(topicId);
        this.currentIndex = 0;
        this.isFlipped = false;
        
        // Filter words based on mode
        if (mode === 'unlearned') {
            this.words = await this.getUnlearnedWords();
        } else {
            this.words = [...this.allWords];
        }
        
        // Check if there are words to learn
        if (this.words.length === 0) {
            this.showAllLearnedMessage();
            return;
        }
        
        // Shuffle words for variety
        this.words = this.words.sort(() => Math.random() - 0.5);
        
        this.render();
        this.updateProgress();
        this.updateModeIndicator();
        
        // Track study activity
        progress.incrementStreak();
    },
    
    /**
     * Get words that haven't been mastered yet
     */
    async getUnlearnedWords() {
        const unlearnedWords = [];
        
        // Get mastered words from cloud (fetch fresh data)
        let masteredWordIds = [];
        if (typeof DB !== 'undefined' && DB.getCurrentUser()) {
            try {
                // Use async version to get fresh data from cloud
                masteredWordIds = await DB.getLearnedWordsForTopicAsync(this.topicId);
                console.log(`☁️ Got ${masteredWordIds.length} learned words from cloud for topic "${this.topicId}"`);
            } catch (error) {
                console.warn('Could not get learned words from cloud:', error);
            }
        }
        
        // Also check local storage as backup
        const localLearned = progress.getLearnedWordIds ? progress.getLearnedWordIds() : [];
        const allMastered = new Set([...masteredWordIds, ...localLearned]);
        
        console.log(`📊 Total mastered word IDs: ${allMastered.size}`);
        
        // Filter out mastered words
        for (const word of this.allWords) {
            const wordId = word.id || word.english.toLowerCase().replace(/\s+/g, '_');
            if (!allMastered.has(wordId)) {
                unlearnedWords.push(word);
            }
        }
        
        console.log(`📚 ${unlearnedWords.length} unlearned words out of ${this.allWords.length} total`);
        return unlearnedWords;
    },
    
    /**
     * Show message when all words are learned
     */
    showAllLearnedMessage() {
        const message = `
🎉 太棒了！你已经学会了这个主题的所有单词！

✅ ${this.allWords.length}/${this.allWords.length} 词已掌握

要复习所有单词吗？
        `;
        
        if (confirm(message)) {
            // Learn all words again
            this.init(this.topicId, 'all');
        } else {
            app.goToTopic();
        }
    },
    
    /**
     * Update mode indicator in UI
     */
    updateModeIndicator() {
        const counter = document.getElementById('card-counter');
        if (counter) {
            const modeText = this.mode === 'unlearned' ? '📖 学习新词' : '🔄 复习全部';
            counter.setAttribute('title', modeText);
        }
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
    async markCorrect() {
        const word = this.words[this.currentIndex];
        progress.markAsLearned(word.id);
        
        // Visual feedback
        const btn = document.querySelector('.correct-btn');
        btn.classList.add('animate-pulse');
        setTimeout(() => btn.classList.remove('animate-pulse'), 500);
        
        // Show encouragement
        this.showEncouragement('🎉 太棒了！');
        
        // Sync to cloud - detailed word-level tracking
        await this.syncWordToCloud(word, true);
        
        // Auto advance after short delay
        setTimeout(() => this.next(), 800);
    },
    
    /**
     * Sync word learning to cloud database (detailed tracking)
     */
    async syncWordToCloud(word, isCorrect) {
        if (typeof DB !== 'undefined' && DB.getCurrentUser()) {
            try {
                // Use word ID or generate one from English word
                const wordId = word.id || word.english.toLowerCase().replace(/\s+/g, '_');
                
                if (isCorrect) {
                    await DB.markWordLearned(this.topicId, wordId);
                } else {
                    await DB.markWordNeedsReview(this.topicId, wordId);
                }
                
                console.log(`📊 Word "${word.english}" synced to cloud (correct: ${isCorrect})`);
                
                // Update header stats display after saving
                this.updateHeaderStats();
            } catch (error) {
                console.warn('⚠️ Could not sync word to cloud:', error.message);
            }
        }
    },
    
    /**
     * Update header stats display after learning
     */
    async updateHeaderStats() {
        try {
            const user = DB.getCurrentUser();
            if (!user) return;
            
            // Get latest stats from user object (already updated by recordWordLearning)
            const totalWordsLearned = user.get('totalWordsLearned') || 0;
            const currentStreak = user.get('currentStreak') || 0;
            
            // Update header displays
            const wordsDisplay = document.getElementById('words-learned-display');
            const streakDisplay = document.getElementById('streak-count');
            
            if (wordsDisplay) {
                wordsDisplay.textContent = totalWordsLearned;
                // Add animation
                wordsDisplay.classList.add('animate-pulse');
                setTimeout(() => wordsDisplay.classList.remove('animate-pulse'), 500);
            }
            
            if (streakDisplay) {
                streakDisplay.textContent = currentStreak;
            }
            
            console.log(`📈 Header updated: ${totalWordsLearned} words learned`);
        } catch (error) {
            console.warn('Could not update header stats:', error);
        }
    },
    
    /**
     * Mark current word as wrong (need more practice)
     */
    async markWrong() {
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
        
        // Sync to cloud - detailed word-level tracking
        await this.syncWordToCloud(word, false);
        
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
     * Show completion screen with options
     */
    async showCompletion() {
        // Get updated stats
        let totalMastered = 0;
        let totalWords = this.allWords.length;
        
        if (typeof DB !== 'undefined' && DB.getCurrentUser()) {
            try {
                const masteredIds = DB.getLearnedWordsForTopic(this.topicId);
                totalMastered = masteredIds.length;
            } catch (error) {
                console.warn('Could not get mastered count:', error);
            }
        }
        
        const wordsStudiedThisSession = this.words.length;
        const percent = Math.round((totalMastered / totalWords) * 100);
        
        // Create completion modal
        this.showCompletionModal({
            wordsStudied: wordsStudiedThisSession,
            totalMastered: totalMastered,
            totalWords: totalWords,
            percent: percent,
            mode: this.mode
        });
    },
    
    /**
     * Show completion modal with options
     */
    showCompletionModal(stats) {
        // Remove existing modal if any
        const existingModal = document.getElementById('flashcard-complete-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'flashcard-complete-modal';
        modal.className = 'modal-overlay';
        
        let message = '';
        let options = '';
        
        if (stats.totalMastered >= stats.totalWords) {
            // All words mastered!
            message = `
                <div class="completion-icon">🏆</div>
                <h2>太棒了！全部学完！</h2>
                <p>你已经掌握了这个主题的所有单词！</p>
                <div class="stats-row">
                    <span class="stat">✅ ${stats.totalWords}/${stats.totalWords}</span>
                    <span class="stat">📊 100%</span>
                </div>
            `;
            options = `
                <button class="btn btn-primary" onclick="flashcard.restartAll()">🔄 复习全部</button>
                <button class="btn btn-secondary" onclick="flashcard.closeModal()">📚 返回主题</button>
            `;
        } else if (this.mode === 'unlearned') {
            // Finished unlearned words
            message = `
                <div class="completion-icon">🎉</div>
                <h2>完成本轮学习！</h2>
                <p>本次学习了 ${stats.wordsStudied} 个单词</p>
                <div class="stats-row">
                    <span class="stat">✅ 已掌握: ${stats.totalMastered}/${stats.totalWords}</span>
                    <span class="stat">📊 ${stats.percent}%</span>
                </div>
            `;
            options = `
                <button class="btn btn-primary" onclick="flashcard.continueUnlearned()">📖 继续学习新词</button>
                <button class="btn btn-outline" onclick="flashcard.restartAll()">🔄 复习全部</button>
                <button class="btn btn-secondary" onclick="flashcard.closeModal()">📚 返回主题</button>
            `;
        } else {
            // Finished reviewing all
            message = `
                <div class="completion-icon">🎉</div>
                <h2>完成复习！</h2>
                <p>复习了 ${stats.wordsStudied} 个单词</p>
                <div class="stats-row">
                    <span class="stat">✅ 已掌握: ${stats.totalMastered}/${stats.totalWords}</span>
                    <span class="stat">📊 ${stats.percent}%</span>
                </div>
            `;
            options = `
                <button class="btn btn-primary" onclick="flashcard.restartAll()">🔄 再来一轮</button>
                <button class="btn btn-outline" onclick="flashcard.continueUnlearned()">📖 只学未掌握</button>
                <button class="btn btn-secondary" onclick="flashcard.closeModal()">📚 返回主题</button>
            `;
        }
        
        modal.innerHTML = `
            <div class="completion-container">
                ${message}
                <div class="completion-actions">
                    ${options}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    /**
     * Continue learning unlearned words
     */
    async continueUnlearned() {
        this.closeModal();
        await this.init(this.topicId, 'unlearned');
    },
    
    /**
     * Restart with all words
     */
    async restartAll() {
        this.closeModal();
        await this.init(this.topicId, 'all');
    },
    
    /**
     * Close completion modal and go back to topic
     */
    closeModal() {
        const modal = document.getElementById('flashcard-complete-modal');
        if (modal) modal.remove();
        app.goToTopic();
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


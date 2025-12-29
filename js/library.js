/**
 * PET Words Adventure - Word Library Module
 * Browse and search all vocabulary words
 */

const library = {
    words: [],
    filteredWords: [],
    topicId: null,
    currentFilter: 'all',
    currentWord: null,
    speechSynthesis: window.speechSynthesis,
    
    /**
     * Initialize library mode
     */
    async init(topicId) {
        this.topicId = topicId;
        this.words = await dataLoader.getWords(topicId);
        this.filteredWords = [...this.words];
        this.currentFilter = 'all';
        
        this.render();
        this.updateStats();
        this.resetFilters();
        
        // Clear search
        const searchInput = document.getElementById('library-search');
        if (searchInput) searchInput.value = '';
    },
    
    /**
     * Render word list
     */
    render() {
        const list = document.getElementById('library-list');
        if (!list) return;
        
        if (this.filteredWords.length === 0) {
            list.innerHTML = `
                <div class="no-results">
                    <span>😅</span>
                    <p>没有找到单词 No words found</p>
                </div>
            `;
            return;
        }
        
        const allProgress = progress.getAllProgress();
        
        list.innerHTML = this.filteredWords.map((word, index) => {
            const wordProgress = allProgress[word.id];
            const isLearned = wordProgress?.learned || false;
            
            return `
                <div class="word-card ${isLearned ? 'learned' : ''}" 
                     onclick="library.showDetail('${word.id}')"
                     style="animation-delay: ${Math.min(index * 0.02, 0.5)}s">
                    <span class="word-card-status">${isLearned ? '✅' : ''}</span>
                    <div class="word-card-english">${word.english}</div>
                    <div class="word-card-chinese">${word.chinese}</div>
                </div>
            `;
        }).join('');
    },
    
    /**
     * Update statistics display
     */
    updateStats() {
        const allProgress = progress.getAllProgress();
        let learnedCount = 0;
        
        this.words.forEach(word => {
            if (allProgress[word.id]?.learned) {
                learnedCount++;
            }
        });
        
        document.getElementById('library-learned').textContent = learnedCount;
        document.getElementById('library-total').textContent = this.words.length;
    },
    
    /**
     * Search words
     */
    search(query) {
        const lowerQuery = query.toLowerCase().trim();
        
        if (!lowerQuery) {
            this.filteredWords = this.applyFilter(this.words);
        } else {
            const searched = this.words.filter(word => 
                word.english.toLowerCase().includes(lowerQuery) ||
                word.chinese.includes(query)
            );
            this.filteredWords = this.applyFilter(searched);
        }
        
        this.render();
    },
    
    /**
     * Filter words by status
     */
    filter(filterType) {
        this.currentFilter = filterType;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Apply filter
        const searchInput = document.getElementById('library-search');
        const query = searchInput ? searchInput.value : '';
        this.search(query);
    },
    
    /**
     * Apply current filter to words
     */
    applyFilter(words) {
        const allProgress = progress.getAllProgress();
        
        switch (this.currentFilter) {
            case 'learned':
                return words.filter(w => allProgress[w.id]?.learned);
            case 'unlearned':
                return words.filter(w => !allProgress[w.id]?.learned);
            default:
                return words;
        }
    },
    
    /**
     * Reset filter buttons
     */
    resetFilters() {
        document.querySelectorAll('.filter-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i === 0);
        });
    },
    
    /**
     * Show word detail popup
     */
    showDetail(wordId) {
        const word = this.words.find(w => w.id === wordId);
        if (!word) return;
        
        this.currentWord = word;
        const allProgress = progress.getAllProgress();
        const isLearned = allProgress[wordId]?.learned || false;
        
        // Update popup content
        document.getElementById('detail-english').textContent = word.english;
        document.getElementById('detail-chinese').textContent = word.chinese;
        document.getElementById('detail-example-en').textContent = word.example || 'No example';
        document.getElementById('detail-example-cn').textContent = word.exampleChinese || '';
        
        // Update status
        const statusEl = document.getElementById('detail-status');
        statusEl.innerHTML = isLearned 
            ? '<span class="status-learned">✅ 已学会</span>'
            : '<span class="status-unlearned">📖 未学习</span>';
        
        // Update button
        const btn = document.getElementById('mark-learned-btn');
        if (isLearned) {
            btn.textContent = '标记为未学习';
            btn.classList.add('unmark');
        } else {
            btn.textContent = '标记为已学会 ✅';
            btn.classList.remove('unmark');
        }
        
        // Show popup
        document.getElementById('word-detail-popup').classList.remove('hidden');
    },
    
    /**
     * Close word detail popup
     */
    closeDetail() {
        document.getElementById('word-detail-popup').classList.add('hidden');
        this.currentWord = null;
    },
    
    /**
     * Toggle learned status
     */
    toggleLearned() {
        if (!this.currentWord) return;
        
        const allProgress = progress.getAllProgress();
        const isLearned = allProgress[this.currentWord.id]?.learned || false;
        
        if (isLearned) {
            // Unmark as learned
            const wordProgress = progress.getWordProgress(this.currentWord.id);
            wordProgress.learned = false;
            allProgress[this.currentWord.id] = wordProgress;
            progress.saveAllProgress(allProgress);
        } else {
            // Mark as learned
            progress.markAsLearned(this.currentWord.id);
        }
        
        // Refresh display
        this.showDetail(this.currentWord.id);
        this.render();
        this.updateStats();
    },
    
    /**
     * Get best voice for speech
     */
    getBestVoice() {
        // Reuse flashcard's voice selection if available
        if (typeof flashcard !== 'undefined' && flashcard.getBestVoice) {
            return flashcard.getBestVoice();
        }
        
        const voices = this.speechSynthesis.getVoices();
        return voices.find(v => v.lang.startsWith('en')) || voices[0];
    },
    
    /**
     * Speak current word
     */
    speak() {
        if (!this.currentWord) return;
        
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(this.currentWord.english);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        
        const voice = this.getBestVoice();
        if (voice) utterance.voice = voice;
        
        this.speechSynthesis.speak(utterance);
    },
    
    /**
     * Speak current word slowly
     */
    speakSlow() {
        if (!this.currentWord) return;
        
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(this.currentWord.english);
        utterance.lang = 'en-US';
        utterance.rate = 0.6;
        utterance.pitch = 1.0;
        
        const voice = this.getBestVoice();
        if (voice) utterance.voice = voice;
        
        this.speechSynthesis.speak(utterance);
    },
    
    /**
     * Speak example sentence
     */
    speakExample() {
        if (!this.currentWord || !this.currentWord.example) return;
        
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(this.currentWord.example);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        
        const voice = this.getBestVoice();
        if (voice) utterance.voice = voice;
        
        this.speechSynthesis.speak(utterance);
    },
    
    /**
     * Keyboard shortcuts
     */
    handleKeypress(e) {
        // Close popup on Escape
        if (e.key === 'Escape') {
            this.closeDetail();
        }
        
        // If popup is open
        if (this.currentWord) {
            switch(e.key) {
                case 's':
                    this.speak();
                    break;
                case 'S':
                    this.speakSlow();
                    break;
                case 'e':
                case 'E':
                    this.speakExample();
                    break;
                case 'Enter':
                case ' ':
                    this.toggleLearned();
                    break;
            }
        }
    }
};

// Click outside popup to close
document.addEventListener('click', (e) => {
    const popup = document.getElementById('word-detail-popup');
    if (e.target === popup) {
        library.closeDetail();
    }
});

// Keyboard navigation for library
document.addEventListener('keydown', (e) => {
    const libraryScreen = document.getElementById('library-screen');
    if (libraryScreen && libraryScreen.classList.contains('active')) {
        library.handleKeypress(e);
    }
});


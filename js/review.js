/**
 * PET Words Adventure - Review Module
 * Ebbinghaus Forgetting Curve based spaced repetition
 */

const review = {
    words: [],           // Words due for review
    currentIndex: 0,
    isFlipped: false,
    sessionStats: {
        reviewed: 0,
        correct: 0,
        wrong: 0
    },
    speechSynthesis: window.speechSynthesis,
    
    /**
     * Initialize review mode - load words due for review
     */
    async init() {
        this.currentIndex = 0;
        this.isFlipped = false;
        this.sessionStats = { reviewed: 0, correct: 0, wrong: 0 };
        
        // Get words due for review from cloud
        await this.loadDueWords();
        
        if (this.words.length === 0) {
            this.showNoReviewsMessage();
            return false;
        }
        
        this.render();
        this.updateProgress();
        return true;
    },
    
    /**
     * Load words that are due for review
     */
    async loadDueWords() {
        this.words = [];
        
        if (typeof DB === 'undefined' || !DB.getCurrentUser()) {
            console.warn('No user logged in');
            return;
        }
        
        try {
            // Fetch fresh data from cloud
            await DB.fetchFreshUserData();
            
            // Get all words due for review
            const dueWords = DB.getWordsDueForReview();
            
            if (dueWords.length === 0) {
                console.log('📚 No words due for review');
                return;
            }
            
            // Load word details from JSON files
            const wordsByTopic = {};
            for (const dueWord of dueWords) {
                if (!wordsByTopic[dueWord.topicId]) {
                    wordsByTopic[dueWord.topicId] = [];
                }
                wordsByTopic[dueWord.topicId].push(dueWord);
            }
            
            // Load each topic's words and match
            for (const [topicId, topicDueWords] of Object.entries(wordsByTopic)) {
                const topicWords = await dataLoader.getWords(topicId);
                
                for (const dueWord of topicDueWords) {
                    const wordDetail = topicWords.find(w => 
                        w.id === dueWord.wordId || 
                        w.english.toLowerCase().replace(/\s+/g, '_') === dueWord.wordId
                    );
                    
                    if (wordDetail) {
                        this.words.push({
                            ...wordDetail,
                            topicId: topicId,
                            masteryLevel: dueWord.masteryLevel,
                            lastReviewed: dueWord.lastReviewed,
                            daysSinceReview: dueWord.daysSinceReview,
                            reviewCount: dueWord.reviewCount
                        });
                    }
                }
            }
            
            // Sort by priority: lower mastery first, then more days overdue
            this.words.sort((a, b) => {
                if (a.masteryLevel !== b.masteryLevel) {
                    return a.masteryLevel - b.masteryLevel;
                }
                return (b.daysSinceReview || 0) - (a.daysSinceReview || 0);
            });
            
            console.log(`📚 Loaded ${this.words.length} words for review`);
        } catch (error) {
            console.error('Error loading review words:', error);
        }
    },
    
    /**
     * Show message when no words need review
     */
    showNoReviewsMessage() {
        const modal = document.createElement('div');
        modal.id = 'review-complete-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="completion-container">
                <div class="completion-icon">🎉</div>
                <h2>太棒了！</h2>
                <p>今天没有需要复习的单词！</p>
                <p class="subtitle">继续学习新单词，明天再来复习吧！</p>
                <div class="completion-actions">
                    <button class="btn btn-primary" onclick="review.closeModal(); app.goHome();">
                        📚 返回首页
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    /**
     * Render current review card
     */
    render() {
        if (this.words.length === 0) return;
        
        const word = this.words[this.currentIndex];
        const card = document.getElementById('review-card');
        
        // Reset flip state
        if (this.isFlipped) {
            card.classList.remove('flipped');
            this.isFlipped = false;
        }
        
        // Update content
        document.getElementById('review-english').textContent = word.english;
        document.getElementById('review-chinese').textContent = word.chinese;
        document.getElementById('review-english-back').textContent = word.english;
        
        // Update example
        const exampleEl = document.getElementById('review-example');
        if (exampleEl && word.example) {
            exampleEl.textContent = word.example;
        }
        
        // Show mastery indicator
        this.updateMasteryIndicator(word.masteryLevel);
        
        // Show days since last review
        const daysEl = document.getElementById('review-days-ago');
        if (daysEl) {
            const days = word.daysSinceReview || 0;
            daysEl.textContent = days === 0 ? '今天' : `${days} 天前`;
        }
        
        // Animation
        card.classList.add('animate-popIn');
        setTimeout(() => card.classList.remove('animate-popIn'), 400);
    },
    
    /**
     * Update mastery level indicator (6 levels for Ebbinghaus curve)
     */
    updateMasteryIndicator(level) {
        const indicator = document.getElementById('review-mastery');
        if (!indicator) return;
        
        // 6 levels: NEW, LEARNING, FAMILIAR, CONFIDENT, MASTERED, PERMANENT
        const labels = [
            '🆕 新词',       // 0 - NEW
            '📖 学习中',     // 1 - LEARNING
            '🌱 熟悉',       // 2 - FAMILIAR
            '💪 自信',       // 3 - CONFIDENT
            '⭐ 掌握',       // 4 - MASTERED
            '👑 永久记忆'    // 5 - PERMANENT
        ];
        const colors = [
            '#e74c3c',      // Red - NEW
            '#f39c12',      // Orange - LEARNING
            '#3498db',      // Blue - FAMILIAR
            '#9b59b6',      // Purple - CONFIDENT
            '#27ae60',      // Green - MASTERED
            '#f1c40f'       // Gold - PERMANENT
        ];
        
        indicator.textContent = labels[level] || labels[0];
        indicator.style.background = colors[level] || colors[0];
    },
    
    /**
     * Flip the card
     */
    flip() {
        const card = document.getElementById('review-card');
        this.isFlipped = !this.isFlipped;
        card.classList.toggle('flipped', this.isFlipped);
    },
    
    /**
     * Speak the current word
     */
    speak() {
        const word = this.words[this.currentIndex];
        if (!word) return;
        
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(word.english);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        
        // Use flashcard's voice selection if available
        if (typeof flashcard !== 'undefined' && flashcard.getBestVoice) {
            const voice = flashcard.getBestVoice();
            if (voice) utterance.voice = voice;
        }
        
        this.speechSynthesis.speak(utterance);
    },
    
    /**
     * Speak slowly
     */
    speakSlow() {
        const word = this.words[this.currentIndex];
        if (!word) return;
        
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(word.english);
        utterance.lang = 'en-US';
        utterance.rate = 0.6;
        
        if (typeof flashcard !== 'undefined' && flashcard.getBestVoice) {
            const voice = flashcard.getBestVoice();
            if (voice) utterance.voice = voice;
        }
        
        this.speechSynthesis.speak(utterance);
    },
    
    /**
     * Mark as remembered (correct review)
     */
    async markRemembered() {
        const word = this.words[this.currentIndex];
        if (!word) return;
        
        this.sessionStats.reviewed++;
        this.sessionStats.correct++;
        
        // Update cloud with correct review
        try {
            await DB.recordWordLearning(word.topicId, word.id || word.english.toLowerCase().replace(/\s+/g, '_'), true);
            console.log(`✅ Review correct: ${word.english}`);
        } catch (error) {
            console.warn('Could not save review:', error);
        }
        
        // Show feedback
        this.showFeedback('🎉 记住了！', 'correct');
        
        // Next card
        setTimeout(() => this.next(), 800);
    },
    
    /**
     * Mark as forgotten (wrong review)
     */
    async markForgotten() {
        const word = this.words[this.currentIndex];
        if (!word) return;
        
        this.sessionStats.reviewed++;
        this.sessionStats.wrong++;
        
        // Update cloud with wrong review
        try {
            await DB.recordWordLearning(word.topicId, word.id || word.english.toLowerCase().replace(/\s+/g, '_'), false);
            console.log(`❌ Review forgot: ${word.english}`);
        } catch (error) {
            console.warn('Could not save review:', error);
        }
        
        // Add to end of queue for another review
        this.words.push(word);
        
        // Show feedback
        this.showFeedback('💪 再记一次！', 'wrong');
        
        // Next card
        setTimeout(() => this.next(), 800);
    },
    
    /**
     * Show feedback message
     */
    showFeedback(message, type) {
        const msg = document.createElement('div');
        msg.className = `review-feedback ${type}`;
        msg.textContent = message;
        msg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 2rem;
            font-weight: bold;
            color: ${type === 'correct' ? '#27ae60' : '#e74c3c'};
            z-index: 1000;
            animation: fadeInUp 0.3s ease, fadeOut 0.3s ease 0.5s forwards;
            pointer-events: none;
        `;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 800);
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
     * Update progress display
     */
    updateProgress() {
        const counter = document.getElementById('review-counter');
        const progressFill = document.getElementById('review-progress-fill');
        
        if (counter) {
            counter.textContent = `${this.currentIndex + 1} / ${this.words.length}`;
        }
        
        if (progressFill) {
            const percent = ((this.currentIndex + 1) / this.words.length) * 100;
            progressFill.style.width = `${percent}%`;
        }
        
        // Update stats
        const statsEl = document.getElementById('review-session-stats');
        if (statsEl) {
            statsEl.textContent = `✅ ${this.sessionStats.correct} | ❌ ${this.sessionStats.wrong}`;
        }
    },
    
    /**
     * Show completion screen
     */
    showCompletion() {
        const accuracy = this.sessionStats.reviewed > 0 
            ? Math.round((this.sessionStats.correct / this.sessionStats.reviewed) * 100) 
            : 0;
        
        // Remove existing modal
        const existingModal = document.getElementById('review-complete-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'review-complete-modal';
        modal.className = 'modal-overlay';
        
        let message = '';
        let emoji = '🎉';
        
        if (accuracy >= 90) {
            message = '太棒了！记忆力超强！';
            emoji = '🏆';
        } else if (accuracy >= 70) {
            message = '做得很好！继续加油！';
            emoji = '👍';
        } else if (accuracy >= 50) {
            message = '不错！多复习几次就记住了！';
            emoji = '💪';
        } else {
            message = '别灰心！明天再来复习！';
            emoji = '📚';
        }
        
        modal.innerHTML = `
            <div class="completion-container">
                <div class="completion-icon">${emoji}</div>
                <h2>复习完成！</h2>
                <p>${message}</p>
                
                <div class="review-stats-grid">
                    <div class="review-stat-card">
                        <div class="stat-value">${this.sessionStats.reviewed}</div>
                        <div class="stat-label">复习单词</div>
                    </div>
                    <div class="review-stat-card correct">
                        <div class="stat-value">${this.sessionStats.correct}</div>
                        <div class="stat-label">记住了</div>
                    </div>
                    <div class="review-stat-card wrong">
                        <div class="stat-value">${this.sessionStats.wrong}</div>
                        <div class="stat-label">需再练</div>
                    </div>
                    <div class="review-stat-card">
                        <div class="stat-value">${accuracy}%</div>
                        <div class="stat-label">正确率</div>
                    </div>
                </div>
                
                <div class="ebbinghaus-tip">
                    <span class="tip-icon">💡</span>
                    <p>根据艾宾浩斯遗忘曲线，记住的单词将在 <strong>4-7天后</strong> 再次出现复习，帮助你长期记忆！</p>
                </div>
                
                <div class="completion-actions">
                    <button class="btn btn-primary" onclick="review.closeModal(); app.goHome();">
                        📚 返回首页
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Update header stats
        if (typeof flashcard !== 'undefined' && flashcard.updateHeaderStats) {
            flashcard.updateHeaderStats();
        }
    },
    
    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('review-complete-modal');
        if (modal) modal.remove();
    },
    
    /**
     * Get count of words due for review (for badge display)
     */
    async getDueCount() {
        if (typeof DB === 'undefined' || !DB.getCurrentUser()) {
            return 0;
        }
        
        try {
            const dueWords = DB.getWordsDueForReview();
            return dueWords.length;
        } catch (error) {
            console.warn('Could not get due count:', error);
            return 0;
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
                this.markRemembered();
                break;
            case 'ArrowDown':
                this.markForgotten();
                break;
            case 's':
                this.speak();
                break;
            case 'S':
                this.speakSlow();
                break;
        }
    }
};

// Keyboard listener for review screen
document.addEventListener('keydown', (e) => {
    const reviewScreen = document.getElementById('review-screen');
    if (reviewScreen && reviewScreen.classList.contains('active')) {
        review.handleKeypress(e);
    }
});

// Export
window.review = review;


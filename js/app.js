/**
 * PET Words Adventure - Main Application Controller
 * Manages screens, navigation, and overall app state
 */

const app = {
    currentTopic: null,
    currentScreen: 'home',
    
    /**
     * Initialize the application
     */
    async init() {
        console.log('🚀 PET Words Adventure initializing...');
        
        // Load topics index
        await dataLoader.init();
        
        // Render topics on home screen
        this.renderTopics();
        
        // Initialize progress display
        progress.updateDailyProgress();
        
        // Sync progress from cloud if logged in
        await this.syncFromCloud();
        
        // Update review badge
        await this.updateReviewBadge();
        
        console.log('✅ App initialized successfully!');
    },
    
    /**
     * Update the review badge showing words due for review
     * Always shows the card with appropriate message
     */
    async updateReviewBadge() {
        const reviewSection = document.getElementById('review-card-section');
        const reviewMessage = document.getElementById('review-message');
        const reviewIcon = document.getElementById('review-icon');
        const reviewTipText = document.getElementById('review-tip-text');
        const reviewArrow = document.getElementById('review-arrow');
        const reviewCard = reviewSection?.querySelector('.review-reminder-card');
        
        if (typeof DB === 'undefined' || !DB.getCurrentUser()) {
            if (reviewSection) reviewSection.style.display = 'none';
            return;
        }
        
        try {
            const dueWords = DB.getWordsDueForReview();
            const dueCount = dueWords ? dueWords.length : 0;
            
            // Always show the card
            if (reviewSection) reviewSection.style.display = 'block';
            
            if (dueCount > 0) {
                // Has words to review - urgent style
                reviewMessage.innerHTML = `你有 <span class="review-count">${dueCount}</span> 个单词需要复习`;
                reviewIcon.textContent = '🧠';
                reviewTipText.textContent = '及时复习，记得更牢！';
                reviewArrow.textContent = '→';
                reviewCard.classList.remove('review-complete');
                reviewCard.classList.add('review-pending');
                console.log(`🧠 ${dueCount} words due for review`);
            } else {
                // No words to review - check if user has any learned words
                const user = DB.getCurrentUser();
                const wordLearning = user.get('wordLearning') || {};
                const learnedCount = Object.keys(wordLearning).length;
                
                if (learnedCount > 0) {
                    // Find next review date
                    let nextReviewDate = null;
                    for (const data of Object.values(wordLearning)) {
                        if (data.nextReview) {
                            if (!nextReviewDate || data.nextReview < nextReviewDate) {
                                nextReviewDate = data.nextReview;
                            }
                        }
                    }
                    
                    // Format next review date
                    let nextReviewText = '';
                    if (nextReviewDate) {
                        const today = new Date().toISOString().split('T')[0];
                        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                        
                        if (nextReviewDate === today) {
                            nextReviewText = '今天';
                        } else if (nextReviewDate === tomorrow) {
                            nextReviewText = '明天';
                        } else {
                            // Format as "1月2日"
                            const date = new Date(nextReviewDate);
                            nextReviewText = `${date.getMonth() + 1}月${date.getDate()}日`;
                        }
                    }
                    
                    reviewMessage.innerHTML = `✅ 太棒了！今天不用复习`;
                    reviewIcon.textContent = '🎉';
                    reviewTipText.textContent = nextReviewText ? `下次复习: ${nextReviewText}` : '继续学习新单词吧！';
                    reviewArrow.textContent = '✓';
                    reviewCard.classList.remove('review-pending');
                    reviewCard.classList.add('review-complete');
                } else {
                    // No words learned yet
                    reviewMessage.innerHTML = `开始学习，积累复习单词！`;
                    reviewIcon.textContent = '📚';
                    reviewTipText.textContent = '学习后会自动安排复习计划';
                    reviewArrow.textContent = '→';
                    reviewCard.classList.remove('review-pending', 'review-complete');
                }
            }
        } catch (error) {
            console.warn('Could not update review badge:', error);
        }
    },
    
    /**
     * Start review mode (Ebbinghaus)
     */
    async startReview() {
        console.log('🧠 Starting Ebbinghaus review mode...');
        
        const hasWords = await review.init();
        
        if (hasWords) {
            this.showScreen('review');
        }
        // If no words, review.init() shows the "no reviews" message
    },
    
    /**
     * Sync progress from cloud database
     */
    async syncFromCloud() {
        if (typeof DB === 'undefined' || !DB.getCurrentUser()) return;
        
        try {
            const cloudProgress = await DB.loadProgress();
            if (cloudProgress) {
                // Update header displays
                const streakCount = document.getElementById('streak-count');
                const wordsDisplay = document.getElementById('words-learned-display');
                
                if (streakCount) streakCount.textContent = cloudProgress.currentStreak || 0;
                if (wordsDisplay) wordsDisplay.textContent = cloudProgress.totalWordsLearned || 0;
                
                console.log('☁️ Synced from cloud:', cloudProgress);
            }
        } catch (error) {
            console.warn('Could not sync from cloud:', error);
        }
    },
    
    /**
     * Record learning progress to cloud
     */
    async recordProgress(topicId, wordsLearned) {
        if (typeof DB === 'undefined' || !DB.getCurrentUser()) return;
        
        try {
            await DB.recordWordsLearned(topicId, wordsLearned);
            await this.syncFromCloud();
        } catch (error) {
            console.warn('Could not record progress:', error);
        }
    },
    
    /**
     * Record quiz result to cloud
     */
    async recordQuiz(topicId, score, total) {
        if (typeof DB === 'undefined' || !DB.getCurrentUser()) return;
        
        try {
            await DB.recordQuizResult(topicId, score, total);
            await this.syncFromCloud();
        } catch (error) {
            console.warn('Could not record quiz:', error);
        }
    },
    
    /**
     * Render topics grid on home screen
     */
    renderTopics() {
        const topics = dataLoader.getTopics();
        const grid = document.getElementById('topics-grid');
        
        if (topics.length === 0) {
            grid.innerHTML = '<p>No topics available. Please add word data.</p>';
            return;
        }
        
        grid.innerHTML = topics.map((topic, index) => `
            <div class="topic-card" style="animation-delay: ${index * 0.1}s" onclick="app.selectTopic('${topic.id}')">
                <span class="topic-card-icon">${topic.icon}</span>
                <h4 class="topic-card-title">${topic.name}</h4>
                <p class="topic-card-subtitle">${topic.nameChinese}</p>
                <div class="topic-card-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-${topic.id}" style="width: 0%"></div>
                    </div>
                    <span class="progress-text" id="progress-text-${topic.id}">0/${topic.wordCount}</span>
                </div>
            </div>
        `).join('');
        
        // Update progress for each topic
        this.updateTopicsProgress();
    },
    
    /**
     * Update progress display for all topics (from cloud + local)
     */
    async updateTopicsProgress() {
        const topics = dataLoader.getTopics();
        
        // Try to get cloud progress first
        let cloudTopicProgress = {};
        if (typeof DB !== 'undefined' && DB.getCurrentUser()) {
            try {
                const cloudData = await DB.loadProgress();
                if (cloudData && cloudData.topicProgress) {
                    cloudTopicProgress = cloudData.topicProgress;
                }
            } catch (error) {
                console.warn('Could not load cloud progress:', error);
            }
        }
        
        for (const topic of topics) {
            const progressFill = document.getElementById(`progress-${topic.id}`);
            const progressText = document.getElementById(`progress-text-${topic.id}`);
            
            if (progressFill && progressText) {
                // Check cloud progress first
                const cloudProgress = cloudTopicProgress[topic.id];
                let learned = 0;
                let total = topic.wordCount;
                
                if (cloudProgress) {
                    // Use cloud data (new detailed format)
                    if (typeof cloudProgress === 'object') {
                        learned = cloudProgress.wordsLearned || 0;
                    } else {
                        // Old format (just a number)
                        learned = cloudProgress;
                    }
                } else {
                    // Fallback to local storage
                    const words = await dataLoader.getWords(topic.id);
                    const localProgress = progress.getTopicProgress(topic.id, words);
                    learned = localProgress.learned;
                    total = localProgress.total;
                }
                
                const percent = total > 0 ? Math.round((learned / total) * 100) : 0;
                progressFill.style.width = `${percent}%`;
                progressText.textContent = `${learned}/${total}`;
            }
        }
    },
    
    /**
     * Select a topic
     */
    async selectTopic(topicId) {
        this.currentTopic = topicId;
        
        // Load topic data
        const topicData = await dataLoader.loadTopic(topicId);
        if (!topicData) {
            alert('Error loading topic data');
            return;
        }
        
        const topic = topicData.topic;
        const words = topicData.words;
        
        // Get progress from cloud first (fetch fresh data), fallback to local
        let learned = 0;
        let total = words.length;
        let wordsStudied = 0;
        let quizAvg = 0;
        let wordsDue = 0;
        
        if (typeof DB !== 'undefined' && DB.getCurrentUser()) {
            try {
                // Use async version to fetch fresh data from cloud
                const cloudProgress = await DB.getTopicProgressAsync(topicId);
                if (cloudProgress) {
                    learned = cloudProgress.wordsLearned || 0;
                    wordsStudied = cloudProgress.wordsStudied || 0;
                    quizAvg = cloudProgress.averageQuizScore || 0;
                }
                // Get words due for review (uses cached data since we just fetched)
                const dueWords = DB.getWordsDueForReview(topicId);
                wordsDue = dueWords ? dueWords.length : 0;
            } catch (error) {
                console.warn('Could not load cloud progress:', error);
            }
        }
        
        // Fallback to local storage if no cloud data
        if (learned === 0 && wordsStudied === 0) {
            const localProgress = progress.getTopicProgress(topicId, words);
            learned = localProgress.learned;
        }
        
        const percent = total > 0 ? Math.round((learned / total) * 100) : 0;
        
        // Update topic screen
        document.getElementById('topic-icon').textContent = topic.icon;
        document.getElementById('topic-title').textContent = topic.name;
        document.getElementById('topic-subtitle').textContent = topic.nameChinese;
        document.getElementById('topic-progress-fill').style.width = `${percent}%`;
        
        // Show detailed progress text
        let progressText = `${learned}/${total} 已掌握`;
        if (wordsStudied > 0 && wordsStudied !== learned) {
            progressText = `✅ ${learned} 掌握 · 📚 ${wordsStudied} 学过 / ${total} 词`;
        }
        if (wordsDue > 0) {
            progressText += ` · 🔄 ${wordsDue} 待复习`;
        }
        document.getElementById('topic-progress-text').textContent = progressText;
        
        // Navigate to topic screen
        this.showScreen('topic');
    },
    
    /**
     * Start flashcard mode
     */
    async startFlashcards() {
        if (!this.currentTopic) return;
        
        await flashcard.init(this.currentTopic);
        this.showScreen('flashcard');
    },
    
    /**
     * Start memory stories mode
     */
    async startStories() {
        if (!this.currentTopic) return;
        
        await stories.init(this.currentTopic);
        this.showScreen('story');
    },
    
    /**
     * Start quiz mode
     */
    async startQuiz() {
        if (!this.currentTopic) return;
        
        await quiz.init(this.currentTopic);
        this.showScreen('quiz');
    },
    
    /**
     * Start word library mode
     */
    async startLibrary() {
        if (!this.currentTopic) return;
        
        await library.init(this.currentTopic);
        this.showScreen('library');
    },
    
    /**
     * Navigate to home screen
     */
    goHome() {
        this.currentTopic = null;
        this.showScreen('home');
        this.updateTopicsProgress();
        progress.updateDailyProgress();
        this.updateReviewBadge();
    },
    
    /**
     * Navigate back to topic screen
     */
    goToTopic() {
        this.showScreen('topic');
        
        // Update topic progress
        if (this.currentTopic) {
            this.selectTopic(this.currentTopic);
        }
    },
    
    /**
     * Show a specific screen
     */
    showScreen(screenName) {
        this.currentScreen = screenName;
        
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    },
    
    /**
     * Show a specific view (alias for showScreen, used by Auth)
     */
    showView(viewName) {
        this.showScreen(viewName);
    },
    
    /**
     * Handle global keyboard shortcuts
     */
    handleKeypress(e) {
        // Escape to go back
        if (e.key === 'Escape') {
            switch (this.currentScreen) {
                case 'flashcard':
                case 'story':
                case 'quiz':
                    this.goToTopic();
                    break;
                case 'topic':
                    this.goHome();
                    break;
            }
        }
    }
};

// Global keyboard handler
document.addEventListener('keydown', (e) => {
    app.handleKeypress(e);
});

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});


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
        
        console.log('✅ App initialized successfully!');
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
     * Update progress display for all topics
     */
    async updateTopicsProgress() {
        const topics = dataLoader.getTopics();
        
        for (const topic of topics) {
            const words = await dataLoader.getWords(topic.id);
            const topicProgress = progress.getTopicProgress(topic.id, words);
            
            const progressFill = document.getElementById(`progress-${topic.id}`);
            const progressText = document.getElementById(`progress-text-${topic.id}`);
            
            if (progressFill && progressText) {
                progressFill.style.width = `${topicProgress.percent}%`;
                progressText.textContent = `${topicProgress.learned}/${topicProgress.total}`;
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
        const topicProgress = progress.getTopicProgress(topicId, words);
        
        // Update topic screen
        document.getElementById('topic-icon').textContent = topic.icon;
        document.getElementById('topic-title').textContent = topic.name;
        document.getElementById('topic-subtitle').textContent = topic.nameChinese;
        document.getElementById('topic-progress-fill').style.width = `${topicProgress.percent}%`;
        document.getElementById('topic-progress-text').textContent = 
            `${topicProgress.learned}/${topicProgress.total} 已学会`;
        
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


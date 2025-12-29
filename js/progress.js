/**
 * PET Words Adventure - Progress Manager
 * Handles localStorage for tracking learning progress
 */

const progress = {
    STORAGE_KEY: 'pet_words_progress',
    STATS_KEY: 'pet_words_stats',
    
    // Default stats structure
    defaultStats: {
        streak: 0,
        lastStudyDate: null,
        totalStars: 0,
        totalWordsLearned: 0,
        dailyGoal: 10,
        todayLearned: 0,
        todayDate: null
    },
    
    /**
     * Initialize progress system
     */
    init() {
        this.migrateOldData();
        this.checkStreak();
        this.updateDailyProgress();
    },
    
    /**
     * Get all progress data
     */
    getAllProgress() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Error reading progress:', e);
            return {};
        }
    },
    
    /**
     * Save all progress data
     */
    saveAllProgress(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving progress:', e);
        }
    },
    
    /**
     * Get progress for a specific word
     */
    getWordProgress(wordId) {
        const allProgress = this.getAllProgress();
        return allProgress[wordId] || {
            learned: false,
            correctCount: 0,
            wrongCount: 0,
            lastReviewed: null,
            memoryStrength: 0
        };
    },
    
    /**
     * Update progress for a word
     */
    updateWordProgress(wordId, isCorrect) {
        const allProgress = this.getAllProgress();
        const wordProgress = this.getWordProgress(wordId);
        
        if (isCorrect) {
            wordProgress.correctCount++;
            wordProgress.memoryStrength = Math.min(5, wordProgress.memoryStrength + 1);
            
            // Mark as learned after 3 correct answers
            if (wordProgress.correctCount >= 3 && !wordProgress.learned) {
                wordProgress.learned = true;
                this.incrementTodayLearned();
                this.addStars(1);
            }
        } else {
            wordProgress.wrongCount++;
            wordProgress.memoryStrength = Math.max(0, wordProgress.memoryStrength - 1);
        }
        
        wordProgress.lastReviewed = new Date().toISOString();
        allProgress[wordId] = wordProgress;
        this.saveAllProgress(allProgress);
        
        return wordProgress;
    },
    
    /**
     * Mark a word as learned directly
     */
    markAsLearned(wordId) {
        const allProgress = this.getAllProgress();
        const wordProgress = this.getWordProgress(wordId);
        
        if (!wordProgress.learned) {
            wordProgress.learned = true;
            wordProgress.correctCount = Math.max(3, wordProgress.correctCount);
            wordProgress.memoryStrength = Math.max(3, wordProgress.memoryStrength);
            wordProgress.lastReviewed = new Date().toISOString();
            
            allProgress[wordId] = wordProgress;
            this.saveAllProgress(allProgress);
            
            this.incrementTodayLearned();
            this.addStars(1);
        }
        
        return wordProgress;
    },
    
    /**
     * Get stats
     */
    getStats() {
        try {
            const data = localStorage.getItem(this.STATS_KEY);
            return data ? { ...this.defaultStats, ...JSON.parse(data) } : { ...this.defaultStats };
        } catch (e) {
            console.error('Error reading stats:', e);
            return { ...this.defaultStats };
        }
    },
    
    /**
     * Save stats
     */
    saveStats(stats) {
        try {
            localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
        } catch (e) {
            console.error('Error saving stats:', e);
        }
    },
    
    /**
     * Check and update streak
     */
    checkStreak() {
        const stats = this.getStats();
        const today = new Date().toDateString();
        const lastStudy = stats.lastStudyDate;
        
        if (lastStudy) {
            const lastDate = new Date(lastStudy);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastDate.toDateString() === yesterday.toDateString()) {
                // Studied yesterday, streak continues
            } else if (lastDate.toDateString() !== today) {
                // Missed a day, reset streak
                stats.streak = 0;
            }
        }
        
        this.saveStats(stats);
        return stats.streak;
    },
    
    /**
     * Increment streak (call when studying)
     */
    incrementStreak() {
        const stats = this.getStats();
        const today = new Date().toDateString();
        
        if (stats.lastStudyDate !== today) {
            stats.streak++;
            stats.lastStudyDate = today;
            this.saveStats(stats);
        }
        
        return stats.streak;
    },
    
    /**
     * Add stars
     */
    addStars(count) {
        const stats = this.getStats();
        stats.totalStars += count;
        this.saveStats(stats);
        this.updateStarsDisplay();
        return stats.totalStars;
    },
    
    /**
     * Update today's learned count
     */
    incrementTodayLearned() {
        const stats = this.getStats();
        const today = new Date().toDateString();
        
        if (stats.todayDate !== today) {
            stats.todayDate = today;
            stats.todayLearned = 0;
        }
        
        stats.todayLearned++;
        stats.totalWordsLearned++;
        this.saveStats(stats);
        this.updateDailyProgress();
        
        return stats.todayLearned;
    },
    
    /**
     * Reset daily progress (for new day)
     */
    updateDailyProgress() {
        const stats = this.getStats();
        const today = new Date().toDateString();
        
        if (stats.todayDate !== today) {
            stats.todayDate = today;
            stats.todayLearned = 0;
            this.saveStats(stats);
        }
        
        // Update UI
        const progressBar = document.getElementById('daily-progress-bar');
        const progressText = document.getElementById('daily-progress-text');
        
        if (progressBar && progressText) {
            const percent = Math.min(100, (stats.todayLearned / stats.dailyGoal) * 100);
            progressBar.style.width = `${percent}%`;
            progressText.textContent = `今日进度: ${stats.todayLearned}/${stats.dailyGoal} 词`;
        }
        
        this.updateStreakDisplay();
        this.updateStarsDisplay();
    },
    
    /**
     * Update streak display
     */
    updateStreakDisplay() {
        const stats = this.getStats();
        const streakEl = document.getElementById('streak-count');
        if (streakEl) {
            streakEl.textContent = stats.streak;
        }
    },
    
    /**
     * Update stars display
     */
    updateStarsDisplay() {
        const stats = this.getStats();
        const starsEl = document.getElementById('stars-count');
        if (starsEl) {
            starsEl.textContent = stats.totalStars;
        }
    },
    
    /**
     * Get topic progress (how many words learned in a topic)
     */
    getTopicProgress(topicId, words) {
        const allProgress = this.getAllProgress();
        let learned = 0;
        
        words.forEach(word => {
            if (allProgress[word.id]?.learned) {
                learned++;
            }
        });
        
        return {
            learned,
            total: words.length,
            percent: Math.round((learned / words.length) * 100)
        };
    },
    
    /**
     * Get words that need review (low memory strength)
     */
    getWordsToReview(words, limit = 10) {
        const allProgress = this.getAllProgress();
        
        return words
            .map(word => ({
                ...word,
                progress: allProgress[word.id] || { memoryStrength: 0, correctCount: 0 }
            }))
            .filter(w => w.progress.memoryStrength < 4)
            .sort((a, b) => a.progress.memoryStrength - b.progress.memoryStrength)
            .slice(0, limit);
    },
    
    /**
     * Export progress as JSON (for backup)
     */
    exportProgress() {
        const data = {
            progress: this.getAllProgress(),
            stats: this.getStats(),
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `pet_words_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    },
    
    /**
     * Import progress from JSON (restore backup)
     */
    importProgress(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (data.progress) {
                this.saveAllProgress(data.progress);
            }
            if (data.stats) {
                this.saveStats(data.stats);
            }
            
            this.updateDailyProgress();
            return true;
        } catch (e) {
            console.error('Error importing progress:', e);
            return false;
        }
    },
    
    /**
     * Migrate old data format (for future updates)
     */
    migrateOldData() {
        // Placeholder for future migrations
    },
    
    /**
     * Clear all progress (reset)
     */
    clearAll() {
        if (confirm('确定要清除所有学习进度吗？这将无法恢复！')) {
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.STATS_KEY);
            location.reload();
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    progress.init();
});


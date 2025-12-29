/**
 * PET Words Adventure - Quiz Module
 * Multiple choice quiz for testing vocabulary
 */

const quiz = {
    words: [],
    allWords: [],
    currentIndex: 0,
    score: 0,
    totalQuestions: 10,
    topicId: null,
    answered: false,
    wrongWords: [],  // Track wrong answers for review
    
    /**
     * Initialize quiz mode
     */
    async init(topicId) {
        this.topicId = topicId;
        this.allWords = await dataLoader.getWords(topicId);
        this.words = await dataLoader.getRandomWords(topicId, this.totalQuestions);
        this.currentIndex = 0;
        this.score = 0;
        this.answered = false;
        this.wrongWords = [];  // Reset wrong words tracking
        
        this.render();
        this.updateHeader();
        
        // Hide completion modal
        document.getElementById('quiz-complete').classList.add('hidden');
    },
    
    /**
     * Render current question
     */
    render() {
        if (this.currentIndex >= this.words.length) {
            this.showCompletion();
            return;
        }
        
        const word = this.words[this.currentIndex];
        this.answered = false;
        
        // Update question
        document.getElementById('quiz-word').textContent = word.english;
        
        // Generate options (1 correct + 3 wrong)
        const options = this.generateOptions(word);
        
        // Render options
        const optionsContainer = document.getElementById('quiz-options');
        optionsContainer.innerHTML = options.map((opt, i) => `
            <button class="quiz-option" onclick="quiz.selectOption(${i}, '${opt.chinese}', ${opt.isCorrect})">
                ${opt.chinese}
            </button>
        `).join('');
        
        // Hide feedback and next button
        document.getElementById('quiz-feedback').classList.add('hidden');
        document.getElementById('quiz-next-btn').classList.add('hidden');
        
        this.updateHeader();
    },
    
    /**
     * Generate quiz options
     */
    generateOptions(correctWord) {
        const options = [{ chinese: correctWord.chinese, isCorrect: true }];
        
        // Get wrong options
        const wrongWords = this.allWords
            .filter(w => w.id !== correctWord.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        
        wrongWords.forEach(w => {
            options.push({ chinese: w.chinese, isCorrect: false });
        });
        
        // Shuffle options
        return options.sort(() => Math.random() - 0.5);
    },
    
    /**
     * Handle option selection
     */
    async selectOption(index, chinese, isCorrect) {
        if (this.answered) return;
        this.answered = true;
        
        const word = this.words[this.currentIndex];
        const wordId = word.id || word.english.toLowerCase().replace(/\s+/g, '_');
        const options = document.querySelectorAll('.quiz-option');
        const feedback = document.getElementById('quiz-feedback');
        const nextBtn = document.getElementById('quiz-next-btn');
        
        // Disable all options
        options.forEach(opt => opt.classList.add('disabled'));
        
        // Mark selected option
        options[index].classList.add(isCorrect ? 'correct' : 'wrong');
        
        // Highlight correct answer if wrong selected
        if (!isCorrect) {
            options.forEach(opt => {
                if (opt.textContent.trim() === word.chinese) {
                    opt.classList.add('correct');
                }
            });
        }
        
        // Update score and progress
        if (isCorrect) {
            this.score++;
            progress.updateWordProgress(word.id, true);
            
            feedback.className = 'quiz-feedback correct';
            document.getElementById('feedback-icon').textContent = '✅';
            document.getElementById('feedback-text').textContent = '正确! Great!';
            
            // Sync correct answer to cloud
            await this.syncAnswerToCloud(wordId, true);
        } else {
            progress.updateWordProgress(word.id, false);
            
            // Track wrong word for targeted review
            this.wrongWords.push(wordId);
            
            feedback.className = 'quiz-feedback wrong';
            document.getElementById('feedback-icon').textContent = '❌';
            document.getElementById('feedback-text').textContent = `正确答案是: ${word.chinese}`;
            
            // Sync wrong answer to cloud
            await this.syncAnswerToCloud(wordId, false);
        }
        
        feedback.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
        
        this.updateHeader();
    },
    
    /**
     * Sync quiz answer to cloud for detailed word tracking
     */
    async syncAnswerToCloud(wordId, isCorrect) {
        if (typeof DB !== 'undefined' && DB.getCurrentUser()) {
            try {
                await DB.recordWordLearning(this.topicId, wordId, isCorrect);
                console.log(`📊 Quiz answer synced: ${wordId} (correct: ${isCorrect})`);
            } catch (error) {
                console.warn('⚠️ Could not sync quiz answer:', error.message);
            }
        }
    },
    
    /**
     * Go to next question
     */
    nextQuestion() {
        this.currentIndex++;
        this.render();
    },
    
    /**
     * Update header (score and progress)
     */
    updateHeader() {
        document.getElementById('quiz-score').textContent = this.score;
        document.getElementById('quiz-counter').textContent = 
            `${Math.min(this.currentIndex + 1, this.words.length)} / ${this.words.length}`;
    },
    
    /**
     * Show completion screen
     */
    async showCompletion() {
        const modal = document.getElementById('quiz-complete');
        const percent = (this.score / this.words.length) * 100;
        
        // Update final score
        document.getElementById('final-score').textContent = this.score;
        
        // Generate message based on score
        let message, starsCount;
        if (percent >= 90) {
            message = '🏆 太棒了！你是单词大师！';
            starsCount = 3;
        } else if (percent >= 70) {
            message = '👍 很好！继续加油！';
            starsCount = 2;
        } else if (percent >= 50) {
            message = '💪 不错，再练习一下！';
            starsCount = 1;
        } else {
            message = '📚 需要多复习哦！';
            starsCount = 0;
        }
        
        document.getElementById('score-message').textContent = message;
        document.getElementById('stars-earned').textContent = '⭐'.repeat(starsCount) + '☆'.repeat(3 - starsCount);
        
        // Award stars
        if (starsCount > 0) {
            progress.addStars(starsCount);
        }
        
        // Record detailed quiz result to cloud (with wrong words for targeted review)
        if (typeof DB !== 'undefined' && DB.getCurrentUser()) {
            try {
                await DB.recordQuizResult(this.topicId, this.score, this.words.length, this.wrongWords);
                console.log('📊 Quiz completed and synced to cloud');
            } catch (error) {
                console.warn('⚠️ Could not sync quiz result:', error.message);
            }
        }
        
        // Show modal with animation
        modal.classList.remove('hidden');
    },
    
    /**
     * Keyboard shortcuts
     */
    handleKeypress(e) {
        if (this.answered) {
            if (e.key === 'Enter' || e.key === ' ') {
                this.nextQuestion();
            }
        } else {
            // Number keys to select options
            const num = parseInt(e.key);
            if (num >= 1 && num <= 4) {
                const options = document.querySelectorAll('.quiz-option');
                if (options[num - 1]) {
                    options[num - 1].click();
                }
            }
        }
    }
};

// Keyboard navigation for quiz
document.addEventListener('keydown', (e) => {
    const quizScreen = document.getElementById('quiz-screen');
    if (quizScreen && quizScreen.classList.contains('active')) {
        quiz.handleKeypress(e);
    }
});


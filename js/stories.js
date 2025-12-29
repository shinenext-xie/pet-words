/**
 * PET Words Adventure - Memory Stories Module
 * Fun stories with highlighted vocabulary words
 */

const stories = {
    storiesData: [],
    wordMap: {},
    currentIndex: 0,
    topicId: null,
    displayMode: 'english', // 'english', 'chinese', 'both'
    
    /**
     * Initialize stories mode
     */
    async init(topicId) {
        this.topicId = topicId;
        this.storiesData = await dataLoader.getStories(topicId);
        this.wordMap = await dataLoader.getWordMap(topicId);
        this.currentIndex = 0;
        this.displayMode = 'english';
        
        this.render();
        this.updateNav();
        
        // Set active tab
        document.querySelectorAll('.story-tab').forEach((tab, i) => {
            tab.classList.toggle('active', i === 0);
        });
    },
    
    /**
     * Render current story
     */
    render() {
        if (this.storiesData.length === 0) {
            document.getElementById('story-text').innerHTML = '<p>No stories available for this topic.</p>';
            return;
        }
        
        const story = this.storiesData[this.currentIndex];
        
        // Update header
        document.getElementById('story-title').textContent = `📖 ${story.title}`;
        document.getElementById('story-title-chinese').textContent = story.titleChinese;
        document.getElementById('story-word-count').textContent = story.wordCount;
        
        // Render story content based on mode
        const storyText = document.getElementById('story-text');
        
        switch (this.displayMode) {
            case 'english':
                storyText.innerHTML = this.highlightWords(story.story);
                break;
            case 'chinese':
                storyText.innerHTML = this.highlightWordsChinese(story.storyChinese);
                break;
            case 'both':
                storyText.innerHTML = `
                    <div class="story-english">${this.highlightWords(story.story)}</div>
                    <div class="story-chinese">${this.highlightWordsChinese(story.storyChinese)}</div>
                `;
                break;
        }
    },
    
    /**
     * Highlight vocabulary words in English text
     * Words are marked with {curly braces} in the data
     */
    highlightWords(text) {
        return text.replace(/\{([^}]+)\}/g, (match, word) => {
            const wordData = this.findWord(word);
            if (wordData) {
                return `<span class="highlight" data-word="${wordData.english}" data-chinese="${wordData.chinese}" onclick="stories.showWord('${wordData.english}', '${wordData.chinese}')">${word}</span>`;
            }
            return `<span class="highlight">${word}</span>`;
        });
    },
    
    /**
     * Highlight vocabulary words in Chinese text
     */
    highlightWordsChinese(text) {
        return text.replace(/\{([^}]+)\}/g, (match, word) => {
            return `<span class="highlight highlight-chinese">${word}</span>`;
        });
    },
    
    /**
     * Find word in word map
     */
    findWord(word) {
        const key = word.toLowerCase();
        return this.wordMap[key];
    },
    
    /**
     * Show word popup
     */
    showWord(english, chinese) {
        const popup = document.getElementById('word-popup');
        document.getElementById('popup-english').textContent = english;
        document.getElementById('popup-chinese').textContent = chinese;
        
        popup.classList.remove('hidden');
        popup.classList.add('animate-fadeIn');
    },
    
    /**
     * Close word popup
     */
    closePopup() {
        const popup = document.getElementById('word-popup');
        popup.classList.add('hidden');
    },
    
    /**
     * Show English only
     */
    showEnglish() {
        this.displayMode = 'english';
        this.updateTabs(0);
        this.render();
    },
    
    /**
     * Show Chinese only
     */
    showChinese() {
        this.displayMode = 'chinese';
        this.updateTabs(1);
        this.render();
    },
    
    /**
     * Show both languages
     */
    showBoth() {
        this.displayMode = 'both';
        this.updateTabs(2);
        this.render();
    },
    
    /**
     * Update active tab
     */
    updateTabs(activeIndex) {
        document.querySelectorAll('.story-tab').forEach((tab, i) => {
            tab.classList.toggle('active', i === activeIndex);
        });
    },
    
    /**
     * Go to next story
     */
    next() {
        if (this.currentIndex < this.storiesData.length - 1) {
            this.currentIndex++;
        } else {
            this.currentIndex = 0; // Loop back
        }
        this.render();
        this.updateNav();
    },
    
    /**
     * Go to previous story
     */
    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        } else {
            this.currentIndex = this.storiesData.length - 1; // Loop to end
        }
        this.render();
        this.updateNav();
    },
    
    /**
     * Update navigation counter
     */
    updateNav() {
        document.getElementById('story-counter').textContent = 
            `${this.currentIndex + 1} / ${this.storiesData.length}`;
    },
    
    /**
     * Keyboard navigation
     */
    handleKeypress(e) {
        switch(e.key) {
            case 'ArrowRight':
                this.next();
                break;
            case 'ArrowLeft':
                this.prev();
                break;
            case 'Escape':
                this.closePopup();
                break;
            case '1':
                this.showEnglish();
                break;
            case '2':
                this.showChinese();
                break;
            case '3':
                this.showBoth();
                break;
        }
    }
};

// Click outside popup to close
document.addEventListener('click', (e) => {
    const popup = document.getElementById('word-popup');
    if (e.target === popup) {
        stories.closePopup();
    }
});

// Keyboard navigation for stories
document.addEventListener('keydown', (e) => {
    const storyScreen = document.getElementById('story-screen');
    if (storyScreen && storyScreen.classList.contains('active')) {
        stories.handleKeypress(e);
    }
});


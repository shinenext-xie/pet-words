/**
 * PET Words Adventure - Data Loader
 * Loads word data from JSON files
 */

const dataLoader = {
    topicsIndex: null,
    topicsData: {},
    
    /**
     * Initialize and load topics index
     */
    async init() {
        try {
            const response = await fetch('data/words/index.json');
            this.topicsIndex = await response.json();
            return this.topicsIndex;
        } catch (e) {
            console.error('Error loading topics index:', e);
            return null;
        }
    },
    
    /**
     * Get all available topics
     */
    getTopics() {
        return this.topicsIndex?.topics || [];
    },
    
    /**
     * Load a specific topic's word data
     */
    async loadTopic(topicId) {
        // Return cached data if available
        if (this.topicsData[topicId]) {
            return this.topicsData[topicId];
        }
        
        const topic = this.topicsIndex?.topics.find(t => t.id === topicId);
        if (!topic) {
            console.error('Topic not found:', topicId);
            return null;
        }
        
        try {
            const response = await fetch(`data/words/${topic.file}`);
            const data = await response.json();
            this.topicsData[topicId] = data;
            return data;
        } catch (e) {
            console.error('Error loading topic:', topicId, e);
            return null;
        }
    },
    
    /**
     * Get words for a topic
     */
    async getWords(topicId) {
        const data = await this.loadTopic(topicId);
        return data?.words || [];
    },
    
    /**
     * Get memory stories for a topic
     */
    async getStories(topicId) {
        const data = await this.loadTopic(topicId);
        return data?.memoryStories || [];
    },
    
    /**
     * Get a specific word by ID
     */
    async getWord(topicId, wordId) {
        const words = await this.getWords(topicId);
        return words.find(w => w.id === wordId);
    },
    
    /**
     * Search words across all loaded topics
     */
    searchWords(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        Object.values(this.topicsData).forEach(topicData => {
            topicData.words.forEach(word => {
                if (
                    word.english.toLowerCase().includes(lowerQuery) ||
                    word.chinese.includes(query)
                ) {
                    results.push({
                        ...word,
                        topicId: topicData.topic.id,
                        topicName: topicData.topic.name
                    });
                }
            });
        });
        
        return results;
    },
    
    /**
     * Get random words for quiz
     */
    async getRandomWords(topicId, count = 10) {
        const words = await this.getWords(topicId);
        const shuffled = [...words].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    },
    
    /**
     * Get word lookup map (for stories highlighting)
     */
    async getWordMap(topicId) {
        const words = await this.getWords(topicId);
        const map = {};
        
        words.forEach(word => {
            // Map both English word and variations
            const key = word.english.toLowerCase();
            map[key] = word;
            
            // Handle words with parentheses like "go (with/together)"
            if (word.english.includes('(')) {
                const base = word.english.split('(')[0].trim().toLowerCase();
                map[base] = word;
            }
        });
        
        return map;
    },
    
    /**
     * Get total word count across all topics
     */
    getTotalWordCount() {
        return this.topicsIndex?.totalWords || 0;
    }
};


/**
 * PET Words Adventure - LeanCloud Database Connection
 * Handles cloud data storage and sync with detailed tracking
 * Designed for future Ebbinghaus Forgetting Curve implementation
 */

const DB = {
  // LeanCloud Configuration
  config: {
    appId: '00T9hlvFTPdyzMfbyDsITbAV-gzGzoHsz',
    appKey: '52TE9oTrHNJb1qQPi8m7rUsf',
    serverURL: 'https://00t9hlvf.lc-cn-n1-shared.com'
  },

  // Mastery levels for Ebbinghaus curve (6 levels)
  MASTERY_LEVELS: {
    NEW: 0,        // Just learned
    LEARNING: 1,   // 1st review done
    FAMILIAR: 2,   // 2nd review done
    CONFIDENT: 3,  // 3rd review done
    MASTERED: 4,   // 4th review done
    PERMANENT: 5   // In long-term memory
  },

  // Classic Ebbinghaus Review Intervals (days)
  // Day 0: Learn → Day 1: 1st review → Day 3: 2nd → Day 7: 3rd → Day 14: 4th → Day 30: 5th
  REVIEW_INTERVALS: {
    0: 1,    // NEW: review in 1 day (Day 0 → Day 1)
    1: 2,    // LEARNING: review in 2 days (Day 1 → Day 3)
    2: 4,    // FAMILIAR: review in 4 days (Day 3 → Day 7)
    3: 7,    // CONFIDENT: review in 7 days (Day 7 → Day 14)
    4: 16,   // MASTERED: review in 16 days (Day 14 → Day 30)
    5: 30    // PERMANENT: review in 30 days (maintenance)
  },

  // Check if online
  isOnline() {
    return navigator.onLine;
  },

  // Fetch fresh user data from cloud (use when online)
  async fetchFreshUserData() {
    const user = this.getCurrentUser();
    if (!user) return null;

    if (this.isOnline()) {
      try {
        await user.fetch();
        console.log('☁️ Fetched fresh data from cloud');
        return user;
      } catch (error) {
        console.warn('⚠️ Could not fetch from cloud, using cache:', error.message);
        return user;
      }
    } else {
      console.log('📴 Offline - using cached data');
      return user;
    }
  },

  // Initialize LeanCloud
  init() {
    if (typeof AV === 'undefined') {
      console.error('❌ LeanCloud SDK not loaded - check network connection');
      return false;
    }
    
    try {
      AV.init({
        appId: this.config.appId,
        appKey: this.config.appKey,
        serverURL: this.config.serverURL
      });
      
      console.log('✅ LeanCloud initialized');
      return true;
    } catch (error) {
      console.error('❌ LeanCloud init error:', error);
      return false;
    }
  },
  
  // Migration: Fix old data where masteryLevel wasn't set correctly
  async migrateOldData() {
    const user = this.getCurrentUser();
    if (!user) return;
    
    try {
      await user.fetch();
      const wordLearning = user.get('wordLearning') || {};
      let fixedCount = 0;
      
      // Fix words that have correctCount > 0 but masteryLevel < FAMILIAR
      for (const [key, data] of Object.entries(wordLearning)) {
        if (data.correctCount > 0 && data.masteryLevel < this.MASTERY_LEVELS.FAMILIAR) {
          data.masteryLevel = this.MASTERY_LEVELS.FAMILIAR;
          data.nextReview = this.calculateNextReview(data.masteryLevel);
          fixedCount++;
          console.log(`🔧 Fixed: ${key} -> masteryLevel: ${data.masteryLevel}`);
        }
      }
      
      if (fixedCount > 0) {
        user.set('wordLearning', wordLearning);
        
        // Recalculate topic progress
        const topicProgress = {};
        for (const [key, data] of Object.entries(wordLearning)) {
          const topicId = data.topicId;
          if (!topicProgress[topicId]) {
            topicProgress[topicId] = {
              wordsLearned: 0,
              wordsStudied: 0,
              averageMastery: 0,
              quizzesTaken: 0,
              bestQuizScore: 0,
              totalQuizScore: 0,
              lastStudied: null,
              studyDays: []
            };
          }
          topicProgress[topicId].wordsStudied++;
          if (data.masteryLevel >= this.MASTERY_LEVELS.FAMILIAR) {
            topicProgress[topicId].wordsLearned++;
          }
          topicProgress[topicId].lastStudied = data.lastReviewed;
        }
        
        user.set('topicProgress', topicProgress);
        
        // Recalculate total words learned
        let totalWordsLearned = 0;
        for (const tp of Object.values(topicProgress)) {
          totalWordsLearned += tp.wordsLearned || 0;
        }
        user.set('totalWordsLearned', totalWordsLearned);
        
        await user.save();
        console.log(`✅ Migration complete! Fixed ${fixedCount} words. Total learned: ${totalWordsLearned}`);
      } else {
        console.log('✅ No migration needed - all data is correct');
      }
      
      return fixedCount;
    } catch (error) {
      console.error('❌ Migration error:', error);
      return 0;
    }
  },

  // Check if user is logged in
  getCurrentUser() {
    return AV.User.current();
  },

  // Register new user with comprehensive progress structure
  async register(username) {
    const user = new AV.User();
    const cleanUsername = username.toLowerCase().trim();
    
    user.setUsername(cleanUsername);
    user.setPassword(cleanUsername + '_pet_words');
    
    // Initialize comprehensive progress data
    const today = new Date().toISOString().split('T')[0];
    
    user.set('displayName', username.trim());
    user.set('startDate', today);
    
    // Overall stats
    user.set('totalWordsLearned', 0);
    user.set('currentStreak', 0);
    user.set('longestStreak', 0);
    user.set('totalDaysStudied', 0);
    user.set('lastStudyStr', null);
    
    // Per-topic progress (detailed tracking)
    user.set('topicProgress', {});
    
    // Word-level learning data (for Ebbinghaus curve)
    user.set('wordLearning', {});
    
    // Quiz history (detailed)
    user.set('quizHistory', []);
    user.set('totalQuizzes', 0);
    user.set('averageScore', 0);
    
    // Study sessions log
    user.set('studySessions', []);
    
    try {
      await user.signUp();
      console.log('✅ User registered:', username);
      return { success: true, user };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { success: false, error: error.message };
    }
  },

  // Login existing user
  async login(username) {
    const cleanUsername = username.toLowerCase().trim();
    
    try {
      const user = await AV.User.logIn(cleanUsername, cleanUsername + '_pet_words');
      console.log('✅ User logged in:', username);
      return { success: true, user };
    } catch (error) {
      // If user doesn't exist, register them
      if (error.code === 211) {
        return this.register(username);
      }
      console.error('❌ Login error:', error);
      return { success: false, error: error.message };
    }
  },

  // Logout
  async logout() {
    await AV.User.logOut();
    console.log('✅ User logged out');
  },

  // Get today's date string
  getTodayStr() {
    return new Date().toISOString().split('T')[0];
  },

  // Calculate next review date based on mastery level (Ebbinghaus)
  calculateNextReview(masteryLevel) {
    const days = this.REVIEW_INTERVALS[masteryLevel] || 1;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate.toISOString().split('T')[0];
  },

  // ============================================
  // WORD LEARNING TRACKING (Detailed)
  // ============================================

  // Record learning a single word
  async recordWordLearning(topicId, wordId, isCorrect = true) {
    const user = this.getCurrentUser();
    if (!user) return null;

    try {
      const today = this.getTodayStr();
      const wordLearning = user.get('wordLearning') || {};
      const wordKey = `${topicId}_${wordId}`;
      
      // Get or create word learning record
      let wordData = wordLearning[wordKey] || {
        topicId: topicId,
        wordId: wordId,
        firstLearned: today,
        lastReviewed: null,
        reviewCount: 0,
        masteryLevel: this.MASTERY_LEVELS.NEW,
        nextReview: today,
        correctCount: 0,
        incorrectCount: 0,
        history: []  // Track each review
      };

      // Update word data
      wordData.lastReviewed = today;
      wordData.reviewCount += 1;
      
      if (isCorrect) {
        wordData.correctCount += 1;
        // Classic Ebbinghaus: Each correct review increases mastery by 1 level
        // First time: NEW(0) → FAMILIAR(2) to count as "learned"
        // Subsequent reviews: Gradual increase up to PERMANENT(5)
        if (wordData.masteryLevel < this.MASTERY_LEVELS.FAMILIAR) {
          // First time learning - jump to FAMILIAR
          wordData.masteryLevel = this.MASTERY_LEVELS.FAMILIAR;
        } else if (wordData.masteryLevel < this.MASTERY_LEVELS.PERMANENT) {
          // Each successful review increases by 1 level
          wordData.masteryLevel += 1;
        }
      } else {
        wordData.incorrectCount += 1;
        // Forgot word: Drop 1-2 levels based on how well known it was
        if (wordData.masteryLevel >= this.MASTERY_LEVELS.CONFIDENT) {
          // Well-known words: drop 2 levels (need more review)
          wordData.masteryLevel = Math.max(this.MASTERY_LEVELS.LEARNING, wordData.masteryLevel - 2);
        } else if (wordData.masteryLevel > this.MASTERY_LEVELS.NEW) {
          // Less known words: drop 1 level
          wordData.masteryLevel = Math.max(this.MASTERY_LEVELS.LEARNING, wordData.masteryLevel - 1);
        }
      }

      // Calculate next review date based on mastery
      wordData.nextReview = this.calculateNextReview(wordData.masteryLevel);

      // Add to history
      wordData.history.push({
        date: today,
        correct: isCorrect,
        masteryLevel: wordData.masteryLevel
      });

      // Keep only last 20 history entries
      if (wordData.history.length > 20) {
        wordData.history = wordData.history.slice(-20);
      }

      wordLearning[wordKey] = wordData;
      user.set('wordLearning', wordLearning);
      
      // Update topic progress
      await this.updateTopicProgress(topicId);
      
      // Update streak
      await this.updateStreak();
      
      await user.save();
      
      // Log the updated stats
      const totalWordsLearned = user.get('totalWordsLearned') || 0;
      console.log(`✅ Word saved: "${wordId}" (mastery: ${wordData.masteryLevel})`);
      console.log(`📊 Total words learned: ${totalWordsLearned}`);
      
      return wordData;
    } catch (error) {
      console.error('❌ Error recording word learning:', error);
      return null;
    }
  },

  // Mark word as learned (from flashcard "记住了" button)
  async markWordLearned(topicId, wordId) {
    return this.recordWordLearning(topicId, wordId, true);
  },

  // Mark word as needs review (from flashcard "再学学" button)
  async markWordNeedsReview(topicId, wordId) {
    return this.recordWordLearning(topicId, wordId, false);
  },

  // Get words due for review (for Ebbinghaus implementation)
  getWordsDueForReview(topicId = null) {
    const user = this.getCurrentUser();
    if (!user) return [];

    const today = this.getTodayStr();
    const wordLearning = user.get('wordLearning') || {};
    
    const dueWords = [];
    
    for (const [key, data] of Object.entries(wordLearning)) {
      if (topicId && data.topicId !== topicId) continue;
      
      if (data.nextReview <= today) {
        dueWords.push({
          ...data,
          key: key,
          daysSinceReview: this.daysBetween(data.lastReviewed, today)
        });
      }
    }

    // Sort by priority: lower mastery first, then by days overdue
    dueWords.sort((a, b) => {
      if (a.masteryLevel !== b.masteryLevel) {
        return a.masteryLevel - b.masteryLevel;
      }
      return b.daysSinceReview - a.daysSinceReview;
    });

    return dueWords;
  },

  // Calculate days between two date strings
  daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // ============================================
  // TOPIC PROGRESS TRACKING
  // ============================================

  // Update topic-level progress
  async updateTopicProgress(topicId) {
    const user = this.getCurrentUser();
    if (!user) return;

    try {
      const today = this.getTodayStr();
      const wordLearning = user.get('wordLearning') || {};
      const topicProgress = user.get('topicProgress') || {};
      
      // Count words learned in this topic
      let wordsLearned = 0;
      let totalMastery = 0;
      let wordCount = 0;
      
      for (const [key, data] of Object.entries(wordLearning)) {
        if (data.topicId === topicId) {
          wordCount++;
          if (data.masteryLevel >= this.MASTERY_LEVELS.FAMILIAR) {
            wordsLearned++;
          }
          totalMastery += data.masteryLevel;
        }
      }

      // Get or create topic progress
      let topicData = topicProgress[topicId] || {
        wordsLearned: 0,
        wordsStudied: 0,
        averageMastery: 0,
        quizzesTaken: 0,
        bestQuizScore: 0,
        totalQuizScore: 0,
        lastStudied: null,
        firstStudied: today,
        studyDays: []
      };

      // Update topic data
      topicData.wordsLearned = wordsLearned;
      topicData.wordsStudied = wordCount;
      topicData.averageMastery = wordCount > 0 ? (totalMastery / wordCount).toFixed(2) : 0;
      topicData.lastStudied = today;
      
      // Track unique study days
      if (!topicData.studyDays.includes(today)) {
        topicData.studyDays.push(today);
        // Keep only last 30 days
        if (topicData.studyDays.length > 30) {
          topicData.studyDays = topicData.studyDays.slice(-30);
        }
      }

      topicProgress[topicId] = topicData;
      user.set('topicProgress', topicProgress);

      // Update total words learned
      let totalWordsLearned = 0;
      for (const tp of Object.values(topicProgress)) {
        totalWordsLearned += tp.wordsLearned || 0;
      }
      user.set('totalWordsLearned', totalWordsLearned);

      // Don't save here - let the caller save
      return topicData;
    } catch (error) {
      console.error('❌ Error updating topic progress:', error);
      return null;
    }
  },

  // Get topic progress (sync - uses cached data)
  getTopicProgress(topicId) {
    const user = this.getCurrentUser();
    if (!user) return null;

    const topicProgress = user.get('topicProgress') || {};
    return topicProgress[topicId] || null;
  },

  // Get topic progress (async - fetches fresh data when online)
  async getTopicProgressAsync(topicId) {
    const user = await this.fetchFreshUserData();
    if (!user) return null;

    const topicProgress = user.get('topicProgress') || {};
    return topicProgress[topicId] || null;
  },

  // ============================================
  // QUIZ TRACKING (Detailed)
  // ============================================

  // Record detailed quiz result
  async recordQuizResult(topicId, score, totalQuestions, wrongWords = []) {
    const user = this.getCurrentUser();
    if (!user) return null;

    try {
      const today = this.getTodayStr();
      const percentage = Math.round((score / totalQuestions) * 100);
      
      // Create quiz record
      const quizRecord = {
        topicId: topicId,
        date: new Date().toISOString(),
        dateStr: today,
        score: score,
        totalQuestions: totalQuestions,
        percentage: percentage,
        wrongWords: wrongWords,  // For targeted review
        duration: null  // Can add later
      };

      // Update quiz history
      const quizHistory = user.get('quizHistory') || [];
      quizHistory.push(quizRecord);
      
      // Keep only last 100 quizzes
      if (quizHistory.length > 100) {
        quizHistory.shift();
      }
      user.set('quizHistory', quizHistory);

      // Update totals
      const totalQuizzes = (user.get('totalQuizzes') || 0) + 1;
      user.set('totalQuizzes', totalQuizzes);

      // Calculate new average
      const totalScore = quizHistory.reduce((sum, q) => sum + q.percentage, 0);
      const averageScore = Math.round(totalScore / quizHistory.length);
      user.set('averageScore', averageScore);

      // Update topic quiz stats
      const topicProgress = user.get('topicProgress') || {};
      let topicData = topicProgress[topicId] || {
        quizzesTaken: 0,
        bestQuizScore: 0,
        totalQuizScore: 0
      };
      
      topicData.quizzesTaken = (topicData.quizzesTaken || 0) + 1;
      topicData.bestQuizScore = Math.max(topicData.bestQuizScore || 0, percentage);
      topicData.totalQuizScore = (topicData.totalQuizScore || 0) + percentage;
      topicData.averageQuizScore = Math.round(topicData.totalQuizScore / topicData.quizzesTaken);
      topicData.lastQuizDate = today;
      
      topicProgress[topicId] = topicData;
      user.set('topicProgress', topicProgress);

      // Record wrong words as needing review
      for (const wordId of wrongWords) {
        await this.recordWordLearning(topicId, wordId, false);
      }

      // Update streak
      await this.updateStreak();
      
      await user.save();
      
      console.log('✅ Quiz recorded:', { topicId, score, totalQuestions, percentage });
      return quizRecord;
    } catch (error) {
      console.error('❌ Error recording quiz:', error);
      return null;
    }
  },

  // Get quiz history for a topic
  getQuizHistory(topicId = null, limit = 10) {
    const user = this.getCurrentUser();
    if (!user) return [];

    const quizHistory = user.get('quizHistory') || [];
    
    let filtered = topicId 
      ? quizHistory.filter(q => q.topicId === topicId)
      : quizHistory;
    
    return filtered.slice(-limit).reverse();
  },

  // ============================================
  // STUDY SESSION TRACKING
  // ============================================

  // Record a study session
  async recordStudySession(topicId, mode, wordsStudied, duration = null) {
    const user = this.getCurrentUser();
    if (!user) return null;

    try {
      const session = {
        topicId: topicId,
        mode: mode,  // 'flashcard', 'quiz', 'story', 'library'
        wordsStudied: wordsStudied,
        duration: duration,
        timestamp: new Date().toISOString(),
        date: this.getTodayStr()
      };

      const studySessions = user.get('studySessions') || [];
      studySessions.push(session);
      
      // Keep only last 200 sessions
      if (studySessions.length > 200) {
        studySessions.shift();
      }
      
      user.set('studySessions', studySessions);
      await user.save();
      
      return session;
    } catch (error) {
      console.error('❌ Error recording study session:', error);
      return null;
    }
  },

  // ============================================
  // STREAK TRACKING
  // ============================================

  // Update study streak
  async updateStreak() {
    const user = this.getCurrentUser();
    if (!user) return { currentStreak: 0, longestStreak: 0, totalDaysStudied: 0 };

    try {
      const today = this.getTodayStr();
      const lastStudyStr = user.get('lastStudyStr');
      
      let currentStreak = user.get('currentStreak') || 0;
      let longestStreak = user.get('longestStreak') || 0;
      let totalDaysStudied = user.get('totalDaysStudied') || 0;

      if (lastStudyStr !== today) {
        // Check if consecutive day
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastStudyStr === yesterdayStr) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }

        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }

        totalDaysStudied += 1;

        user.set('lastStudyStr', today);
        user.set('currentStreak', currentStreak);
        user.set('longestStreak', longestStreak);
        user.set('totalDaysStudied', totalDaysStudied);
        
        // Don't save here - let caller save
      }

      return { currentStreak, longestStreak, totalDaysStudied };
    } catch (error) {
      console.warn('⚠️ Could not update streak:', error.message);
      return { 
        currentStreak: user.get('currentStreak') || 0, 
        longestStreak: user.get('longestStreak') || 0, 
        totalDaysStudied: user.get('totalDaysStudied') || 0 
      };
    }
  },

  // ============================================
  // DATA LOADING
  // ============================================

  // Load all progress from cloud
  async loadProgress() {
    // Always try to fetch fresh data from cloud when online
    const user = await this.fetchFreshUserData();
    if (!user) return null;

    try {
      return {
        displayName: user.get('displayName'),
        startDate: user.get('startDate'),
        totalWordsLearned: user.get('totalWordsLearned') || 0,
        currentStreak: user.get('currentStreak') || 0,
        longestStreak: user.get('longestStreak') || 0,
        totalDaysStudied: user.get('totalDaysStudied') || 0,
        lastStudyStr: user.get('lastStudyStr'),
        topicProgress: user.get('topicProgress') || {},
        wordLearning: user.get('wordLearning') || {},
        quizHistory: user.get('quizHistory') || [],
        totalQuizzes: user.get('totalQuizzes') || 0,
        averageScore: user.get('averageScore') || 0,
        studySessions: user.get('studySessions') || []
      };
    } catch (error) {
      console.error('❌ Error loading progress:', error);
      return null;
    }
  },

  // Get word learning status for a specific word
  getWordStatus(topicId, wordId) {
    const user = this.getCurrentUser();
    if (!user) return null;

    const wordLearning = user.get('wordLearning') || {};
    const wordKey = `${topicId}_${wordId}`;
    
    return wordLearning[wordKey] || null;
  },

  // Get all learned words for a topic
  // Get all learned words for a topic (sync version - uses cached data)
  getLearnedWordsForTopic(topicId) {
    const user = this.getCurrentUser();
    if (!user) return [];

    const wordLearning = user.get('wordLearning') || {};
    const learnedWords = [];
    
    for (const [key, data] of Object.entries(wordLearning)) {
      if (data.topicId === topicId && data.masteryLevel >= this.MASTERY_LEVELS.FAMILIAR) {
        learnedWords.push(data.wordId);
      }
    }
    
    console.log(`📊 Topic "${topicId}": ${learnedWords.length} learned words found`);
    return learnedWords;
  },
  
  // Get all learned words for a topic (async version - fetches fresh data when online)
  async getLearnedWordsForTopicAsync(topicId) {
    // Always try to fetch fresh data from cloud when online
    const user = await this.fetchFreshUserData();
    if (!user) return [];

    return this.getLearnedWordsForTopic(topicId);
  },

  // ============================================
  // LEADERBOARD
  // ============================================

  // Get leaderboard
  async getLeaderboard(limit = 20) {
    try {
      const query = new AV.Query('_User');
      query.descending('totalWordsLearned');
      query.limit(limit);
      query.select(['displayName', 'totalWordsLearned', 'currentStreak', 'averageScore', 'totalDaysStudied']);
      
      const results = await query.find();
      
      return results.map((user, index) => ({
        rank: index + 1,
        name: user.get('displayName'),
        wordsLearned: user.get('totalWordsLearned') || 0,
        streak: user.get('currentStreak') || 0,
        averageScore: user.get('averageScore') || 0,
        daysStudied: user.get('totalDaysStudied') || 0
      }));
    } catch (error) {
      console.error('❌ Error fetching leaderboard:', error);
      return [];
    }
  },

  // ============================================
  // STATISTICS
  // ============================================

  // Get comprehensive stats for profile page
  async getDetailedStats() {
    const user = this.getCurrentUser();
    if (!user) return null;

    await user.fetch();
    
    const wordLearning = user.get('wordLearning') || {};
    const topicProgress = user.get('topicProgress') || {};
    const quizHistory = user.get('quizHistory') || [];
    
    // Calculate additional stats
    let totalWords = 0;
    let masteredWords = 0;
    let learningWords = 0;
    let newWords = 0;
    
    for (const data of Object.values(wordLearning)) {
      totalWords++;
      switch (data.masteryLevel) {
        case this.MASTERY_LEVELS.MASTERED:
          masteredWords++;
          break;
        case this.MASTERY_LEVELS.FAMILIAR:
        case this.MASTERY_LEVELS.LEARNING:
          learningWords++;
          break;
        default:
          newWords++;
      }
    }

    // Words due for review
    const wordsDueForReview = this.getWordsDueForReview().length;

    return {
      // Basic stats
      displayName: user.get('displayName'),
      startDate: user.get('startDate'),
      totalDaysStudied: user.get('totalDaysStudied') || 0,
      currentStreak: user.get('currentStreak') || 0,
      longestStreak: user.get('longestStreak') || 0,
      
      // Word stats
      totalWordsStudied: totalWords,
      totalWordsLearned: user.get('totalWordsLearned') || 0,
      masteredWords: masteredWords,
      learningWords: learningWords,
      wordsDueForReview: wordsDueForReview,
      
      // Quiz stats
      totalQuizzes: user.get('totalQuizzes') || 0,
      averageScore: user.get('averageScore') || 0,
      
      // Topic breakdown
      topicProgress: topicProgress,
      
      // Recent activity
      recentQuizzes: quizHistory.slice(-5).reverse()
    };
  }
};

// Export for use in other modules
window.DB = DB;

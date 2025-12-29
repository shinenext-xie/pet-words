/**
 * PET Words Adventure - Authentication Module
 * Handles user login/signup UI and flow
 */

console.log('📦 auth.js loaded');

const Auth = {
  // Initialize auth module
  init() {
    try {
      console.log('🔐 Auth module initializing...');
      this.bindEvents();
      this.checkLoginStatus();
      console.log('✅ Auth module initialized');
    } catch (error) {
      console.error('❌ Auth init error:', error);
    }
  },

  // Bind event listeners
  bindEvents() {
    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // Profile button
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => this.showProfile());
    }
  },

  // Check if user is already logged in
  async checkLoginStatus() {
    console.log('🔍 Checking login status...');
    
    // Check if DB is available
    if (typeof DB === 'undefined' || typeof AV === 'undefined') {
      console.warn('Database not available, showing login screen');
      this.showLoginScreen();
      return;
    }
    
    const user = DB.getCurrentUser();
    console.log('👤 Current user:', user ? user.get('displayName') : 'none');
    
    if (user) {
      // User is logged in - hide login screen immediately
      console.log('✅ User found, hiding login screen');
      this.onLoginSuccess(user);
    } else {
      // Show login screen
      console.log('📱 No user, showing login screen');
      this.showLoginScreen();
    }
  },

  // Handle login form submission
  async handleLogin() {
    const usernameInput = document.getElementById('username-input');
    const username = usernameInput.value.trim();
    const loginBtn = document.getElementById('login-btn');
    const errorMsg = document.getElementById('login-error');

    if (!username) {
      this.showError('请输入你的名字 / Please enter your name');
      return;
    }

    if (username.length < 2) {
      this.showError('名字至少需要2个字符 / Name must be at least 2 characters');
      return;
    }

    // Show loading state
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="loading-spinner"></span> 登录中...';
    errorMsg.style.display = 'none';

    try {
      const result = await DB.login(username);
      
      if (result.success) {
        this.onLoginSuccess(result.user);
      } else {
        this.showError(result.error || '登录失败，请重试');
      }
    } catch (error) {
      this.showError('网络错误，请检查网络连接');
    } finally {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '🚀 开始学习 Start Learning';
    }
  },

  // Show error message
  showError(message) {
    const errorMsg = document.getElementById('login-error');
    if (errorMsg) {
      errorMsg.textContent = message;
      errorMsg.style.display = 'block';
    }
  },

  // On successful login
  async onLoginSuccess(user) {
    // Hide login screen FIRST
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
      loginScreen.style.display = 'none';
    }

    // Show main app
    const mainApp = document.getElementById('main-app');
    if (mainApp) {
      mainApp.style.display = 'block';
    }

    // Update header with user info
    this.updateUserHeader(user);

    console.log('✅ Login successful:', user.get('displayName'));

    // Migrate old data if needed (fix masteryLevel issues)
    try {
      await DB.migrateOldData();
    } catch (error) {
      console.warn('Could not migrate data:', error);
    }

    // Update streak (non-blocking)
    try {
      await DB.updateStreak();
    } catch (error) {
      console.warn('Could not update streak:', error);
    }

    // Load and display progress (non-blocking)
    try {
      await this.loadUserProgress();
    } catch (error) {
      console.warn('Could not load progress:', error);
    }
  },

  // Update header with user info
  updateUserHeader(user) {
    const displayName = user.get('displayName') || user.getUsername();
    
    // Update header username
    const userNameSpan = document.getElementById('user-display-name');
    if (userNameSpan) {
      userNameSpan.textContent = displayName;
    }
    
    // Update welcome message username
    const welcomeUsername = document.getElementById('welcome-username');
    if (welcomeUsername) {
      welcomeUsername.textContent = displayName;
    }
    
    // Show user section
    const userSection = document.getElementById('user-section');
    if (userSection) {
      userSection.style.display = 'flex';
    }
  },

  // Load user progress
  async loadUserProgress() {
    const progress = await DB.loadProgress();
    if (progress) {
      // Update stats display
      this.updateStatsDisplay(progress);
    }
  },

  // Update stats display on home screen
  updateStatsDisplay(progress) {
    // Streak display
    const streakDisplay = document.getElementById('streak-display');
    if (streakDisplay) {
      streakDisplay.textContent = progress.currentStreak || 0;
    }

    // Words learned display
    const wordsDisplay = document.getElementById('words-learned-display');
    if (wordsDisplay) {
      wordsDisplay.textContent = progress.totalWordsLearned || 0;
    }

    // Days studied display
    const daysDisplay = document.getElementById('days-studied-display');
    if (daysDisplay) {
      daysDisplay.textContent = progress.totalDaysStudied || 0;
    }

    // Average score display
    const scoreDisplay = document.getElementById('avg-score-display');
    if (scoreDisplay) {
      scoreDisplay.textContent = (progress.averageScore || 0) + '%';
    }
  },

  // Show login screen
  showLoginScreen() {
    console.log('📱 Showing login screen');
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    
    if (loginScreen) {
      loginScreen.style.display = 'flex';
      console.log('✅ Login screen displayed');
    } else {
      console.error('❌ Login screen element not found');
    }
    
    if (mainApp) {
      mainApp.style.display = 'none';
    }
  },

  // Handle logout
  async handleLogout() {
    if (confirm('确定要退出登录吗？ / Are you sure you want to logout?')) {
      await DB.logout();
      this.showLoginScreen();
      
      // Clear user section
      const userSection = document.getElementById('user-section');
      if (userSection) {
        userSection.style.display = 'none';
      }
    }
  },

  // Show profile page
  async showProfile() {
    const progress = await DB.loadProgress();
    if (!progress) return;

    // Navigate to profile view
    if (typeof App !== 'undefined' && App.showView) {
      App.showView('profile');
    }

    // Populate profile data
    this.populateProfile(progress);
  },

  // Populate profile page with data
  populateProfile(progress) {
    // Basic stats
    document.getElementById('profile-name').textContent = progress.displayName;
    document.getElementById('profile-start-date').textContent = progress.startDate || 'N/A';
    document.getElementById('profile-days').textContent = progress.totalDaysStudied || 0;
    document.getElementById('profile-words').textContent = progress.totalWordsLearned || 0;
    document.getElementById('profile-streak').textContent = progress.currentStreak || 0;
    document.getElementById('profile-best-streak').textContent = progress.longestStreak || 0;
    document.getElementById('profile-quizzes').textContent = progress.totalQuizzes || 0;
    document.getElementById('profile-avg-score').textContent = (progress.averageScore || 0) + '%';

    // Topic progress
    this.renderTopicProgress(progress.topicProgress);

    // Quiz history
    this.renderQuizHistory(progress.quizHistory);
  },

  // Render topic progress (detailed version)
  renderTopicProgress(topicProgress) {
    const container = document.getElementById('topic-progress-list');
    if (!container) return;

    container.innerHTML = '';
    
    if (!topicProgress || Object.keys(topicProgress).length === 0) {
      container.innerHTML = '<p class="no-data">还没有学习记录 / No learning records yet</p>';
      return;
    }

    Object.entries(topicProgress).forEach(([topicId, data]) => {
      const item = document.createElement('div');
      item.className = 'topic-progress-item';
      
      // Handle both old format (just number) and new format (object)
      if (typeof data === 'number') {
        item.innerHTML = `
          <span class="topic-name">${topicId.replace(/-/g, ' ')}</span>
          <span class="topic-words">${data} words</span>
        `;
      } else {
        const wordsLearned = data.wordsLearned || 0;
        const wordsStudied = data.wordsStudied || 0;
        const avgMastery = data.averageMastery || 0;
        const quizAvg = data.averageQuizScore || 0;
        
        item.innerHTML = `
          <div class="topic-name">${topicId.replace(/-/g, ' ')}</div>
          <div class="topic-stats">
            <span class="stat">📚 ${wordsStudied} 学过</span>
            <span class="stat">✅ ${wordsLearned} 掌握</span>
            ${quizAvg > 0 ? `<span class="stat">📝 ${quizAvg}%</span>` : ''}
          </div>
          <div class="mastery-bar">
            <div class="mastery-fill" style="width: ${wordsStudied > 0 ? (wordsLearned / wordsStudied * 100) : 0}%"></div>
          </div>
        `;
      }
      container.appendChild(item);
    });
  },

  // Render quiz history (detailed version)
  renderQuizHistory(quizHistory) {
    const container = document.getElementById('quiz-history-list');
    if (!container) return;

    container.innerHTML = '';
    
    if (!quizHistory || quizHistory.length === 0) {
      container.innerHTML = '<p class="no-data">还没有测验记录 / No quiz records yet</p>';
      return;
    }

    // Show last 10 quizzes
    const recentQuizzes = quizHistory.slice(-10).reverse();
    
    recentQuizzes.forEach(quiz => {
      const item = document.createElement('div');
      item.className = 'quiz-history-item';
      const date = new Date(quiz.date || quiz.dateStr).toLocaleDateString();
      const wrongCount = quiz.wrongWords ? quiz.wrongWords.length : 0;
      
      // Color based on score
      let scoreClass = 'score-low';
      if (quiz.percentage >= 90) scoreClass = 'score-high';
      else if (quiz.percentage >= 70) scoreClass = 'score-medium';
      
      item.innerHTML = `
        <div class="quiz-info">
          <span class="quiz-topic">${quiz.topicId.replace(/-/g, ' ')}</span>
          <span class="quiz-date">${date}</span>
        </div>
        <div class="quiz-result">
          <span class="quiz-score ${scoreClass}">${quiz.percentage}%</span>
          <span class="quiz-detail">${quiz.score}/${quiz.totalQuestions}</span>
          ${wrongCount > 0 ? `<span class="wrong-count">❌${wrongCount}</span>` : ''}
        </div>
      `;
      container.appendChild(item);
    });
  }
};

// Export for use in other modules
window.Auth = Auth;


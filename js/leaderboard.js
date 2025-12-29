/**
 * PET Words Adventure - Leaderboard Module
 * Shows ranking of all students
 */

const Leaderboard = {
  // Initialize leaderboard
  init() {
    this.bindEvents();
  },

  // Bind events
  bindEvents() {
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    if (leaderboardBtn) {
      leaderboardBtn.addEventListener('click', () => this.show());
    }

    const closeBtn = document.getElementById('close-leaderboard');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Tab switching
    document.querySelectorAll('.leaderboard-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });
  },

  // Show leaderboard
  async show() {
    const modal = document.getElementById('leaderboard-modal');
    if (modal) {
      modal.style.display = 'flex';
      await this.loadLeaderboard();
    }
  },

  // Hide leaderboard
  hide() {
    const modal = document.getElementById('leaderboard-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  // Load leaderboard data
  async loadLeaderboard() {
    const container = document.getElementById('leaderboard-list');
    if (!container) return;

    container.innerHTML = '<div class="loading">加载中... Loading...</div>';

    try {
      const leaderboard = await DB.getLeaderboard(20);
      this.renderLeaderboard(leaderboard, 'words');
    } catch (error) {
      container.innerHTML = '<div class="error">加载失败 / Failed to load</div>';
    }
  },

  // Render leaderboard
  renderLeaderboard(data, sortBy = 'words') {
    const container = document.getElementById('leaderboard-list');
    if (!container) return;

    if (!data || data.length === 0) {
      container.innerHTML = '<div class="no-data">暂无数据 / No data yet</div>';
      return;
    }

    // Sort data based on tab
    let sortedData = [...data];
    if (sortBy === 'streak') {
      sortedData.sort((a, b) => b.streak - a.streak);
    } else if (sortBy === 'score') {
      sortedData.sort((a, b) => b.averageScore - a.averageScore);
    }

    // Re-rank after sorting
    sortedData = sortedData.map((item, index) => ({ ...item, rank: index + 1 }));

    container.innerHTML = sortedData.map(item => `
      <div class="leaderboard-item ${item.rank <= 3 ? 'top-' + item.rank : ''}">
        <span class="rank">
          ${item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : item.rank}
        </span>
        <span class="name">${item.name}</span>
        <span class="stat">
          ${sortBy === 'words' ? item.wordsLearned + ' 词' : 
            sortBy === 'streak' ? item.streak + ' 天' : 
            item.averageScore + '%'}
        </span>
      </div>
    `).join('');
  },

  // Switch tab
  async switchTab(tab) {
    // Update active tab
    document.querySelectorAll('.leaderboard-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });

    // Reload with new sorting
    const leaderboard = await DB.getLeaderboard(20);
    this.renderLeaderboard(leaderboard, tab);
  }
};

// Export
window.Leaderboard = Leaderboard;


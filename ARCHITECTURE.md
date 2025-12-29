# PET Words Adventure - Architecture Documentation

## 📋 Overview

PET Words Adventure is a Progressive Web App (PWA) designed to help students learn PET (Preliminary English Test) vocabulary through interactive flashcards, quizzes, and memory stories. The app features cloud-based progress tracking and is optimized for offline use.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Database | LeanCloud (China-friendly Firebase alternative) |
| Storage | Cloud (LeanCloud) + LocalStorage (offline backup) |
| Hosting | GitHub Pages |
| Offline | Service Worker (PWA) |
| Speech | Web Speech API (Text-to-Speech) |

---

## 📁 Project Structure

```
words_ai/
├── index.html              # Main HTML (single page app)
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker for offline
│
├── css/
│   ├── styles.css          # Main styles
│   └── animations.css      # CSS animations
│
├── js/
│   ├── app.js              # Main app controller
│   ├── db.js               # LeanCloud database operations
│   ├── auth.js             # User authentication
│   ├── data-loader.js      # Load word data from JSON
│   ├── flashcard.js        # Flashcard learning mode
│   ├── quiz.js             # Quiz mode
│   ├── stories.js          # Memory stories mode
│   ├── library.js          # Word library browser
│   ├── progress.js         # Local progress tracking
│   └── leaderboard.js      # Student rankings
│
├── data/
│   └── words/
│       ├── index.json                    # Topic index
│       ├── clothes-and-accessories.json  # 84 words
│       ├── colours.json                  # 17 words
│       ├── food-and-drink.json          # 157 words
│       └── ... (23 topic files total)
│
├── assets/
│   └── icons/
│       └── icon.svg        # App icon
│
└── docs/
    ├── ARCHITECTURE.md     # This file
    ├── DEPLOY.md           # Deployment guide
    ├── PROJECT_PLAN.md     # Feature roadmap
    └── CHANGELOG.md        # Version history
```

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Flashcard│ │   Quiz   │ │  Stories │ │  Library │           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
└───────┼────────────┼────────────┼────────────┼──────────────────┘
        │            │            │            │
        ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APP CONTROLLER (app.js)                     │
│  • Screen navigation    • Topic selection    • Event routing     │
└─────────────────────────────────────────────────────────────────┘
        │                                      │
        ▼                                      ▼
┌───────────────────────┐          ┌───────────────────────┐
│   DATA LOADER         │          │   DATABASE (db.js)    │
│   (data-loader.js)    │          │                       │
│                       │          │  ┌─────────────────┐  │
│  • Load topic index   │          │  │   LeanCloud     │  │
│  • Load word files    │          │  │   (Cloud)       │  │
│  • Cache JSON data    │          │  └────────┬────────┘  │
└───────────────────────┘          │           │          │
        │                          │  ┌────────▼────────┐  │
        ▼                          │  │  LocalStorage   │  │
┌───────────────────────┐          │  │  (Offline)      │  │
│   JSON FILES          │          │  └─────────────────┘  │
│   /data/words/*.json  │          └───────────────────────┘
└───────────────────────┘
```

---

## 📊 Database Schema (LeanCloud)

### User Table (`_User`)

```javascript
{
  // Identity
  username: "alex",              // Lowercase, unique
  displayName: "Alex",           // Display name
  startDate: "2025-12-29",       // Registration date
  
  // Overall Statistics
  totalWordsLearned: 45,         // Words with masteryLevel >= 2
  currentStreak: 7,              // Consecutive days studied
  longestStreak: 15,             // Best streak ever
  totalDaysStudied: 30,          // Total unique days
  lastStudyStr: "2025-12-29",    // Last study date
  
  // Quiz Statistics
  totalQuizzes: 12,              // Total quizzes taken
  averageScore: 85,              // Average quiz percentage
  
  // Detailed Word Learning (Ebbinghaus Data)
  wordLearning: {
    "clothes-and-accessories_ca-001": {
      topicId: "clothes-and-accessories",
      wordId: "ca-001",
      firstLearned: "2025-12-25",
      lastReviewed: "2025-12-29",
      nextReview: "2026-01-02",      // Calculated by Ebbinghaus curve
      masteryLevel: 2,               // 0=New, 1=Learning, 2=Familiar, 3=Mastered
      reviewCount: 3,
      correctCount: 3,
      incorrectCount: 0,
      history: [
        { date: "2025-12-25", correct: true, masteryLevel: 2 },
        { date: "2025-12-27", correct: true, masteryLevel: 2 },
        { date: "2025-12-29", correct: true, masteryLevel: 3 }
      ]
    }
  },
  
  // Topic Progress Summary
  topicProgress: {
    "clothes-and-accessories": {
      wordsLearned: 45,          // Mastery >= 2
      wordsStudied: 60,          // Total attempted
      averageMastery: 2.1,
      quizzesTaken: 3,
      bestQuizScore: 95,
      averageQuizScore: 82,
      lastStudied: "2025-12-29",
      studyDays: ["2025-12-25", "2025-12-27", "2025-12-29"]
    }
  },
  
  // Quiz History
  quizHistory: [
    {
      topicId: "clothes-and-accessories",
      date: "2025-12-29T10:30:00Z",
      score: 8,
      totalQuestions: 10,
      percentage: 80,
      wrongWords: ["ca-005", "ca-012"]  // For targeted review
    }
  ]
}
```

---

## 🧩 Module Responsibilities

### `app.js` - Main Controller
```
┌─────────────────────────────────────────────┐
│                  app.js                      │
├─────────────────────────────────────────────┤
│ • Initialize application                     │
│ • Screen/view navigation                     │
│ • Topic selection handling                   │
│ • Coordinate between modules                 │
│ • Handle keyboard shortcuts                  │
└─────────────────────────────────────────────┘
```

### `db.js` - Database Operations
```
┌─────────────────────────────────────────────┐
│                   db.js                      │
├─────────────────────────────────────────────┤
│ • LeanCloud initialization                   │
│ • User registration/login                    │
│ • Record word learning (Ebbinghaus)          │
│ • Update topic progress                      │
│ • Record quiz results                        │
│ • Calculate review schedules                 │
│ • Fetch fresh data (online) / cache (offline)│
│ • Data migration for old formats             │
│ • Leaderboard queries                        │
└─────────────────────────────────────────────┘
```

### `auth.js` - Authentication
```
┌─────────────────────────────────────────────┐
│                  auth.js                     │
├─────────────────────────────────────────────┤
│ • Login form handling                        │
│ • User registration                          │
│ • Session management                         │
│ • Update user display in header              │
│ • Profile page rendering                     │
│ • Logout functionality                       │
└─────────────────────────────────────────────┘
```

### `flashcard.js` - Flashcard Learning
```
┌─────────────────────────────────────────────┐
│                flashcard.js                  │
├─────────────────────────────────────────────┤
│ • Load words (unlearned only / all)          │
│ • Card flip animation                        │
│ • Mark word as learned/needs review          │
│ • Sync progress to cloud                     │
│ • Text-to-Speech pronunciation               │
│ • Keyboard navigation                        │
│ • Completion modal with options              │
└─────────────────────────────────────────────┘
```

### `quiz.js` - Quiz Mode
```
┌─────────────────────────────────────────────┐
│                  quiz.js                     │
├─────────────────────────────────────────────┤
│ • Generate multiple choice questions         │
│ • Track correct/wrong answers                │
│ • Record wrong words for review              │
│ • Calculate and display scores               │
│ • Award stars based on performance           │
│ • Sync results to cloud                      │
└─────────────────────────────────────────────┘
```

### `data-loader.js` - Data Loading
```
┌─────────────────────────────────────────────┐
│               data-loader.js                 │
├─────────────────────────────────────────────┤
│ • Load topic index from JSON                 │
│ • Load word files on demand                  │
│ • Cache loaded data in memory                │
│ • Get random words for quiz                  │
└─────────────────────────────────────────────┘
```

### `review.js` - Ebbinghaus Review Mode
```
┌─────────────────────────────────────────────┐
│                 review.js                    │
├─────────────────────────────────────────────┤
│ • Load words due for review (nextReview)     │
│ • Sort by priority (mastery level + overdue) │
│ • Spaced repetition card interface           │
│ • Mark remembered/forgotten                  │
│ • Update review schedule automatically       │
│ • Session statistics tracking                │
│ • Text-to-Speech pronunciation               │
└─────────────────────────────────────────────┘
```

---

## 🎯 Mastery Level System (Classic Ebbinghaus Curve)

### The 6-Level Progression

```
Day 0   Day 1   Day 3   Day 7   Day 14   Day 30
  │       │       │       │        │        │
  ▼       ▼       ▼       ▼        ▼        ▼
┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐
│ 0 │──▶│ 2 │──▶│ 3 │──▶│ 4 │──▶│ 5 │──▶│ 5 │
│NEW│   │FAM│   │CON│   │MAS│   │PER│   │PER│
└───┘   └───┘   └───┘   └───┘   └───┘   └───┘
Learn   1st     2nd     3rd     4th     Long-term
        Review  Review  Review  Review  Memory!
```

### Review Intervals (Classic Ebbinghaus)
| Level | Name | Badge | Review After | Total Days |
|-------|------|-------|--------------|------------|
| 0 | NEW | 🆕 | 1 day | Day 1 |
| 1 | LEARNING | 📖 | 2 days | (retry) |
| 2 | FAMILIAR | 🌱 | 2 days | Day 3 |
| 3 | CONFIDENT | 💪 | 4 days | Day 7 |
| 4 | MASTERED | ⭐ | 7 days | Day 14 |
| 5 | PERMANENT | 👑 | 16 days | Day 30 |

### Flow Diagram

```
                    ┌──────────────────────────────────┐
                    │           LEARN WORD             │
                    │         (Day 0, Level 0)         │
                    └──────────────┬───────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────────┐
                    │       1st REVIEW (Day 1)         │
                    │    Click "记住了" → Level 2      │
                    └──────────────┬───────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
            ┌───────────────┐             ┌───────────────┐
            │  ✅ Correct   │             │  ❌ Forgot    │
            │  Level → 3    │             │  Level → 1    │
            │  Next: +4 days│             │  Next: +2 days│
            └───────┬───────┘             └───────┬───────┘
                    │                             │
                    ▼                             ▼
            ┌───────────────┐             ┌───────────────┐
            │  2nd REVIEW   │             │  Retry Review │
            │  (Day 7)      │             │  (Sooner)     │
            └───────────────┘             └───────────────┘
                    │
                    │ (continue pattern)
                    ▼
            ┌───────────────────────────────────────────┐
            │  Level 5 (PERMANENT) - Long-term Memory!  │
            │  Review every 16-30 days for maintenance  │
            └───────────────────────────────────────────┘
```

### Forgetting Penalty
| Current Level | If Forgot | Drop To | Rationale |
|--------------|-----------|---------|-----------|
| 2 (Familiar) | -1 | 1 (Learning) | Needs more practice |
| 3 (Confident) | -2 | 1 (Learning) | Overestimated memory |
| 4 (Mastered) | -2 | 2 (Familiar) | Back to shorter intervals |
| 5 (Permanent) | -2 | 3 (Confident) | Refresh needed |

### Ebbinghaus Review Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                    EBBINGHAUS REVIEW SYSTEM                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Day 1: Learn word → masteryLevel = 2, nextReview = Day 5        │
│                                                                  │
│  Day 5: Review due! Word appears in Review Mode                  │
│         │                                                        │
│         ├─→ "记住了" (Correct)                                   │
│         │   • masteryLevel → 3 (MASTERED)                        │
│         │   • nextReview → Day 12 (7 days later)                 │
│         │                                                        │
│         └─→ "忘记了" (Forgot)                                    │
│             • masteryLevel → 1 (LEARNING)                        │
│             • nextReview → Day 7 (2 days later)                  │
│             • Word added to end of review queue                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Review Mode Features
- **Smart Queue**: Words sorted by priority (lower mastery + more overdue first)
- **Session Stats**: Track correct/wrong counts and accuracy percentage
- **Visual Feedback**: Mastery badges and "days since last review" indicator
- **Curve Visualization**: Shows the Ebbinghaus forgetting curve concept
- **Auto-Queue**: Forgotten words are re-added to the end of the queue

### Home Screen Review Card (Always Visible)
The review card on the home screen displays one of three states:

```
┌─────────────────────────────────────────────────────────────────┐
│                    REVIEW CARD STATES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STATE 1: PENDING REVIEWS (Pink, Pulsing Animation)             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🧠  艾宾浩斯复习                                    → │    │
│  │     你有 5 个单词需要复习                              │    │
│  │     💡 及时复习，记得更牢！                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  STATE 2: NO REVIEWS TODAY (Green, Success)                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🎉  艾宾浩斯复习                                    ✓ │    │
│  │     ✅ 太棒了！今天不用复习                            │    │
│  │     💡 下次复习: 1月2日                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  STATE 3: NO WORDS LEARNED YET (Purple, Default)                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 📚  艾宾浩斯复习                                    → │    │
│  │     开始学习，积累复习单词！                           │    │
│  │     💡 学习后会自动安排复习计划                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| State | Condition | Icon | Color | Message |
|-------|-----------|------|-------|---------|
| Pending | `dueCount > 0` | 🧠 | Pink (pulsing) | "你有 X 个单词需要复习" |
| Complete | `dueCount = 0` + has learned words | 🎉 | Green | "太棒了！今天不用复习" + next date |
| New User | No words learned yet | 📚 | Purple | "开始学习，积累复习单词！" |

---

## 🔄 Data Sync Strategy

### Online Mode
```
User Action (e.g., "记住了")
         │
         ▼
┌─────────────────────────┐
│ Update local user object│
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ await user.save()       │  ───▶ LeanCloud Cloud
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Update UI immediately   │
└─────────────────────────┘
```

### Page Refresh (Online)
```
Page Load
    │
    ▼
┌─────────────────────────┐
│ navigator.onLine = true │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│ await user.fetch()      │  ◀─── LeanCloud Cloud
│ (Get fresh data)        │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│ Render UI with fresh    │
│ cloud data              │
└─────────────────────────┘
```

### Offline Mode
```
Page Load (No Network)
    │
    ▼
┌─────────────────────────┐
│ navigator.onLine = false│
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│ Use cached user object  │  ◀─── LocalStorage/Memory
│ (Last known state)      │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│ Render UI with cached   │
│ data                    │
└─────────────────────────┘
```

---

## 📱 PWA Features

### Service Worker (`sw.js`)
- Caches all static assets (HTML, CSS, JS, JSON)
- Enables offline functionality
- Cache versioning for updates

### Manifest (`manifest.json`)
- App name and icons
- Theme colors
- Display mode (standalone)
- Start URL

### Installation
- Add to Home Screen on iOS/Android
- Runs like native app
- Works offline

---

## 🎨 UI/UX Architecture

### Screens
```
┌─────────────────────────────────────────────┐
│                 LOGIN SCREEN                 │
│  • Username input                            │
│  • Auto-register new users                   │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│                 HOME SCREEN                  │
│  • 🧠 Ebbinghaus Review Card (always visible)│
│  • Topic grid (23 topics)                    │
│  • Progress bars per topic                   │
│  • User stats in header                      │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│                TOPIC SCREEN                  │
│  • Topic info and progress                   │
│  • Learning mode buttons:                    │
│    - Flashcards                              │
│    - Memory Stories                          │
│    - Quiz                                    │
│    - Word Library                            │
│    - Review (Ebbinghaus)                     │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┬───────────┐
        ▼           ▼           ▼           ▼
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│ FLASHCARD │ │   QUIZ    │ │  LIBRARY  │ │  REVIEW   │
│  SCREEN   │ │  SCREEN   │ │  SCREEN   │ │  SCREEN   │
└───────────┘ └───────────┘ └───────────┘ └───────────┘
```

---

## 🔐 Security

- **Password**: Auto-generated from username (simple for kids)
- **ACL**: Read/write access controlled per user
- **No sensitive data**: Only learning progress stored
- **Case-insensitive login**: Username normalized to lowercase

---

## 🚀 Future Enhancements (Planned)

1. ~~**Smart Review Mode** - Auto-select words due for review~~ ✅ COMPLETED
2. **Spaced Repetition Notifications** - Remind to review
3. **Matching Game** - Word-meaning matching
4. **Spelling Bee** - Type the word from audio
5. **Progress Charts** - Visual learning analytics
6. **Parent Dashboard** - Monitor child's progress
7. **Multiple Languages** - Support other word lists

---

## 📝 Version History

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.

---

## 🛠️ Development

### Local Development
```bash
# Start local server
python3 -m http.server 8080

# Open in browser
open http://localhost:8080
```

### Deployment
See [DEPLOY.md](./DEPLOY.md) for GitHub Pages deployment instructions.

---

## 📚 Word Data Format

Each topic JSON file follows this structure:

```json
{
  "topic": {
    "id": "clothes-and-accessories",
    "name": "Clothes and Accessories",
    "nameChinese": "衣服与饰品",
    "icon": "👔",
    "wordCount": 84
  },
  "words": [
    {
      "id": "ca-001",
      "english": "backpack",
      "chinese": "背包",
      "example": "I carry my books in my backpack.",
      "exampleChinese": "我用背包装书。"
    }
  ],
  "stories": [
    {
      "title": "Shopping Day",
      "story": "Mom wore her new blouse and jacket...",
      "storyChinese": "妈妈穿着她的新女衬衫和夹克...",
      "words": ["blouse", "jacket", "belt", "boots"]
    }
  ]
}
```

---

*Last Updated: December 29, 2025*


# PET Words Learning App - Project Plan

> A fun, engaging vocabulary learning app for 10-year-old students studying PET (Preliminary English Test)

## 📋 Project Overview

| Item | Details |
|------|---------|
| **Target User** | 10-year-old student |
| **Total Words** | ~3400 PET vocabulary words |
| **Organization** | By topic (Clothes, Food, Travel, etc.) |
| **Platform** | Web browser (single device) |
| **Tech Stack** | Pure HTML/CSS/JavaScript |
| **Data Storage** | localStorage for progress |

---

## 🎯 Version Roadmap

### Version 1.0 - MVP (Minimum Viable Product) ✅ COMPLETED
**Goal:** Basic flashcard learning with one topic

- [x] Project structure setup
- [x] Beautiful, kid-friendly UI design
- [x] Load words from JSON data file
- [x] Flashcard mode (flip to reveal translation)
- [x] Basic progress tracking (learned/not learned)
- [x] First topic: "Clothes and Accessories" (70 words)
- [x] **Memory Stories** - Funny sentences using multiple words from the topic
- [x] Quiz mode with multiple choice
- [x] Keyboard shortcuts support
- [x] Responsive mobile design

### Version 1.1 - Enhanced Word Data ✅ COMPLETED
**Goal:** Richer word information for better learning

- [x] Pronunciation audio using Web Speech API
- [x] Example sentences (English + Chinese) for each word
- [x] "Listen" button on flashcards
- [x] Example sentence display on flashcards

### Version 1.2 - Quiz Enhancements
**Goal:** More quiz options

- [ ] Quiz direction toggle (English → Chinese / Chinese → English)
- [ ] Sentence completion quiz
- [ ] Listening quiz (hear word, select meaning)

### Version 1.2 - Spaced Repetition
**Goal:** Smart learning algorithm

- [ ] Track memory strength per word (1-5 stars)
- [ ] Spaced repetition scheduling
- [ ] "Words to Review" section
- [ ] Daily learning goals

### Version 1.3 - Gamification
**Goal:** Make learning fun!

- [ ] Matching game (drag & drop)
- [ ] Spelling bee mode
- [ ] Streak counter (consecutive days)
- [ ] Achievement badges
- [ ] Sound effects

### Version 1.4 - More Topics
**Goal:** Expand vocabulary coverage

- [ ] Add more PET topics from uploaded images
- [ ] Topic selection menu
- [ ] Progress per topic
- [ ] Overall completion percentage

### Version 2.0 - Advanced Features
**Goal:** Polish and enhance

- [ ] Export/Import progress (JSON backup)
- [ ] Parent dashboard (view statistics)
- [ ] Pronunciation audio (optional)
- [ ] Dark mode toggle
- [ ] Mobile-responsive design improvements

---

## 🏗️ Technical Architecture

```
words_ai/
├── index.html              # Main entry point
├── PROJECT_PLAN.md         # This file - project tracking
├── CHANGELOG.md            # Version history
├── css/
│   ├── styles.css          # Main styles
│   ├── animations.css      # Fun animations
│   └── themes.css          # Color themes
├── js/
│   ├── app.js              # Main application controller
│   ├── data-loader.js      # Load and manage word data
│   ├── flashcard.js        # Flashcard mode logic
│   ├── quiz.js             # Quiz mode logic
│   ├── game.js             # Matching game logic
│   ├── progress.js         # Progress & spaced repetition
│   └── ui.js               # UI utilities & animations
├── data/
│   └── words/
│       ├── index.json      # Topic index/metadata
│       └── clothes-and-accessories.json  # First topic
└── assets/
    ├── images/             # Icons, badges, etc.
    └── sounds/             # Sound effects (future)
```

---

## 🎨 Design Principles

### For a 10-year-old user:
1. **Bright, cheerful colors** - Not too childish, but engaging
2. **Large touch targets** - Easy to tap/click
3. **Instant feedback** - Animations for correct/wrong answers
4. **Encouraging messages** - "Great job!", "Keep going!", "Almost there!"
5. **Visual progress** - Stars, progress bars, celebrations
6. **Simple navigation** - Maximum 2 clicks to start learning

### Color Palette (Initial)
- Primary: `#4ECDC4` (Teal) - Calm but energetic
- Secondary: `#FF6B6B` (Coral) - For highlights/wrong answers
- Success: `#95E1A3` (Mint Green) - Correct answers
- Background: `#F7F9FC` (Light gray-blue)
- Text: `#2D3436` (Dark gray)

---

## 🎭 Memory Stories Feature

### What is it?
Funny, silly sentences/stories that contain **as many vocabulary words as possible** from each topic. This technique helps children remember words by:
- Creating vivid mental images
- Making learning fun through humor
- Connecting related words together
- Using context to reinforce meaning

### How it works in the app:
1. Each topic has 3-5 funny "Memory Stories"
2. Stories highlight the vocabulary words (bold/colored)
3. Kids can click on highlighted words to see the Chinese meaning
4. Optional: Read-aloud feature with word highlighting

### Example (Clothes & Accessories):
> "Grandma's **fashion** disaster: She wore a **cotton** **blouse** with a huge **collar**, **silk** **pants**, **leather** **boots**, and a **raincoat** - to the swimming pool! She tried to **put on** her **swimsuit** over her **clothes**, but it didn't **fit**. Her **handbag** was stuffed with **jewellery**: **earrings**, a **necklace**, **bracelets**, and **rings**. 'Don't forget your **sunglasses** and **hat**!' said grandpa, holding up her **scarf** and **gloves**. 'But it's summer!' she yelled, trying to **fold** her **sweater** into her **backpack**."

---

## 📊 Data Structure

### Word Entry Format
```json
{
  "id": "clothes-001",
  "english": "backpack",
  "chinese": "背包",
  "example": "I put my books in my backpack.",
  "exampleChinese": "我把书放进背包里。",
  "topic": "clothes-and-accessories",
  "difficulty": 1,
  "notes": ""
}
```

### Memory Story Format
```json
{
  "id": "story-1",
  "title": "Grandma's Pool Party Disaster",
  "titleChinese": "奶奶的泳池派对灾难",
  "story": "Grandma wanted to be {fashion} for the pool party...",
  "storyChinese": "奶奶想在泳池派对上展示{时尚}...",
  "wordsUsed": ["fashion", "put on", "old-fashioned", ...],
  "wordCount": 29
}
```
Note: Words in `{curly braces}` are vocabulary words that will be highlighted in the UI.

### Progress Entry Format (localStorage)
```json
{
  "wordId": "clothes-001",
  "learned": true,
  "correctCount": 5,
  "wrongCount": 1,
  "lastReviewed": "2024-12-26T10:30:00Z",
  "nextReview": "2024-12-28T10:30:00Z",
  "memoryStrength": 3
}
```

---

## 📝 Development Log

### 2024-12-26 - Version 1.0 Released 🎉
- **COMPLETED:** Full working app with all core features
- Created beautiful, kid-friendly UI with animated backgrounds
- Implemented Flashcard mode with flip animation
- Implemented Memory Stories mode with word highlighting
- Implemented Quiz mode with multiple choice
- Added progress tracking with localStorage
- Added streak counter and star rewards
- First topic: Clothes and Accessories (70 words, 4 stories)

### 2024-12-26 - Project Initialization
- Created project plan
- Extracted first word list from image: **Clothes and Accessories (70 words)**
- Set up project structure

---

## 🖼️ Words Extracted from Images

### Topic 1: Clothes and Accessories (衣服与饰品) - 70 words
**Source:** User uploaded image
**Status:** ✅ Extracted

| # | English | Chinese |
|---|---------|---------|
| 1 | backpack | 背包 |
| 2 | bag | 包 |
| 3 | belt | 腰带 |
| 4 | blouse | 女衬衫 |
| 5 | boot | 靴子 |
| 6 | bracelet | 手镯 |
| 7 | button | 纽扣 |
| 8 | cap | (单沿儿)帽子 |
| 9 | chain | (用作首饰的)链子 |
| 10 | clothes | 衣服 |
| 11 | coat | 外套 |
| 12 | collar | 衣领 |
| 13 | cotton | 棉布的 |
| 14 | dress | 连衣裙 |
| 15 | earring | 耳环 |
| 16 | fashion | 时尚 |
| 17 | fasten | 系上 |
| 18 | fit | 合身 |
| 19 | fold | 折叠 |
| 20 | glasses | 眼镜 |
| 21 | glove | 手套 |
| 22 | go (with/together) | 搭配 |
| 23 | handbag | 手提包 |
| 24 | handkerchief | 手帕 |
| 25 | hat | 帽子 |
| 26 | jacket | 夹克 |
| 27 | jeans | 牛仔裤 |
| 28 | jewellery | 珠宝 |
| 29 | jumper | 毛衣 |
| 30 | kit | 全套服装 |
| 31 | knit | 编织 |
| 32 | label | 标签 |
| 33 | laundry | 需要洗的脏衣服 |
| 34 | leather | 皮革 |
| 35 | make-up | 化妆 |
| 36 | match | 搭配 |
| 37 | material | 材质 |
| 38 | necklace | 项链 |
| 39 | old-fashioned | 老式的 |
| 40 | pants | 裤子 |
| 41 | pattern | 图案 |
| 42 | perfume | 香水 |
| 43 | plastic | 塑料 |
| 44 | pocket | 口袋 |
| 45 | pullover | 套头毛衣 |
| 46 | purse | 坤包 |
| 47 | put on | 穿上 |
| 48 | raincoat | 雨衣 |
| 49 | ring | 戒指 |
| 50 | sandal | 凉鞋 |
| 51 | scarf | 围巾 |
| 52 | shirt | 衬衫 |
| 53 | shoe | 鞋子 |
| 54 | shorts | 短裤 |
| 55 | silk | 丝绸 |
| 56 | size | 大小 |
| 57 | skirt | 短裙 |
| 58 | sleeve | 袖子 |
| 59 | sleeveless | 无袖的 |
| 60 | socks | 短袜 |
| 61 | stripe | 条纹 |
| 62 | suit | 西服 |
| 63 | sunglasses | 太阳镜 |
| 64 | sweater | 毛衣 |
| 65 | sweatshirt | 厚运动衫 |
| 66 | swimming costume | 泳装 |
| 67 | swimsuit | 泳装 |
| 68 | take off | 脱掉 |
| 69 | tie | 领带 |
| 70 | tights | 紧身裤袜 |

---

## ✅ Next Steps

1. **Approve this plan** - Let me know if you want any changes
2. **Start Version 1.0** - Build the MVP with flashcard mode
3. **Upload more images** - I'll extract words and add to new topics

---

## 💬 Notes & Decisions

- Single device (localStorage) confirmed ✅
- Topics will be added incrementally as images are provided
- Focus on making it FUN first, then add advanced features


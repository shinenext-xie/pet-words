# 📱 Deploy PET Words Adventure to iPad

This guide will help you deploy the app so your son can use it on his iPad.

---

## 🚀 Option 1: GitHub Pages (Recommended - FREE & Easy)

### Step 1: Create a GitHub Account
If you don't have one, go to [github.com](https://github.com) and sign up.

### Step 2: Create a New Repository
1. Click the **+** button in the top right → **New repository**
2. Name it: `pet-words` (or any name you like)
3. Make it **Public** (required for free GitHub Pages)
4. Click **Create repository**

### Step 3: Upload the Project Files
**Option A: Using GitHub Desktop (Easier)**
1. Download [GitHub Desktop](https://desktop.github.com/)
2. Clone your new repository
3. Copy all files from `words_ai` folder into the cloned folder
4. Commit and push

**Option B: Using Command Line**
```bash
cd /Users/jinjingxie/work/words_ai
git init
git add .
git commit -m "Initial commit - PET Words Adventure"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pet-words.git
git push -u origin main
```

### Step 4: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** (gear icon)
3. Scroll down to **Pages** in the left sidebar
4. Under "Source", select **main** branch
5. Click **Save**
6. Wait 1-2 minutes, then your site will be live at:
   ```
   https://YOUR_USERNAME.github.io/pet-words/
   ```

### Step 5: Add to iPad Home Screen
1. Open **Safari** on the iPad
2. Go to your GitHub Pages URL
3. Tap the **Share** button (square with arrow)
4. Scroll down and tap **"Add to Home Screen"**
5. Give it a name like "PET Words"
6. Tap **Add**

Now your son can tap the icon and use it like a native app! 🎉

---

## 🏠 Option 2: Local Network (For Testing)

If you want to test before deploying online:

### On Your Computer:
```bash
cd /Users/jinjingxie/work/words_ai

# Using Python (macOS has it built-in)
python3 -m http.server 8080

# Or using Node.js
npx serve -l 8080
```

### On iPad:
1. Make sure iPad is on the **same WiFi** network as your computer
2. Find your computer's IP address:
   - Mac: System Preferences → Network → Your IP (e.g., 192.168.1.100)
3. Open Safari on iPad
4. Go to: `http://YOUR_COMPUTER_IP:8080`
   - Example: `http://192.168.1.100:8080`

⚠️ **Note:** This only works when iPad is on the same network. For use anywhere, use GitHub Pages (Option 1).

---

## ☁️ Option 3: Other Free Hosting Services

### Netlify (Very Easy)
1. Go to [netlify.com](https://www.netlify.com/)
2. Sign up with GitHub
3. Drag and drop your `words_ai` folder
4. Get your free URL instantly!

### Vercel
1. Go to [vercel.com](https://vercel.com/)
2. Import from GitHub
3. Deploy with one click

---

## 📲 iPad Tips for Best Experience

### Enable "Add to Home Screen" as PWA
When added to the home screen from Safari:
- ✅ Opens in full screen (no browser bars)
- ✅ Works offline after first load
- ✅ Feels like a native app
- ✅ Has a nice app icon

### Recommended iPad Settings
1. **Screen Time**: Consider whitelisting the app if you use Screen Time
2. **Do Not Disturb**: Enable while studying for fewer distractions
3. **Volume**: Make sure device isn't muted for pronunciation sounds

### Offline Usage
After the first visit, the app caches all data. Your son can:
- Use all flashcards offline
- Take quizzes offline
- Read memory stories offline
- Progress is saved locally on the iPad

---

## 🔄 Updating the App

When you add new words or features:

### If Using GitHub Pages:
```bash
cd /Users/jinjingxie/work/words_ai
git add .
git commit -m "Added new words"
git push
```
The update will be live in 1-2 minutes!

### On iPad:
1. Open the app in Safari (not from home screen)
2. Pull down to refresh
3. This clears the old cache and loads new content

---

## ❓ Troubleshooting

### App won't load offline
- Make sure you visited the app at least once while online
- Try closing and reopening the app

### Sound doesn't work
- Check iPad is not on silent mode (side switch)
- Check the volume is turned up
- Some voices need internet for first-time download

### Old content showing
- Open in Safari, clear website data:
  Settings → Safari → Clear History and Website Data
- Or in Safari: hold refresh button → "Reload Without Content Blockers"

---

## 📊 Current App Stats

- **Total Words:** 1,824
- **Topics:** 23
- **Features:** Flashcards, Quiz, Memory Stories, Word Library
- **Pronunciation:** Built-in text-to-speech

---

Happy Learning! 🎓📚

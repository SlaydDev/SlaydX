# 🛡️ SlaydX Browser

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/Version-Alpha_1.0.0-cyan.svg)]()

**SlaydX** is a next-generation web browser built from the ground up for power users. While modern browsers have become bloated and restrictive, SlaydX prioritizes a "no-skip" feature philosophy: if a power user needs it, we build it.

Built using **Node.js**, **Electron**, and **React**, SlaydX combines the raw power of the Chromium engine with a highly customizable, modern UI.

---

## 🚀 Key Features

* **Core Foundation**: Robust session persistence and crash recovery.
* **Pro Tab Management**: Tab grouping, pinning, and "Sleep Mode" to save RAM.
* **Omnibox Commands**: Use the address bar to trigger browser actions (e.g., `set:theme dark`).
* **Privacy Shield**: Built-in tracking protection and third-party block controls.
* **Extensibility**: A dedicated framework for custom add-ons and UI themes.
* **Internal Protocols**: Fast access to `slaydx://settings`, `slaydx://extensions`, and more.

---

## 🛠️ Development Setup

To begin working on SlaydX, you will need [Node.js](https://nodejs.org/) and [Git](https://git-scm.com/) installed on your machine.

### 1. Clone the Repository
```bash
git clone [https://github.com/SlaydDev/SlaydX.git](https://github.com/YOUR_USERNAME/SlaydX.git)
cd SlaydX
2. Install Dependencies
Bash
npm install
3. Run the App
Bash
# Runs the app in development mode
npm start
```
### 📂 Project Structure
```
/src/main.js: The Electron Main process (handles windows, system events).

/src/renderer/: The React-based UI layer (Tabs, Address bar, Settings pages).

/src/preload.js: The bridge between the web pages and Node.js.

/assets/: Icons, themes, and static images.
```
## 🤝 How to Contribute
We love contributors! Whether you're fixing a bug, building a massive new feature, or helping to triage bugs, here is how **you** can get your code (or support!) into the project:

### 1. Fork and Clone
Click the Fork button at the top of the repository to create your own copy.You can fork the repository [here.](https://github.com/SlaydDev/SlaydX/fork/)

### 2. Create a Feature Branch
Always work on a new branch so your main stays clean.

### 3. Make Your Edits
Follow our coding standards:

- Use functional React components.

- Keep the UI consistent with the SlaydX "Glassmorphism" theme.

- Document new features in the /docs folder.

### 4. Commit and Push (Git)
``` Bash
git add .
git commit -m "feat: add amazing new feature"
git push origin feature/amazing-new-feature
```
### 5. Open a Pull Request (PR)
Go to the original SlaydX repository on GitHub. You will see a prompt to "Compare & pull request." Describe your changes clearly and submit!

## 📜 License
SlaydX is open-source software licensed under the [MIT License](https://mit-license.org/). You are free to fork and modify it.

## 📞 Community & Feedback
Found a bug? Open an [Issue](https://github.com/SlaydDev/SlaydX/issues)

Want to chat? Join our Community! (Link coming soon!)

asdasd
lol
123123

`Developed with ❤️ by the SlaydX Community.`

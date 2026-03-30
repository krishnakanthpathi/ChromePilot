# ChromePilot

A powerful Chrome Extension that supercharges your coding experience by bringing a modern Command Palette and an intelligent inline AI Auto-Suggest (Ghost Text) directly into the LeetCode Monaco editor.

## ✨ Features

🤖 **AI Auto-Suggestion (Ghost Text)**
- **Intelligent Context:** Analyzes your current code snippet and intelligently predicts the next sequence with identical indentation patterns.
- **Trigger via Comment:** Type a comment (e.g. `// implement binary search`) and hit `Enter` to immediately generate a customized, context-aware functional completion.
- **Idle Detection:** Stop typing for 5 seconds, and it will automatically offer a logic-based continuation exactly at your cursor.
- **Inline Ghost Text:** Displays the suggested completion aesthetically identical to your editor configurations.
- **Accept/Dismiss:** Simply press `Tab` to accept the phantom text directly into your code matrix, or keep coding/click away to dismiss.

🚀 **Command Palette**
- **Fluid Access:** Launch anywhere on LeetCode using `Cmd + K` (Mac) or `Ctrl + K` (Windows/Linux).
- **Inject Snippets:** Instantly search through pre-configured boilerplate and custom algorithms and safely drop them into the Monaco editor.
- **AI Targeting:** Type `ai <your prompt>` directly into the palette to build specific code blocks on demand.

---

## 💻 Installation

### Developer Setup 

1. Clone this repository to your local machine.
2. Install the required Node dependencies:
   ```bash
   npm install
   ```
3. Compile and bundle the production extension:
   ```bash
   npm run build
   ```
4. Load the extension into your browser:
   - Navigate to `chrome://extensions` in Chrome.
   - Enable **Developer mode** via the toggle in the top right.
   - Click **Load unpacked** on the action bar.
   - Select the `dist` folder populated by the Webpack build sequence.

---

## ⚙️ AI Configuration

To leverage the AI features, you must securely bind your API keys locally.

1. Launch the **Command Palette** (`Cmd + K` / `Ctrl + K`) on any active LeetCode problem.
2. Select **⚙️ AI Settings** situated at the bottom right corner.
3. Choose your preferred generative core (**OpenAI** or **Google Gemini**).
4. Securely enter your **API Key** (stored locally inside `chrome.storage`).
5. *(Optional)* Target a precise model string by entering a **Model Name** (e.g., `gpt-4o-mini`, `gemini-2.5-flash`).
6. Finalize by clicking **Save Settings**.

---

## 🛠 Tech Stack
- **React 18** for natively-rendered DOM overlays.
- **TypeScript** for rock-solid object structures and strict typings.
- **Webpack 5** to powerfully bundle and compile logic streams directly into secure Chrome contexts.

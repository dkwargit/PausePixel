# PausePixel

**PausePixel** is a modern, high-precision video screenshot extraction tool built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**. It runs a hardware-accelerated **in-browser extraction engine** using the HTML5 Canvas API and WebCodecs, allowing frame-accurate screenshot capture from video files of any size without uploading them to a remote server.

Designed for **instant 1-click deployment on Vercel**, Netlify, or Cloudflare Pages with **zero backend server costs** and **100% data privacy**.

---

## 🚀 Key Features

- **In-Browser Hardware Acceleration**: Decodes frames locally using the browser's video & canvas engine. Handles multi-gigabyte 4K videos with zero upload lag.
- **Vercel & Serverless Ready**: Completely bypasses serverless upload payload limits (e.g., Vercel's 4.5MB limit) and function timeouts.
- **100% Private & Local**: Video data never leaves the user's browser. Safe for confidential and private video processing.
- **Interactive Video Player & Scrubber**: Scrub through videos in real time with quick-action buttons:
  - **📍 Set as Start Time**
  - **🏁 Set as End Time**
  - **📷 Snap Current Frame** (instant single-screenshot capture)
- **Custom Intervals & Format Selector**: Export frames as **JPEG**, **PNG (Lossless)**, or **WebP** with preset interval chips (`0.5s`, `1.0s`, `2.0s`, `5.0s`, `10.0s`).
- **Real-Time Progress HUD**: Animated laser scanline progress bar with live counter metrics (extracted count, current frame, target frame, engine FPS).
- **Client-Side ZIP Batch Export**: Bundles and compresses all extracted screenshots into a single `.zip` file using `JSZip` directly in browser memory.
- **Full-Resolution Lightbox**: High-resolution image viewer with keyboard navigation (`←`, `→`, `Escape`) and single-image downloads.
- **Humorous Error Handling**: Includes custom interactive error modals (`mb_mock.png` and unamused emoji) when video inputs or timing bounds are missing.

---

## 🛠️ Modern Tech Stack

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) + Custom Glassmorphic Design System
- **Icons**: [Lucide React](https://lucide.dev/)
- **Archiving**: [JSZip](https://stuk.github.io/jszip/)
- **FX**: [Canvas Confetti](https://github.com/catdad/canvas-confetti)
- **Deployment**: [Vercel](https://vercel.com/) (Preset: Vite)

---

## 📂 Project Structure

```
PausePixel/
├── public/                 # Static assets & icons
│   ├── assets/             # Meme & emoji graphics
│   └── favicon.jpeg
├── src/
│   ├── components/         # Modular React components
│   │   ├── Header.tsx      # Branding & feature pills
│   │   ├── DropZone.tsx    # Drag-and-drop video upload zone
│   │   ├── VideoScrubber.tsx # Interactive player with scrubber
│   │   ├── TimingControls.tsx# Start/end/interval inputs & format selection
│   │   ├── ProgressHUD.tsx # Real-time extraction progress HUD
│   │   ├── Gallery.tsx     # Screenshots masonry grid & ZIP download
│   │   ├── Lightbox.tsx    # Full-screen image viewer with keyboard controls
│   │   ├── ErrorModal.tsx  # Interactive error dialog
│   │   └── Toast.tsx       # Floating notification toasts
│   ├── utils/
│   │   ├── videoExtractor.ts # In-browser frame extraction engine
│   │   ├── zipArchiver.ts  # Client-side ZIP creation using JSZip
│   │   └── formatters.ts   # Time and byte formatting helpers
│   ├── types.ts            # TypeScript interfaces
│   ├── App.tsx             # Root application component
│   ├── index.css           # Tailwind CSS directives & glow utilities
│   └── main.tsx            # React application entrypoint
├── index.html              # Vite entrypoint with Google Fonts
├── package.json            # Node.js dependencies & scripts
├── tailwind.config.js      # Tailwind design configuration
├── tsconfig.json           # TypeScript configuration
├── vercel.json             # Vercel deployment configuration
└── vite.config.ts          # Vite build configuration
```

---

## ⚙️ Development & Local Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open **http://localhost:3000** in your browser.

### 3. Production Build
```bash
npm run build
```
Build output is generated in the `dist/` directory.


---

## 👤 Author
Made by **Divyanshu Kumar** ([@dkwargit](https://github.com/dkwargit)).

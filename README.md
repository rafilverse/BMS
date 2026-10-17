# 🛡️ VoiceShield (aka ConsentGuard) — AI Voice Safety Copilot
> **UNCLONE AI Hackathon** (B.M.S. College of Engineering × DetectifAI)  
> **Track 03:** UNCLONE AGENTS  
> **Mission:** Intercepting coercive voice calls, fake authority "digital arrest" scams, and AI-cloned family extortion before victims comply.

---

## 🎯 Executive Summary
**VoiceShield** (aka **ConsentGuard**) is a voice-first AI safety agent that uses **DetectifAI's** deepfake detection (**Aletheia**) and speaker verification (**Eidos**) APIs along with **Google Gemini** to intercept coercive phone calls (fake police "digital arrest" scams, relative road accident/hospital extortions, or bogus online medical exam sextortion). 

VoiceShield listens to suspicious calls, checks each audio segment for AI-generated synthetic speech and enrolled voiceprint continuity, and immediately equips the victim with a calm, firm, protective de-escalating response spoken aloud using **Google Gemini Studio Voice** (`gemini-3.8-flash-tts`).

---

## 🚨 Real Indian Cases Targeted & Built In

VoiceShield directly tackles documented scam vectors that have cost Indian citizens lakhs of rupees and severe psychological trauma:

1. **Hyderabad Nephew Scam (Jan 2026)**:
   - *Case*: A 59-year-old woman received an urgent call from an AI clone of her nephew in Punjabi claiming a road accident and emergency surgery. She lost ₹1.4 lakh to a QR-code transfer before realizing the voice was synthetic.
   - *VoiceShield Mitigation*: DetectifAI Aletheia flags the synthetic audio artifacts (`verdict: fake`); VoiceShield interrupts payment and instructs the user to call back on the known family number.
2. **Indore Police Cousin Scam (Jan 2026)**:
   - *Case*: Schoolteacher Smita received a call from her UP Police cousin's cloned voice demanding ₹97,500 for a friend's ICU heart attack. Confirmed as MP's first AI voice fraud case.
   - *VoiceShield Mitigation*: Detects synthetic audio and prompts family phone verification before any UPI scan.
3. **Bengaluru Fake CBI "Digital Arrest" (Apr 2024)**:
   - *Case*: A 29-year-old woman lawyer was held in a 2-day virtual hostage Skype call by fraudsters posing as Mumbai Cyber Crime/CBI officers claiming a FedEx parcel of drugs was linked to her Aadhaar. Extorted for ₹10.79 lakh and coerced on camera.
   - *VoiceShield Mitigation*: Detects synthetic call artifacts and flags fake authority coercion (`POL-01`), immediately alerting: *"Real law enforcement NEVER conducts digital arrests over video calls. Hang up and dial 1930."*
4. **Bengaluru Bogus "Medical Exam" Sextortion (Jul 2025)**:
   - *Case*: Two women were subjected to a 9-hour WhatsApp video call, extorted for ₹58,447, and coerced into undressing for a bogus "medical exam" to identify moles and tattoos.
   - *VoiceShield Mitigation*: Intercepts coercion (`POL-02`), immediately advising victim: *"DO NOT COMPLY. Terminate call immediately and cover camera."*

---

## 🌟 Key Architecture & Capabilities

1. **🎙️ Real-Time Voice Activity & Waveform Sensor**:
   - Captures 16kHz audio from the browser microphone with live HTML5 Canvas oscilloscope.
   - Automatic silence detection and sliding-window slicing for low-latency analysis.
2. **🛡️ DetectifAI Production API Dual Verification**:
   - **Aletheia Deepfake Detection** (`POST /v1/deepfake/detect`): Returns `verdict` (`real`/`fake`/`not_sure`), synthetic `score`, and threshold (~0.62).
   - **Eidos Speaker Verification** (`POST /v1/speakers/verify`): Evaluates biometric cosine similarity against enrolled trusted voiceprints.
   - **Temporal Rolling Biometric Window**: 4-chunk moving average to smooth conversational syllable variation and eliminate jitter.
3. **🧠 Gemini AI Safety Reasoning**:
   - Evaluates conversational transcripts against VoiceShield safety policies (Digital Arrest, Sextortion/Medical Coercion, Relative Emergency QR, and Bank OTP Drain).
   - Generates protective, firm, and de-escalating verbal countermeasure scripts.
4. **🔊 Natural Gemini Studio Voice (`gemini-3.8-flash-tts`)**:
   - Replaces computerish browser speech synthesis with Google's state-of-the-art 24kHz natural human voice (`Kore` / `Puck`) to deliver reassuring, crystal-clear spoken advice.
5. **🛠️ Developer Forensic Telemetry Drawer**:
   - Full transparency: displays raw cosine similarity, DetectifAI decision, synthetic probability percentage, API latency, remaining credit balance, and verbatim DetectifAI JSON.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
```env
PORT=3850
GEMINI_API_KEY=your_gemini_api_key_here
DETECTIFAI_API_KEY=dtf_live_your_key_here
DETECTIFAI_BASE_URL=https://platform.detectif.ai/v1
```

### 3. Launch Server
```bash
node server.js
```
Open **`http://localhost:3850`** in any web browser.

---

## 📊 Judging Criteria Evidence (Day 1 MVP)

| Criterion | How VoiceShield Demonstrates It |
| :--- | :--- |
| **Problem & User** | Focuses on women's voice safety and real Indian cases (Hyderabad, Indore, Bengaluru) with cited harms (₹1–14 lakh, extortion). |
| **Use of DetectifAI** | Live production REST calls to `/v1/deepfake/detect`, `/v1/speakers/verify`, and `/v1/speakers/enroll` with live telemetry. |
| **Progress by 18:00** | End-to-end working MVP: browser mic listening, real Indian case simulation, DetectifAI scoring, Gemini reasoning, and Gemini Studio TTS playback. |
| **Plan for Day 2** | Concrete 12-hour roadmap: family voice vault multi-enrollment, regional dialect localization, and MCP integration. |
| **Team & Clarity** | Clear 5-slide pitch structure (Problem → Solution → DetectifAI → Impact → Scale). |

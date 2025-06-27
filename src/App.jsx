// At the top (with other imports)
import { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [user, setUser] = useState(localStorage.getItem("userEmail") || null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // 'login' or 'signup'

  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [category, setCategory] = useState("general");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const chatRef = useRef(null);
  const recognitionRef = useRef(null);

  const [audioPlayingId, setAudioPlayingId] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const utteranceRef = useRef(null);
  const audioTimerRef = useRef(null);

  const languageLabel = {
    en: "English",
    hi: "हिंदी",
    mr: "मराठी",
    gu: "ગુજરાતી",
    te: "తెలుగు",
  };

  const healthCategories = {
    general: {
      en: "General",
      hi: "सामान्य",
      mr: "सामान्य",
      gu: "સામાન્ય",
      te: "సాధారణ",
    },
    children: {
      en: "Children",
      hi: "बच्चे",
      mr: "मुले",
      gu: "બાળકો",
      te: "పిల్లలు",
    },
    elderly: {
      en: "Elderly",
      hi: "वृद्ध",
      mr: "ज्येष्ठ",
      gu: "વૃદ્ધ",
      te: "వృద్ధులు",
    },
    maternity: {
      en: "Maternity",
      hi: "गर्भावस्था",
      mr: "गर्भावस्था",
      gu: "ગર્ભાવસ્થા",
      te: "గర్భధారణ",
    },
    covid: {
      en: "COVID-19",
      hi: "कोविड-19",
      mr: "कोविड-१९",
      gu: "કોરોના",
      te: "కోవిడ్-19",
    },
  };

  const uiText = {
    en: {
      title: "Sanjeevani",
      description: "Your friendly multilingual health assistant.",
      placeholder: "Describe your symptom...",
      typing: "Typing...",
    },
    hi: {
      title: "संजीवनी",
      description: "आपका दोस्ताना बहुभाषी स्वास्थ्य सहायक।",
      placeholder: "अपने लक्षण दर्ज करें...",
      typing: "लिखा जा रहा है...",
    },
    mr: {
      title: "संजीवनी",
      description: "तुमचा मैत्रीपूर्ण आरोग्य सहाय्यक.",
      placeholder: "तुमचे लक्षण टाका...",
      typing: "टायपिंग चालू आहे...",
    },
    gu: {
      title: "સંજીવની",
      description: "તમારું મિત્રતાપૂર્વકનું આરોગ્ય સહાયક.",
      placeholder: "તમારું લક્ષણ લખો...",
      typing: "લખાઈ રહ્યુ છે...",
    },
    te: {
      title: "సంజీవని",
      description: "మీ మిత్రుడైన ఆరోగ్య సహాయకుడు.",
      placeholder: "మీ లక్షణాలు వివరించండి...",
      typing: "టైప్ జరుగుతోంది...",
    },
  };

  const keywordMap = {
    en: ["🤒 Fever", "🤧 Cold", "💊 Medicine", "😷 Cough", "🤕 Headache"],
    hi: ["🤒 बुखार", "🤧 सर्दी", "💊 दवा", "😷 खांसी", "🤕 सिरदर्द"],
    mr: ["🤒 ताप", "🤧 सर्दी", "💊 औषध", "😷 खोकला", "🤕 डोकेदुखी"],
    gu: ["🤒 તાવ", "🤧 ઠંડક", "💊 દવા", "😷 ખાંસી", "🤕 માથાનો દુખાવો"],
    te: ["🤒 జ్వరం", "🤧 జలుబు", "💊 మందు", "😷 దగ్గు", "🤕 తలనొప్పి"],
  };

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/chats/${user}`);
        const data = await res.json();
        setChatHistory(data);
      } catch (err) {
        console.error("Error loading chats:", err);
      }
    };

    if (user) fetchChats();
  }, [user]);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event) =>
        setInput(event.results[0][0].transcript);
      recognition.onerror = (event) =>
        console.error("Speech recognition error:", event.error);
      recognitionRef.current = recognition;
    }
  }, [language]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".account-menu")) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleVoiceInput = () => {
    recognitionRef.current?.start();
  };

  const handlePlayPause = (msg, index) => {
    if (audioPlayingId === index) {
      speechSynthesis.cancel();
      clearInterval(audioTimerRef.current);
      setAudioPlayingId(null);
      setAudioProgress(0);
    } else {
      if (audioPlayingId !== null) {
        speechSynthesis.cancel();
        clearInterval(audioTimerRef.current);
      }

      const filteredText = msg.text.replace(/[\u{1F300}-\u{1FAFF}]/gu, "");
      const utterance = new SpeechSynthesisUtterance(filteredText);
      utterance.lang = msg.audioLang;
      const match = speechSynthesis
        .getVoices()
        .find((v) => v.lang === msg.audioLang);
      if (match) utterance.voice = match;

      utterance.onend = () => {
        setAudioPlayingId(null);
        setAudioProgress(0);
        clearInterval(audioTimerRef.current);
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
      setAudioPlayingId(index);

      const words = filteredText.trim().split(/\s+/).length;
      const duration = (words / 150) * 60 * 1000;
      const startTime = Date.now();

      audioTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setAudioProgress(Math.min((elapsed / duration) * 100, 100));
      }, 100);
    }
  };

  const saveChatToHistory = async (chat) => {
    try {
      const res = await fetch("http://localhost:5000/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: user, messages: chat.messages }),
      });
      const newChat = await res.json();
      setChatHistory((prev) => [...prev, newChat]);
    } catch (err) {
      console.error("Error saving chat:", err);
    }
  };

  const deleteChatSession = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/chats/${id}`, {
        method: "DELETE",
      });
      setChatHistory((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error("Error deleting chat:", err);
    }
  };

  const detectGujaratiRoman = (text) => {
    const gujKeywords = [
      "shu",
      "thayu",
      "sarir",
      "dard",
      "taap",
      "kharab",
      "madad",
      "davayi",
      "kamjori",
      "pet",
      "vaar",
      "khansi",
    ];
    return gujKeywords.some((word) => text.toLowerCase().includes(word));
  };

  const translateToTargetLang = async (text, targetLang) => {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
        text
      )}`
    );
    const data = await res.json();
    return data[0].map((pair) => pair[0]).join(" ");
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      let processedInput = input;
      if (language === "gu" && detectGujaratiRoman(input)) {
        processedInput = await translateToTargetLang(input, "gu");
      }

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model: "anthropic/claude-3-haiku",
            messages: [
              {
                role: "system",
                content:
                  language === "gu"
                    ? `You are a caring health assistant. Use bullet points and emojis.  Topic: ${healthCategories[category][language]}.`
                    : language === "hi"
                    ? `You are a caring health assistant.  Use bullet points and emojis. Topic: ${healthCategories[category][language]}.`
                    : `You are a caring health assistant. Reply in ${languageLabel[language]} using bullet points and emojis. Topic: ${healthCategories[category][language]}.`,
              },
              { role: "user", content: processedInput },
            ],
          }),
        }
      );

      const data = await response.json();
      const reply =
        data?.choices?.[0]?.message?.content || "❌ No reply received.";
      const botMessage = {
        sender: "bot",
        text: reply,
        audioLang:
          language === "hi" ? "hi-IN" : language === "gu" ? "en-IN" : "en-US",
      };
      const newChat = [...updatedMessages, botMessage];
      setMessages(newChat);
      saveChatToHistory({ messages: newChat });
    } catch {
      setMessages([
        ...updatedMessages,
        { sender: "bot", text: "❌ Error contacting OpenRouter." },
      ]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    speechSynthesis.cancel();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;

    try {
      const res = await fetch(`http://localhost:5000/api/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);

      if (mode === "signup") {
        // Show a message and redirect to login mode
        alert("Signup successful! Please login.");
        setMode("login");
        setEmail("");
        setPassword("");
      } else {
        // Login flow
        localStorage.setItem("userEmail", data.email);
        setUser(data.email);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    setUser(null);
    setMessages([]);
    setInput("");
  };

  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // 🔐 LOGIN screen before chatbot loads
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100">
        <div className="bg-white p-6 rounded shadow max-w-sm w-full">
          <h2 className="text-xl font-bold mb-4 text-center text-blue-600">
            {mode === "login" ? "Login to Sanjeevani" : "Sign Up to Sanjeevani"}
          </h2>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded mb-3"
          />

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mb-2"
          >
            {mode === "login" ? "Login" : "Sign Up"}
          </button>

          <p className="text-center text-sm text-gray-600">
            {mode === "login" ? "New user?" : "Already have an account?"}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-blue-600 ml-2 hover:underline"
            >
              {mode === "login" ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-r from-blue-100 to-purple-100 flex flex-col p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 mt-1" />
          <div>
            <h1 className="text-3xl font-bold text-blue-600">
              {uiText[language].title}
            </h1>
            <p className="text-sm text-gray-600">
              {uiText[language].description}
            </p>
          </div>
        </div>

        <div className="relative account-menu">
          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="text-2xl hover:opacity-80"
            title="Account"
          >
            👤
          </button>

          {showAccountMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-50">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                🔓 Logout
              </button>
              <button
                onClick={() => {
                  setShowAboutModal(true);
                  setShowAccountMenu(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                ℹ️ About Us
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-between items-start mb-2">
        <div className="flex gap-2 flex-wrap">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="border p-2 rounded"
          >
            {Object.entries(languageLabel).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border p-2 rounded"
          >
            {Object.entries(healthCategories).map(([code, label]) => (
              <option key={code} value={code}>
                {label[language]}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowHistory(true)}
          className="ml-auto bg-white border px-3 py-2 rounded hover:bg-gray-100"
        >
          🕘 Past Chats
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {keywordMap[language].map((kw, i) => (
          <button
            key={i}
            onClick={() => setInput(kw)}
            className="bg-blue-200 px-3 py-1 rounded-full text-sm"
          >
            {kw}
          </button>
        ))}
      </div>

      <div
        ref={chatRef}
        className="flex-1 bg-gradient-to-br from-blue-50 via-purple-50 to-white p-3 rounded shadow overflow-y-auto max-h-[60vh] mb-2 bg-cover bg-center"
        style={{ backgroundImage: 'url("./background.png")' }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`my-2 ${
              msg.sender === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block px-3 py-2 rounded ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              {msg.text.split("\n").map((line, index) => (
                <div key={index}>{line}</div>
              ))}
              {msg.sender === "bot" && (
                <div className="mt-1 flex items-center gap-2">
                  <button
                    onClick={() => handlePlayPause(msg, i)}
                    className="text-sm bg-blue-600 text-white px-2 py-1 rounded"
                  >
                    {audioPlayingId === i ? "⏸ Pause" : "▶ Play"}
                  </button>
                  <div className="w-28 h-2 bg-blue-100 rounded overflow-hidden">
                    <div
                      className="h-2 bg-blue-600"
                      style={{
                        width: `${audioPlayingId === i ? audioProgress : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-left text-gray-500">
            {uiText[language].typing}
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          rows="2"
          placeholder={uiText[language].placeholder}
          className="flex-1 border p-2 rounded resize-none max-w-full"
        />

        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send
        </button>
        <button
          onClick={handleVoiceInput}
          className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
        >
          🎤
        </button>
        <button
          onClick={handleNewChat}
          className="bg-red-100 text-red-600 px-4 py-2 rounded hover:bg-red-200"
        >
          🧹 New Chat
        </button>
      </div>

      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold">🕘 Past Chats</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-600 text-lg hover:text-gray-900"
              >
                ✖
              </button>
            </div>

            {chatHistory.length === 0 ? (
              <p className="text-gray-600">No saved chats.</p>
            ) : (
              chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className="flex justify-between items-center mb-2 border rounded p-2 hover:bg-blue-50"
                >
                  <button
                    onClick={() => {
                      setMessages(chat.messages);
                      setShowHistory(false);
                    }}
                    className="text-left flex-1"
                  >
                    <strong>{chat.title}</strong>
                    <br />
                    <span className="text-xs text-gray-500">{chat.date}</span>
                  </button>
                  <button
                    onClick={() => deleteChatSession(chat.id)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    🗑
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl"
            >
              ✖
            </button>
            <h2 className="text-2xl font-bold text-blue-600 mb-2">
              About 🌿 Sanjeevani
            </h2>
            <p className="text-gray-700 mb-2">
              🌿 <strong>Sanjeevanit</strong> is your multilingual health
              assistant. It helps users describe symptoms and get safe, friendly
              AI-based suggestions.
            </p>
            <p className="text-gray-700">
              🌐 Supports languages like English, हिंदी, ગુજરાતી, मराठी, తెలుగు.
              Designed for all age groups and healthcare categories.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

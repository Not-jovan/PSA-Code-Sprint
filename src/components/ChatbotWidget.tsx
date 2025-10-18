import React, { useState, useEffect } from 'react';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hello! I'm here to support you. How are you feeling today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [vectorStoreId, setVectorStoreId] = useState<string | null>(null);

  const openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY; // API Key from environment variable
  const baseUrl = "https://psacodesprint2025.azure-api.net/gpt-5-mini/openai";
  const apiVersion = "2025-01-01-preview";

  // Step 1: Create a vector store on component mount
  useEffect(() => {
    const createVectorStore = async () => {
      const createUrl = `${baseUrl}/vector_stores?api-version=${apiVersion}`;
      const headers = {
        "Content-Type": "application/json",
        "api-key": openaiApiKey || "", // Ensure the API key is provided
      };

      const payload = {
        name: "employee_skills_vector_store",
        chunking_strategy: { type: "auto" },
        metadata: { source: "HR-data", description: "Skill dataset for AI advisor" },
      };

      try {
        const response = await fetch(createUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Failed to create vector store: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("🧠 Vector store created:", data);
        setVectorStoreId(data.id); // Save the vector store ID for later use
      } catch (error) {
        console.error("Error creating vector store:", error);
      }
    };

    createVectorStore();
  }, [openaiApiKey]);

  // Step 2: Handle sending messages
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const convo = [
        { role: 'system', content: "You are a friendly and empathetic assistant that provides emotional support and encouragement to employees." }
      ];
      messages.slice(-5).forEach(msg => {
        convo.push({ role: msg.sender === 'bot' ? 'assistant' : 'user', content: msg.text });
      });
      convo.push({ role: 'user', content: userMessage });

      const response = await fetch(`${baseUrl}/chat/completions?api-version=${apiVersion}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: convo,
          temperature: 0.7,
          vector_store_id: vectorStoreId, // Include the vector store ID if available
        })
      });

      const data = await response.json();
      const botReply = data.choices?.[0]?.message?.content;
      if (botReply) {
        setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: "I'm sorry, I couldn't get a response at the moment." }]);
      }
    } catch (err) {
      console.error("Error calling OpenAI API:", err);
      setMessages(prev => [...prev, { sender: 'bot', text: "Error: Failed to fetch response. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        aria-label="Toggle chat support"
      >
        💬
      </button>

      {isOpen && (
        <div className="fixed bottom-16 right-4 w-72 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg flex flex-col">
          <div className="p-2 font-semibold bg-blue-600 text-white rounded-t">Chat Support</div>
          <div className="flex-1 p-2 overflow-y-auto">
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-2 ${msg.sender === 'bot' ? 'text-left' : 'text-right'}`}>
                <span
                  className={`inline-block px-2 py-1 rounded ${
                    msg.sender === 'bot'
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      : 'bg-blue-100 dark:bg-blue-900 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {msg.text}
                </span>
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-gray-300 dark:border-gray-700 flex">
            <input
              type="text"
              className="flex-1 text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
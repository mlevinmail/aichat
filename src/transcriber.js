import React, { useState, useRef, useEffect } from 'react';
import { OpenAIChat } from './OpenAIChat';
import './transcriber.css';  // A new CSS file for styling

const Transcriber = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [conversationTrail, setConversationTrail] = useState('');
    const [selectedLang, setSelectedLang] = useState('en-US');
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    const [stream, setStream] = useState(null);
    const chat = useRef(new OpenAIChat());
    // apikey var
    const [apiKey, setApiKey] = useState(() => {
        // Load the apiKey from localStorage during initial state setup
        return localStorage.getItem('apiKey') || '';
    });
    useEffect(() => {
        const textarea = document.getElementById("conversationTrail");
        textarea.scrollTop = textarea.scrollHeight;
    }, [conversationTrail]);

    useEffect(() => {
        // This effect ensures the apiKey is always up to date in the local storage.
        // Whenever the apiKey state changes, it updates the value in local storage.
        localStorage.setItem('apiKey', apiKey);
    }, [apiKey]);

    const toggleRecording = () => {
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
        setIsRecording(!isRecording);
    };

    const startRecording = () => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(s => {
            setStream(s);
            mediaRecorder.current = new MediaRecorder(s);
            mediaRecorder.current.ondataavailable = event => {
                audioChunks.current.push(event.data);
            };

            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current);
                await sendToWhisper(audioBlob);
                audioChunks.current = [];
            };

            mediaRecorder.current.start();
        });
    };

    const stopRecording = () => {
        mediaRecorder.current.stop();
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const sendToWhisper = async (audioBlob) => {
        chat.current.setApiKey(apiKey);
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.mp3");
        formData.append("model", "whisper-1");

        try {
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + apiKey
                },
                body: formData
            });

            const data = await response.json();
            chat.current.addUserMessage(data.text);
            setConversationTrail(prev => `${prev}\nUser: ${data.text}`);
            const openAiResponse = await chat.current.getResponse();
            setConversationTrail(prev => `${prev}\nAssistant: ${openAiResponse}`);

            // Read out the assistant's response
            const speech = new SpeechSynthesisUtterance(openAiResponse);
            // speech speed
            speech.rate = 1.2;
            speech.lang = selectedLang;
            window.speechSynthesis.speak(speech);

        } catch (error) {
            console.error("Error transcribing audio:", error);
        }
    };

    function scrollToBottom() {
        const chatArea = document.getElementById('chatArea');
        chatArea.scrollTop = chatArea.scrollHeight;
    }


    const resetConversation = () => {
        setConversationTrail('');
        chat.current.resetChat();

        // Stop the speech synthesis if it's reading aloud
        window.speechSynthesis.cancel();
    };

    return (
        <div className="transcriber-container">
            <input type="text" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter your API key" />            <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)}>
                <option value="en-US">English (US)</option>
                <option value="ru-RU">Russian</option>
                <option value="uk-UA">Ukrainian</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
                <option value="zh-HK">Chinese (Hong Kong)</option>
            </select>

            <textarea id="conversationTrail" value={conversationTrail} readOnly rows={20} placeholder="Conversation trail..." />
            <div className="button-group">
                <button className={isRecording ? 'btn stop' : 'btn start'} onClick={toggleRecording}>
                    {isRecording ? 'Stop' : 'Start'} Recording
                </button>
                <button className="btn reset" onClick={resetConversation}>
                    Reset Conversation
                </button>
            </div>
        </div>
    );
};

export default Transcriber;


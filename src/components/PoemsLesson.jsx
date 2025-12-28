import React, { useState, useEffect } from 'react';

// Custom styles for 3D/shadow effect on buttons and text (using standard CSS within JS)
const style = {
  icon3D: {
    textShadow: '1px 1px 0 #fff, 2px 2px 0 #4ade80', // White highlight, then green shadow
  },
  button3D: {
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06), 0 3px #10b981', // Shadow + bottom border for depth
  },
  buttonHover3D: {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 8px -1px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.06), 0 1px #10b981',
  }
};


// --- CURATED COLLECTION: 15+ CHILD-FRIENDLY POEMS FOR EARLY LEARNERS ---
const PREDEFINED_POEMS = [
  {
    title: '🌟 Select a Poem to Learn',
    text: '',
    language: 'en',
    category: 'select',
  },
  
  // === ENGLISH NURSERY RHYMES (Classic & Famous) ===
  {
    title: '⭐ Twinkle Twinkle Little Star',
    text: `Twinkle, twinkle, little star,
How I wonder what you are!
Up above the world so high,
Like a diamond in the sky.
Twinkle, twinkle, little star,
How I wonder what you are!`,
    language: 'en',
    category: 'english',
  },
  {
    title: '🐑 Baa Baa Black Sheep',
    text: `Baa, baa, black sheep,
Have you any wool?
Yes sir, yes sir,
Three bags full.
One for the master,
One for the dame,
And one for the little boy
Who lives down the lane.`,
    language: 'en',
    category: 'english',
  },
  {
    title: '🕷️ Incy Wincy Spider',
    text: `Incy wincy spider
Climbed up the water spout.
Down came the rain
And washed the spider out.
Out came the sunshine
And dried up all the rain.
So incy wincy spider
Climbed up the spout again.`,
    language: 'en',
    category: 'english',
  },
  {
    title: '🌈 Rain Rain Go Away',
    text: `Rain, rain, go away,
Come again another day.
Little children want to play,
Rain, rain, go away!`,
    language: 'en',
    category: 'english',
  },
  {
    title: '🚣 Row Row Your Boat',
    text: `Row, row, row your boat,
Gently down the stream.
Merrily, merrily, merrily, merrily,
Life is but a dream!`,
    language: 'en',
    category: 'english',
  },
  {
    title: '😊 If You\'re Happy and You Know It',
    text: `If you're happy and you know it, clap your hands!
If you're happy and you know it, clap your hands!
If you're happy and you know it,
Then your face will surely show it.
If you're happy and you know it, clap your hands!`,
    language: 'en',
    category: 'english',
  },
  {
    title: '🐭 Hickory Dickory Dock',
    text: `Hickory dickory dock,
The mouse ran up the clock.
The clock struck one,
The mouse ran down,
Hickory dickory dock!`,
    language: 'en',
    category: 'english',
  },
  
  // === URDU/HINDI RHYMES (Popular Pakistani & Indian) ===
  {
    title: '🌙 Chanda Mama Door Ke',
    text: `Chanda Mama door ke,
Pooay pakaayein boor ke.
Aap khaayein thaali mein,
Munne ko dein pyaali mein.
Pyaali gayi toot,
Munna gaya rooth.`,
    language: 'ur',
    category: 'urdu',
  },
  {
    title: '🐠 Machhli Jal Ki Rani Hai',
    text: `Machhli jal ki rani hai,
Jeevan uska paani hai.
Haath lagao darr jaayegi,
Bahar nikalo marr jaayegi.`,
    language: 'ur',
    category: 'urdu',
  },
  {
    title: '🥔 Aloo Kachaloo Beta',
    text: `Aloo kachaloo beta,
Kahan gaye the?
Begum ke bageeche mein,
Wahan kya kiya?
Begum ki shaadi mein,
Kya khaaya? Chaawal daal sabzi,
Aur kya khaaya? Kuch bhi nahin!`,
    language: 'ur',
    category: 'urdu',
  },
  {
    title: '🐦 Ek Chidiya Anek Chidiya',
    text: `Ek chidiya, anek chidiya,
Dher saari chidiyan.
Daal daal par soti hain,
Neend mein khoti hain.
Jaldi jaldi uthkar phir,
Daana chugti hain.`,
    language: 'ur',
    category: 'urdu',
  },
  {
    title: '🌧️ Aaya Aaya Baadal',
    text: `Aaya aaya baadal,
Laaya laaya paani.
Khush hue sab bachche,
Naache sab hairaani.
Chhat pe khade hokar,
Dekhen barish aani.`,
    language: 'ur',
    category: 'urdu',
  },
  {
    title: '🐵 Bandar Mama Pahan Pajaama',
    text: `Bandar mama pahan pajaama,
Khao kela aur so jaao.
Kal subah jaldi uthna hai,
School bhi jana hai.
Homework bhi karna hai,
Achhe bachche banna hai!`,
    language: 'ur',
    category: 'urdu',
  },
  {
    title: '🌞 Sooraj Nikla Chanda Chhupa',
    text: `Sooraj nikla, chanda chhupa,
Raat gayi din aaya.
Chidiyan gaati hain geet,
Phoolon ne rang dikhaaya.
Aao bachho uth jaao,
School jaane ka hai samay!`,
    language: 'ur',
    category: 'urdu',
  },
  {
    title: '🦋 Titli Udi Ud Ud Kar',
    text: `Titli udi ud ud kar,
Phool pe aayi baithkar.
Rang birange pankh hain,
Kitni pyaari dikhe.
Idhar udhar ghoomti rahe,
Bachche khush ho dikhe!`,
    language: 'ur',
    category: 'urdu',
  },
];

// --- LANGUAGE-SPECIFIC VOICE PREFERENCES ---
const VOICE_PREFERENCES = {
  'en': ['Zira', 'Samantha', 'Karen', 'Google UK English Female', 'Google US English', 'Victoria', 'Hazel'],
  'ur': ['Urdu', 'Hindi', 'Pakistani', 'Indian', 'Raveena'], // Browser voices for ur/hi
  // NOTE: ElevenLabs voice is typically handled on the backend based on language
};

const PoemsLesson = () => {
  const [topic, setTopic] = useState('');
  const [selectedPoemText, setSelectedPoemText] = useState('');
  const [poem, setPoem] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [error, setError] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState(0.7); 
    
  const [contentLanguage, setContentLanguage] = useState('en'); 
  const [selectedVoiceName, setSelectedVoiceName] = useState(''); 
  const [availableVoices, setAvailableVoices] = useState([]);


  // Load voices when component mounts
  useEffect(() => {
    loadVoices();
  }, []);

  // Effect to set the default voice whenever availableVoices or contentLanguage changes
  useEffect(() => {
    const targetLangCode = contentLanguage === 'ur' ? 'ur' : 'en';
    const preferredNames = VOICE_PREFERENCES[targetLangCode] || [];
    
    const langSpecificVoices = availableVoices.filter(v => 
        v.lang.startsWith(targetLangCode) || 
        (targetLangCode === 'ur' && v.lang.startsWith('hi')) 
    );

    if (langSpecificVoices.length > 0) {
        const defaultVoice = langSpecificVoices.find(v => preferredNames.some(name => v.name.toLowerCase().includes(name.toLowerCase()))) 
                            || langSpecificVoices[0]; 

        if (defaultVoice) {
            setSelectedVoiceName(defaultVoice.name);
        }
    } else {
        setSelectedVoiceName('');
    }
  }, [contentLanguage, availableVoices]);


  const loadVoices = () => {
    if ('speechSynthesis' in window) {
      const loadVoicesFunc = () => {
        const voices = window.speechSynthesis.getVoices();
        
        // Filter for English, Urdu, and Hindi voices
        const finalVoices = voices.filter(v => v.lang.startsWith('en') || v.lang.startsWith('ur') || v.lang.startsWith('hi'));
        
        setAvailableVoices(finalVoices);
      };
     
      loadVoicesFunc();
      window.speechSynthesis.onvoiceschanged = loadVoicesFunc;
    }
  };


  // Handle the button click to generate a poem
  const handleGeneratePoem = async () => {
    setError('');
    setPoem('');
    setAudioUrl(null);
    setSelectedPoemText('');
    handleStopAudio(); 
    
    // Enforce English generation
    setContentLanguage('en'); 

    if (!topic.trim()) {
      setError('Please enter a topic to generate a poem.');
      return;
    }

    setIsLoading(true);

    try {
      // Backend call enforcing English language generation
      const response = await fetch(`http://localhost:5000/generate-poem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            topic, 
            language: 'english'
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setPoem(data.poem);
     
    } catch (err) {
      console.error('Failed to fetch poem:', err);
      setError('Failed to generate poem. Please ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- HANDLER FOR PREDEFINED POEM SELECTION ---
  const handleSelectPoem = (event) => {
    const selectedTitle = event.target.value;
    const selectedItem = PREDEFINED_POEMS.find(p => p.title === selectedTitle);
    
    if (selectedItem && selectedItem.text) {
      setPoem(selectedItem.text);
      setSelectedPoemText(selectedTitle);
      setContentLanguage(selectedItem.language); // Set content language (en or ur)
      setTopic('');
      setError('');
      setAudioUrl(null);
      handleStopAudio();
    } else {
      setPoem('');
      setSelectedPoemText('');
    }
  };


  // Browser TTS function
  const handlePlayPoemFallback = () => {
    const textToSpeak = poem;
    handleStopAudio(); 

    // ... (TTS logic remains the same as previous step for simplicity and accuracy) ...
    if (!textToSpeak || !('speechSynthesis' in window)) {
        setError(textToSpeak ? 'Text-to-speech not supported.' : 'Please select or generate a poem.');
        return;
    }
    
    try {
        setError('');
        setIsAudioLoading(true);
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = speechSpeed; 
        utterance.pitch = 1.0;   
        
        const voiceToUse = availableVoices.find(v => v.name === selectedVoiceName);

        if (voiceToUse) {
            utterance.voice = voiceToUse;
            utterance.lang = voiceToUse.lang; 
            console.log(`TTS using voice: ${voiceToUse.name} (${voiceToUse.lang})`);
        } else {
            console.warn('Selected voice not found. Using browser default.');
        }

        utterance.onstart = () => { setIsAudioLoading(false); setIsPlaying(true); };
        utterance.onend = () => { setCurrentAudio(null); setIsAudioLoading(false); setIsPlaying(false); };
        utterance.onerror = (e) => { console.error('Speech error:', e); setError('Speech synthesis failed.'); setIsAudioLoading(false); setIsPlaying(false); };

        const lines = textToSpeak.split('\n').filter(line => line.trim());
        if (lines.length > 1) {
            utterance.text = lines.join('... '); 
        }

        window.speechSynthesis.speak(utterance);
        setCurrentAudio({ type: 'speech', utterance });
        
    } catch (err) {
        console.error('Error in handlePlayPoemFallback:', err);
        setError('Speech synthesis failed. Please try again.');
        setIsAudioLoading(false);
        setCurrentAudio(null);
    }
  };


  // --- RE-INTEGRATED ELEVENLABS FUNCTIONALITY ---
  const handlePlayPoemElevenLabs = async () => {
    if (!poem) {
      setError('Please generate or select a poem first!');
      return;
    }

    setIsAudioLoading(true);
    setError('');
    handleStopAudio(); 

    try {
      console.log('Requesting ElevenLabs audio generation...');
     
      const response = await fetch(`http://localhost:5000/generate-audio-elevenlabs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: poem,
          // *** PASSING CONTENT LANGUAGE FOR BACKEND VOICE SELECTION ***
          language: contentLanguage, 
          voice_settings: {
            stability: 0.9,
            similarity_boost: 0.7,
            style: 0.6, 
            use_speaker_boost: true,
            speaking_rate: speechSpeed 
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs response:', response.status, errorText);
       
        if (response.status === 429) {
          throw new Error('🚫 ElevenLabs daily limit reached! Try the Device Voice option instead.');
        }
       
        throw new Error(`ElevenLabs Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const audioData = data.audio_data;
      const mimeType = data.mime_type || 'audio/mpeg';

      // Create blob and play audio
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
     
      const audioBlob = new Blob([bytes], { type: mimeType });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioUrl);

      const audio = new Audio();
      audio.src = audioUrl;

      audio.oncanplaythrough = () => {
        setIsPlaying(true);
        audio.play().catch(playError => {
          console.error('ElevenLabs play error:', playError);
          setError(`Playback failed: ${playError.message}`);
          setIsPlaying(false);
        });
      };
     
      audio.onended = () => {
        setCurrentAudio(null);
        setIsAudioLoading(false);
        setIsPlaying(false);
      };

      audio.onerror = (e) => {
        console.error('ElevenLabs audio error:', e);
        setError('Failed to play Premium audio. Try Device Voice instead.');
        setIsPlaying(false);
      };

      audio.load();
      setCurrentAudio(audio);

    } catch (err) {
      console.error('ElevenLabs audio failed:', err);
      setError(`Premium Voice Error: ${err.message}`);
    } finally {
      setIsAudioLoading(false);
    }
  };


  // Stop current audio if playing
  const handleStopAudio = () => {
    try {
      if (currentAudio) {
        if (currentAudio.type === 'speech') {
          window.speechSynthesis.cancel();
        } else {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        setCurrentAudio(null);
      }
      setIsAudioLoading(false);
      setIsPlaying(false);
    } catch (err) {
      console.error('Error in handleStopAudio:', err);
      setCurrentAudio(null);
      setIsAudioLoading(false);
      setIsPlaying(false);
    }
  };

  // Cleanup audio URL when component unmounts
  useEffect(() => {
    return () => {
      try {
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        if (currentAudio && currentAudio.type === 'speech') {
          window.speechSynthesis.cancel();
        }
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    };
  }, [audioUrl, currentAudio]);


  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-screen bg-gradient-to-br from-blue-100 to-green-100 relative overflow-hidden">
     
      <div className="w-full max-w-2xl bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 space-y-6 relative z-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
                <span className="text-4xl" style={style.icon3D}>📚</span> Poem for Kids <span className="text-4xl" style={style.icon3D}></span>
            </h1>
          <p className="text-gray-600">Generate an English poem or read a classic rhyme!</p>
        </div>
        
        {/* --- PREDEFINED POEM SELECTION --- */}
        <div className="space-y-4">
          <label htmlFor="predefined-poem" className="block text-lg font-bold text-gray-700">
            <span style={style.icon3D}>🎵</span> Select a Classic South Asian Rhyme:
          </label>
          <select
            id="predefined-poem"
            value={selectedPoemText} 
            onChange={handleSelectPoem}
            className="w-full p-4 text-lg border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 bg-orange-50 appearance-none cursor-pointer font-bold text-orange-700"
          >
            {PREDEFINED_POEMS.map((p) => (
              <option key={p.title} value={p.title} disabled={p.text === ''} className="font-semibold text-gray-800">
                {p.title} {p.language === 'ur' ? '(اردو TTS)' : '(English TTS)'}
              </option>
            ))}
          </select>
        </div>


        <textarea
          className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 resize-none"
          rows="4"
          placeholder="Or, enter a topic to generate a NEW English poem (e.g., A Lahore Garden, Rickshaw Ride)"
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
            setSelectedPoemText(''); 
            setPoem('');
            setContentLanguage('en'); 
          }}
        />
       
        <button
          onClick={handleGeneratePoem}
          disabled={isLoading || topic.trim() === ''} 
          className="w-full bg-blue-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-[1.01]"
            style={style.button3D}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Poem...
            </span>
          ) : (
            '✨ Generate ENGLISH Poem ✨'
          )}
        </button>

        {error && (
          <div className="text-red-600 text-center p-4 border border-red-300 bg-red-50 rounded-lg">
            <span className="font-bold">Oops!</span> {error}
          </div>
        )}

        {poem && (
          <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl shadow-inner border-l-4 border-green-300">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
              📝 Poem Text ({contentLanguage === 'ur' ? 'اردو Rhyme' : 'English Poem'}):
            </h2>
            <div className={`whitespace-pre-wrap text-gray-800 leading-relaxed font-serif text-lg mb-6 p-4 bg-white rounded-lg shadow-sm ${contentLanguage === 'ur' ? 'text-right' : 'text-left'}`}>
              {poem}
            </div>
           
            {/* --- TTS VOICE AND SPEED CONTROLS --- */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                {/* Voice Selector */}
                <div className="flex-1 space-y-2">
                    <label htmlFor="voice-select" className="block text-sm font-bold text-gray-700">
                        <span className="text-xl" style={style.icon3D}>🗣️</span> Select Reading Voice ({contentLanguage === 'ur' ? 'Urdu/Hindi' : 'English'}):
                    </label>
                    <select
                        id="voice-select"
                        className="w-full p-2 border rounded-lg bg-white font-medium"
                        value={selectedVoiceName || ''}
                        onChange={(e) => setSelectedVoiceName(e.target.value)}
                        disabled={availableVoices.length === 0}
                    >
                        {availableVoices
                            .filter(v => 
                                v.lang.startsWith(contentLanguage) || 
                                (contentLanguage === 'ur' && v.lang.startsWith('hi')) ||
                                (contentLanguage === 'en' && v.lang.startsWith('en')) 
                            )
                            .map((voice) => (
                                <option key={voice.name} value={voice.name}>
                                    {voice.name} ({voice.lang.toUpperCase()})
                                </option>
                            ))}
                        {availableVoices.filter(v => v.lang.startsWith(contentLanguage) || (contentLanguage === 'ur' && v.lang.startsWith('hi'))).length === 0 && (
                            <option disabled>No {contentLanguage === 'ur' ? 'Urdu/Hindi' : 'English'} Voice Found</option>
                        )}
                    </select>
                </div>

                {/* Speed Controller */}
                <div className="flex-1 space-y-2">
                    <label htmlFor="speed-slider" className="block text-sm font-bold text-gray-700">
                        <span className="text-xl" style={style.icon3D}>🐢</span> Reading Speed: **{(speechSpeed * 100).toFixed(0)}%**
                    </label>
                    <input
                        id="speed-slider"
                        type="range"
                        min="0.5" 
                        max="1.0" 
                        step="0.1"
                        value={speechSpeed}
                        onChange={(e) => {
                            setSpeechSpeed(parseFloat(e.target.value));
                            handleStopAudio(); 
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                        <span>Very Slow</span>
                        <span>Normal</span>
                    </div>
                </div>
            </div>

            {/* Playback Buttons */}
            <div className="flex gap-2 flex-wrap justify-center">
              <button
                onClick={handlePlayPoemFallback}
                disabled={isAudioLoading || !selectedVoiceName}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold py-3 px-5 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg text-sm transform hover:scale-105"
              >
                <span style={style.icon3D}>▶️</span> {isPlaying ? 'Pausing...' : 'Listen with Device Voice'}
              </button>

              <button
                onClick={handlePlayPoemElevenLabs}
                disabled={isAudioLoading || isPlaying}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 px-5 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg text-sm transform hover:scale-105"
              >
                <span style={style.icon3D}>🎤</span> Premium Voice
              </button>

              {currentAudio && (
                <button
                  onClick={handleStopAudio}
                  className="bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold py-3 px-5 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg text-sm transform hover:scale-105"
                >
                  <span style={style.icon3D}>⏹️</span> Stop Audio
                </button>
              )}
            </div>

            {/* Premium Audio Player */}
            {audioUrl && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700 mb-2">🎧 Premium audio ready:</p>
                <audio controls className="w-full">
                  <source src={audioUrl} type="audio/mp3" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PoemsLesson;

import React, { useState, useCallback, useEffect } from 'react';
import { Difficulty, GameMode, GrammarTopic, Screen } from './types';
import ZoneSelector from './components/LevelSelector';
import GameModeSelector from './components/GameModeSelector';
import GrammarTopicSelector from './components/GrammarTopicSelector';
import JumbledWordsGame from './components/JumbledWordsGame';
import GrammarChallengeGame from './components/GrammarChallengeGame';
import ProgressBar from './components/ProgressBar';
import { TOTAL_CHALLENGES } from './constants';

const PROGRESS_STORAGE_KEY = 'englishSkillTestProgress';
const HISTORY_STORAGE_KEY = 'englishSkillTestHistory';

const getSkillKey = (level: Difficulty, gameMode: GameMode | null, grammarTopic: GrammarTopic | null): string | null => {
    if (!gameMode) return null;
    // For grammar challenge, a topic must be selected to form a valid key
    if (gameMode === GameMode.GRAMMAR_CHALLENGE && (!grammarTopic || !level)) return null;
    // For jumbled words, a level must be selected
    if (gameMode === GameMode.JUMBLED_WORDS && !level) return null;
    
    let key = `${level}_${gameMode.replace(' ', '_')}`;
    if (grammarTopic) {
        key += `_${grammarTopic.replace(' ', '_')}`;
    }
    return key;
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('mode');
  const [level, setLevel] = useState<Difficulty>(Difficulty.EASY);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [grammarTopic, setGrammarTopic] = useState<GrammarTopic | null>(null);
  
  const [progress, setProgress] = useState<{ [key: string]: number }>(() => {
    try {
      const savedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
      return savedProgress ? JSON.parse(savedProgress) : {};
    } catch (error) {
      console.error("Failed to load progress from localStorage:", error);
      return {};
    }
  });

  const [questionHistory, setQuestionHistory] = useState<{ [key: string]: string[] }>(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      return savedHistory ? JSON.parse(savedHistory) : {};
    } catch (error) {
      console.error("Failed to load question history from localStorage:", error);
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error("Failed to save progress to localStorage:", error);
    }
  }, [progress]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(questionHistory));
    } catch (error) {
      console.error("Failed to save question history to localStorage:", error);
    }
  }, [questionHistory]);


  const handleZoneSelect = (selectedLevel: Difficulty) => {
    setLevel(selectedLevel);
    if (gameMode === GameMode.JUMBLED_WORDS) {
      setScreen('game');
    } else {
      setScreen('topic');
    }
  };

  const handleModeSelect = (selectedMode: GameMode) => {
    setGameMode(selectedMode);
    setGrammarTopic(null); // Reset topic when mode changes
    setScreen('zone');
  };

  const handleTopicSelect = (selectedTopic: GrammarTopic) => {
    setGrammarTopic(selectedTopic);
    setScreen('game');
  };

  const handleTaskComplete = useCallback(() => {
    const skillKey = getSkillKey(level, gameMode, grammarTopic);
    if (skillKey) {
        setProgress(prev => ({ ...prev, [skillKey]: (prev[skillKey] || 0) + 1 }));
    }
  }, [level, gameMode, grammarTopic]);

  const handleNewChallengeFetched = useCallback((sentence: string) => {
    const skillKey = getSkillKey(level, gameMode, grammarTopic);
    if (skillKey) {
        setQuestionHistory(prev => {
            const currentHistory = prev[skillKey] || [];
            if (!currentHistory.includes(sentence)) {
                return { ...prev, [skillKey]: [...currentHistory, sentence] };
            }
            return prev;
        });
    }
  }, [level, gameMode, grammarTopic]);
  
  const handleBack = () => {
    if (screen === 'game' && gameMode === GameMode.JUMBLED_WORDS) {
        setScreen('zone');
    } else if (screen === 'game' && gameMode === GameMode.GRAMMAR_CHALLENGE) {
        setScreen('topic');
    } else if (screen === 'topic') {
        setScreen('zone');
    } else if (screen === 'zone') {
        setScreen('mode');
    }
  };

  const handleResetGame = () => {
    // Removed window.confirm to ensure the button works immediately.
    // Clear localStorage
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    
    // Reset React State immediately for UI feedback
    setProgress({});
    setQuestionHistory({});
    setLevel(Difficulty.EASY);
    setGameMode(null);
    setGrammarTopic(null);
    setScreen('mode');
  };

  const currentSkillKey = getSkillKey(level, gameMode, grammarTopic);
  const currentProgress = currentSkillKey ? progress[currentSkillKey] || 0 : 0;

  const renderScreen = () => {
    switch (screen) {
      case 'mode':
        return (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-700">Choose Your Challenge</h2>
            <GameModeSelector onSelect={handleModeSelect} />
          </>
        );
      case 'zone':
        return (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-700">Select a Zone to Begin</h2>
            <ZoneSelector currentLevel={level} onLevelChange={handleZoneSelect} disabled={false} />
          </>
        );
      case 'topic':
        return (
          <>
             <h2 className="text-2xl font-bold text-center text-gray-700">Select a Grammar Topic</h2>
            <GrammarTopicSelector onSelect={handleTopicSelect} />
          </>
        );
      case 'game':
        if (!currentSkillKey) { // Should not happen if logic is correct
            setScreen('mode'); // Fallback to the very beginning
            return null;
        }
        if (gameMode === GameMode.JUMBLED_WORDS) {
          return <JumbledWordsGame 
            level={level} 
            onTaskComplete={handleTaskComplete}
            history={questionHistory[currentSkillKey] || []}
            onNewChallengeFetched={handleNewChallengeFetched}
          />;
        }
        if (gameMode === GameMode.GRAMMAR_CHALLENGE && grammarTopic) {
          return <GrammarChallengeGame 
            level={level} 
            topic={grammarTopic} 
            onTaskComplete={handleTaskComplete}
            history={questionHistory[currentSkillKey] || []}
            onNewChallengeFetched={handleNewChallengeFetched}
          />;
        }
        // Fallback if state is inconsistent
        setScreen('mode'); 
        return null;
    }
  };

  const getSubheaderText = () => {
    switch(screen) {
        case 'mode':
            return 'Master English with fun challenges!';
        case 'zone':
            return `Challenge: ${gameMode}`;
        case 'topic':
            return `Challenge: ${gameMode} | Zone: ${level}`;
        case 'game':
            if (gameMode === GameMode.GRAMMAR_CHALLENGE && grammarTopic) {
                return `Zone: ${level} | Topic: ${grammarTopic}`;
            }
            return `Zone: ${level}`;
        default:
            return 'Master English with fun challenges!';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 text-gray-800">
      <main className="container mx-auto max-w-4xl w-full bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8 relative">
        <header className="text-center mb-6 pt-8 sm:pt-4">
           <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-700 pb-2 leading-tight">
              Ushasree English Skill Test
           </h1>
           <p className="text-gray-600 mt-2 text-base sm:text-lg">
              {getSubheaderText()}
           </p>
        </header>
        
        {/* Reset Button positioned absolute top right of container. Increased z-index to 50 to ensure it's clickable. */}
        <button 
            onClick={handleResetGame}
            className="absolute top-4 right-4 px-4 py-2 text-sm font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors shadow-sm z-50 cursor-pointer"
            title="Reset Game and clear progress"
        >
            Reset Game
        </button>

        {/* Back Button positioned absolute top left of container */}
        {screen !== 'mode' && (
           <button onClick={handleBack} className="absolute top-4 left-4 px-4 py-2 text-sm font-semibold bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors shadow-sm z-50 cursor-pointer">
             &larr; Back
           </button>
        )}

        {screen === 'game' && <ProgressBar current={currentProgress} total={TOTAL_CHALLENGES} />}

        <div className="mt-6">
          {renderScreen()}
        </div>
      </main>
    </div>
  );
};

export default App;

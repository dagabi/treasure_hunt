import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from './theme';
import Registration from './components/Registration';
import Game from './components/Game';
import Results from './components/Results';
import axios from 'axios';
import Cookies from 'js-cookie';
import { getEnvVar } from './util/envVar';

const AppContainer = styled.div`
    min-height: 100vh;
    background: ${theme.colors.background};
    padding: ${theme.spacing.large};
    direction: rtl;
`;

const App = () => {
    const [playerId, setPlayerId] = useState(null);
    const [gameEnded, setGameEnded] = useState(false);
    const [completionTime, setCompletionTime] = useState(null);

    useEffect(() => {
        // Check for existing player ID in cookies
        const savedPlayerId = Cookies.get('playerId');
        if (savedPlayerId) {
            setPlayerId(savedPlayerId);
        }
    }, []);

    const handleRegister = async (name, familyName) => {
        try {
            const apiUrl = getEnvVar('REACT_APP_API_URL') || '';
            const response = await axios.post(`${apiUrl}/api/register`, {
                name,
                family_name: familyName,
            });
            const newPlayerId = response.data.player_id;
            setPlayerId(newPlayerId);
            // Store player ID in cookie for 1 hour
            Cookies.set('playerId', newPlayerId, { expires: 1/24 }); // 1/24 of a day = 1 hour
        } catch (error) {
            console.error('Error registering player:', error);
            alert('שגיאה בהרשמה. אנא נסה שוב.');
        }
    };

    const handleGameEnd = (timeLeft) => {
        setGameEnded(true);
        setCompletionTime(60 * 60 - timeLeft); // Convert time left to completion time
        // Remove the player ID cookie when game ends
        Cookies.remove('playerId');
    };

    return (
        <AppContainer>
            {!playerId ? (
                <Registration onRegister={handleRegister} />
            ) : gameEnded ? (
                <Results playerId={playerId} completionTime={completionTime} />
            ) : (
                <Game playerId={playerId} onGameEnd={handleGameEnd} />
            )}
        </AppContainer>
    );
};

export default App; 
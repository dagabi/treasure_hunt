import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '../theme';
import axios from 'axios';
import { getEnvVar } from '../util/envVar';

const Container = styled.div`
    max-width: 600px;
    margin: 0 auto;
    padding: ${theme.spacing.large};
    text-align: center;
`;

const Title = styled.h1`
    color: ${theme.colors.primary};
    margin-bottom: ${theme.spacing.large};
`;

const StatsBox = styled.div`
    background: ${theme.colors.white};
    padding: ${theme.spacing.large};
    border-radius: ${theme.borderRadius};
    box-shadow: ${theme.boxShadow};
    margin-bottom: ${theme.spacing.large};
`;

const StatItem = styled.div`
    margin-bottom: ${theme.spacing.medium};
    &:last-child {
        margin-bottom: 0;
    }
`;

const StatLabel = styled.span`
    font-weight: bold;
    color: ${theme.colors.text};
`;

const StatValue = styled.span`
    color: ${theme.colors.accent};
    margin-right: ${theme.spacing.small};
`;

const LeaderboardBox = styled.div`
    background: ${theme.colors.white};
    padding: ${theme.spacing.large};
    border-radius: ${theme.borderRadius};
    box-shadow: ${theme.boxShadow};
`;

const LeaderboardTitle = styled.h2`
    color: ${theme.colors.text};
    margin-bottom: ${theme.spacing.medium};
`;

const LeaderboardList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
`;

const LeaderboardItem = styled.li<{ isCurrentPlayer?: boolean }>`
    padding: ${theme.spacing.small};
    margin-bottom: ${theme.spacing.small};
    background: ${props => props.isCurrentPlayer ? theme.colors.primary : theme.colors.background};
    color: ${props => props.isCurrentPlayer ? theme.colors.white : theme.colors.text};
    border-radius: ${theme.borderRadius};
    display: flex;
    justify-content: space-between;
`;

const PlayerName = styled.span<{ isCurrentPlayer?: boolean }>`
    font-weight: ${props => props.isCurrentPlayer ? 'bold' : 'normal'};
`;

const CompletionTime = styled.span<{ isCurrentPlayer?: boolean }>`
    font-weight: ${props => props.isCurrentPlayer ? 'bold' : 'normal'};
`;

interface PlayerResult {
    name: string;
    family_name: string;
    completion_time: number;
    rank: number;
}

interface ResultsProps {
    playerId: string;
    completionTime: number;
}

const Results: React.FC<ResultsProps> = ({ playerId, completionTime }) => {
    const [leaderboard, setLeaderboard] = useState<PlayerResult[]>([]);
    const [currentPlayer, setCurrentPlayer] = useState<PlayerResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const apiUrl = getEnvVar('REACT_APP_API_URL') || '';
                const response = await axios.get(`${apiUrl}/api/results/${playerId}`);
                setLeaderboard(response.data.leaderboard);
                setCurrentPlayer(response.data.current_player);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching results:', error);
                setLoading(false);
            }
        };

        fetchResults();
    }, [playerId]);

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <Container>
                <Title>טוען תוצאות...</Title>
            </Container>
        );
    }

    return (
        <Container>
            <Title>כל הכבוד! סיימת את המשחק!</Title>
            
            <StatsBox>
                <StatItem>
                    <StatValue>{formatTime(completionTime)}</StatValue>
                    <StatLabel>זמן סיום</StatLabel>
                </StatItem>
                {currentPlayer && (
                    <StatItem>
                        <StatValue>#{currentPlayer.rank}</StatValue>
                        <StatLabel>דירוג</StatLabel>
                    </StatItem>
                )}
            </StatsBox>

            <LeaderboardBox>
                <LeaderboardTitle>טבלת המובילים</LeaderboardTitle>
                <LeaderboardList>
                    {leaderboard.map((player) => (
                        <LeaderboardItem 
                            key={`${player.name}_${player.family_name}`}
                            isCurrentPlayer={player.name === currentPlayer?.name && player.family_name === currentPlayer?.family_name}
                        >
                            <PlayerName isCurrentPlayer={player.name === currentPlayer?.name && player.family_name === currentPlayer?.family_name}>
                                {player.name} {player.family_name}
                            </PlayerName>
                            <CompletionTime isCurrentPlayer={player.name === currentPlayer?.name && player.family_name === currentPlayer?.family_name}>
                                {formatTime(player.completion_time)}
                            </CompletionTime>
                        </LeaderboardItem>
                    ))}
                </LeaderboardList>
            </LeaderboardBox>
        </Container>
    );
};

export default Results; 
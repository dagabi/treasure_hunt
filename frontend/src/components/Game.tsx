import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { theme } from '../theme';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Cookies from 'js-cookie';
import { getEnvVar } from '../util/envVar';

const Container = styled.div`
    max-width: 600px;
    margin: 0 auto;
    padding: ${theme.spacing.large};
    text-align: center;
`;

const DebugToggle = styled.div`
    position: fixed;
    top: ${theme.spacing.medium};
    right: ${theme.spacing.medium};
    background: ${theme.colors.primary};
    color: ${theme.colors.white};
    padding: ${theme.spacing.small};
    border-radius: ${theme.borderRadius};
    cursor: pointer;
    z-index: 1000;
    &:hover {
        background: ${theme.colors.secondary};
    }
`;

const HintBox = styled.div`
    background: ${theme.colors.white};
    padding: ${theme.spacing.large};
    border-radius: ${theme.borderRadius};
    box-shadow: ${theme.boxShadow};
    margin-bottom: ${theme.spacing.medium};
`;

const EducationalBox = styled.div`
    background: ${theme.colors.background};
    padding: ${theme.spacing.large};
    border-radius: ${theme.borderRadius};
    box-shadow: ${theme.boxShadow};
    margin-bottom: ${theme.spacing.medium};
    max-height: 150px;
    overflow-y: auto;
`;

const EducationalText = styled.p`
    color: ${theme.colors.text};
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: ${theme.spacing.small};
    font-style: italic;
`;

const HintText = styled.p`
    color: ${theme.colors.text};
    font-size: 18px;
    line-height: 1.4;
    font-weight: bold;
    margin: 0;
`;

const Timer = styled.div`
    color: ${theme.colors.accent};
    font-size: 20px;
    margin-bottom: ${theme.spacing.medium};
`;

const ScannerContainer = styled.div`
    margin: ${theme.spacing.medium} 0;
    border-radius: ${theme.borderRadius};
    overflow: hidden;
    min-height: 250px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: ${theme.colors.background};
    position: relative;
`;

const ScanButton = styled.button`
    padding: ${theme.spacing.medium};
    background: ${theme.colors.primary};
    color: ${theme.colors.white};
    border: none;
    border-radius: ${theme.borderRadius};
    font-size: 16px;
    cursor: pointer;
    &:hover {
        background: ${theme.colors.secondary};
    }
`;

interface GameProps {
    playerId: string;
    onGameEnd: (timeLeft: number) => void;
}

const Game: React.FC<GameProps> = ({ playerId, onGameEnd }) => {
    const [hint, setHint] = useState<string>('');
    const [educationalText, setEducationalText] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState<number>(60 * 60); // 60 minutes in seconds
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [currentLevel, setCurrentLevel] = useState<number>(0);
    const [isProcessingScan, setIsProcessingScan] = useState<boolean>(false);
    const [debugMode, setDebugMode] = useState<boolean>(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const scannerContainerRef = useRef<HTMLDivElement>(null);
    const lastScannedCode = useRef<string>('');
    const scanTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Check for existing player state
        const checkPlayerState = async () => {
            try {
                const apiUrl = getEnvVar('REACT_APP_API_URL') || '';
                const response = await axios.get(`${apiUrl}/api/player-state`, {
                    withCredentials: true
                });
                
                if (response.data.time_left) {
                    setTimeLeft(response.data.time_left);
                    setCurrentLevel(response.data.current_level);
                }

                if (response.data.completion_time) {
                    onGameEnd(response.data.completion_time);
                }

                // Get the next hint if player has started the game
                if (response.data.current_level > 0) {
                    const hintResponse = await axios.get(`${apiUrl}/api/hints`);
                    if (hintResponse.data) {
                        setHint(hintResponse.data[response.data.current_level].text);
                    }
                }
            } catch (error: any) {
                if (error.response?.status === 404) {
                    // Player not found or game expired
                    Cookies.remove('playerId');
                    setError('שחקן לא נמצא. אנא הירשם מחדש.');
                }
            }
        };

        checkPlayerState();

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    onGameEnd(0);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(timer);
            stopScanner();
        };
    }, [onGameEnd]);

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleScan = async (decodedText: string) => {
        // Prevent multiple scans of the same code
        if (decodedText === lastScannedCode.current) {
            console.log('Ignoring duplicate scan of the same code');
            return;
        }

        // Prevent multiple scans while processing
        if (isProcessingScan) {
            console.log('Already processing a scan, ignoring new scan');
            return;
        }

        // Clear any existing timeout
        if (scanTimeout.current) {
            clearTimeout(scanTimeout.current);
        }

        // Set a new timeout to prevent rapid successive scans
        scanTimeout.current = setTimeout(async () => {
            console.log('QR Code detected:', decodedText);
            setIsProcessingScan(true);
            lastScannedCode.current = decodedText;
            
            try {
                const apiUrl = getEnvVar('REACT_APP_API_URL') || '';
                const response = await axios.post(`${apiUrl}/api/scan`, {
                    player_id: playerId,
                    qr_code: { code: decodedText, level: currentLevel + 1 },
                    debug: debugMode
                }, {
                    withCredentials: true
                });

                if (response.data.message === "game completed") {
                    onGameEnd(response.data.completion_time);
                    stopScanner();
                    return;
                }
                
                if (response.data.hint) {
                    setHint(response.data.hint);
                    setEducationalText(response.data.educational_text);
                    setCurrentLevel(prev => prev + 1);
                    setError('');
                } else if (response.data.message) {
                    setHint(response.data.message);
                    setEducationalText('');
                    setError('');
                }
                
                // Stop the scanner after successful scan
                stopScanner();
            } catch (error: any) {
                console.error('Scan error:', error);
                if (error.response) {
                    // Handle specific error messages from the backend
                    switch (error.response.status) {
                        case 404:
                            setError('שחקן לא נמצא. אנא הירשם מחדש.');
                            Cookies.remove('playerId');
                            onGameEnd(timeLeft);
                            break;
                        case 400:
                            if (error.response.data.detail === 'Game time is up') {
                                setError('זמן המשחק נגמר!');
                                Cookies.remove('playerId');
                                onGameEnd(0);
                            } else if (error.response.data.detail === 'Wrong QR code') {
                                setError('קוד QR שגוי. אנא נסה שוב.');
                            } else {
                                setError('שגיאה בסריקה. אנא נסה שוב.');
                            }
                            break;
                        default:
                            setError('שגיאה בסריקה. אנא נסה שוב.');
                    }
                } else {
                    setError('שגיאה בסריקה. אנא נסה שוב.');
                }
            } finally {
                setIsProcessingScan(false);
            }
        }, 1000); // Wait 1 second before processing the scan
    };

    const startScanner = () => {
        console.log('Starting scanner...');
        setError(''); // Clear any previous errors
        
        if (!scannerContainerRef.current) {
            console.error('Scanner container not found');
            return;
        }

        try {
            setIsScanning(true);
            
            // Wait for the next render cycle to ensure the element is mounted
            setTimeout(() => {
                const qrReaderElement = document.getElementById('qr-reader');
                if (!qrReaderElement) {
                    console.error('QR reader element not found after mount');
                    setError('שגיאה בהפעלת הסורק. אנא נסה שוב.');
                    setIsScanning(false);
                    return;
                }

                try {
                    // Create a new instance of Html5QrcodeScanner
                    scannerRef.current = new Html5QrcodeScanner(
                        "qr-reader",
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0,
                            disableFlip: false
                        },
                        false
                    );

                    // Define success callback
                    const onScanSuccess = (decodedText: string) => {
                        console.log('QR Code detected:', decodedText);
                        handleScan(decodedText);
                    };

                    // Define error callback
                    const onScanError = (errorMessage: string) => {
                        // Only log errors that aren't "not found" errors
                        if (!errorMessage.includes('No barcode or QR code detected') && !errorMessage.includes('NotFoundException')) {
                            console.error('QR Code scan error:', errorMessage);
                        }
                    };

                    // Start the scanner
                    scannerRef.current.render(onScanSuccess, onScanError);
                    console.log('Scanner started successfully');
                } catch (error) {
                    console.error('Failed to initialize scanner:', error);
                    setError('שגיאה בהפעלת הסורק. אנא וודא שהמצלמה זמינה ונסה שוב.');
                    setIsScanning(false);
                }
            }, 100);
        } catch (error) {
            console.error('Failed to start scanner:', error);
            setError('שגיאה בהפעלת הסורק. אנא וודא שהמצלמה זמינה ונסה שוב.');
            stopScanner();
        }
    };

    const stopScanner = () => {
        console.log('Stopping scanner...');
        if (scannerRef.current) {
            try {
                scannerRef.current.clear();
                scannerRef.current = null;
                lastScannedCode.current ="";
                setIsScanning(false);
                console.log('Scanner stopped successfully');
            } catch (error) {
                console.error('Error stopping scanner:', error);
                lastScannedCode.current = "";
                setIsScanning(false);
            }
        } else {
            lastScannedCode.current = "";
            setIsScanning(false);
        }
    };

    return (
        <Container>
            { getEnvVar('REACT_APP_DEBUG') && (
            <DebugToggle onClick={() => setDebugMode(!debugMode)}>
                {debugMode ? 'מצב דיבאג: פעיל' : 'מצב דיבאג: כבוי'}
            </DebugToggle>)}
            
            <Timer>זמן שנותר: {formatTime(timeLeft)}</Timer>
            {educationalText && (
                <EducationalBox>
                    <EducationalText>{educationalText}</EducationalText>
                </EducationalBox>
            )}
            <HintBox>
                <HintText>{hint || 'סרוק את קוד ה-QR הראשון כדי להתחיל'}</HintText>
            </HintBox>
            {error && (
                <HintBox style={{ background: theme.colors.error, color: theme.colors.white }}>
                    <HintText>{error}</HintText>
                </HintBox>
            )}
            <ScannerContainer ref={scannerContainerRef}>
                {isScanning && (
                    <div id="qr-reader" style={{ width: '100%', height: '400px', position: 'relative' }}></div>
                )}
            </ScannerContainer>
            <ScanButton onClick={isScanning ? stopScanner : startScanner}>
                {isScanning ? 'עצור סריקה' : 'התחל סריקה'}
            </ScanButton>
        </Container>
    );
};

export default Game; 
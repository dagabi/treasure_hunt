import React, { useState } from 'react';
import styled from 'styled-components';
import { theme } from '../theme';

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing.medium};
    max-width: 400px;
    margin: 0 auto;
    padding: ${theme.spacing.large};
    background: ${theme.colors.white};
    border-radius: ${theme.borderRadius};
    box-shadow: ${theme.boxShadow};
`;

const Input = styled.input`
    padding: ${theme.spacing.medium};
    border: 2px solid ${theme.colors.secondary};
    border-radius: ${theme.borderRadius};
    font-size: 16px;
    &:focus {
        outline: none;
        border-color: ${theme.colors.primary};
    }
`;

const Button = styled.button`
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

const Title = styled.h1`
    color: ${theme.colors.text};
    text-align: center;
    margin-bottom: ${theme.spacing.large};
`;

interface RegistrationProps {
    onRegister: (name: string, familyName: string) => void;
}

const Registration: React.FC<RegistrationProps> = ({ onRegister }) => {
    const [name, setName] = useState('');
    const [familyName, setFamilyName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onRegister(name, familyName);
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Title>הרשמה למשחק</Title>
            <Input
                type="text"
                placeholder="שם פרטי"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
            />
            <Input
                type="text"
                placeholder="שם משפחה"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
            />
            <Button type="submit">התחל משחק</Button>
        </Form>
    );
};

export default Registration; 
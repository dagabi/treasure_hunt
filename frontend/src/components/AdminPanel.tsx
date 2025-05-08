import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '../theme';
import axios from 'axios';
import { getEnvVar } from '../util/envVar';

const Container = styled.div`
    max-width: 800px;
    margin: 0 auto;
    padding: ${theme.spacing.large};
    text-align: center;
`;

const Title = styled.h1`
    color: ${theme.colors.primary};
    margin-bottom: ${theme.spacing.large};
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    margin-bottom: ${theme.spacing.large};
`;

const TableHeader = styled.th`
    background: ${theme.colors.primary};
    color: ${theme.colors.white};
    padding: ${theme.spacing.medium};
    border: 1px solid ${theme.colors.text};
`;

const TableCell = styled.td`
    padding: ${theme.spacing.medium};
    border: 1px solid ${theme.colors.text};
    text-align: center;
`;

const Button = styled.button`
    padding: ${theme.spacing.small};
    background: ${theme.colors.accent};
    color: ${theme.colors.white};
    border: none;
    border-radius: ${theme.borderRadius};
    cursor: pointer;
    &:hover {
        background: ${theme.colors.secondary};
    }
`;

const AdminPanel = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const apiUrl = getEnvVar('REACT_APP_API_URL') || '';
                const response = await axios.get(`${apiUrl}/api/admin/active-users`);
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, []);

    const updateLevel = async (playerId, newLevel) => {
        try {
            const apiUrl = getEnvVar('REACT_APP_API_URL') || '';
            await axios.put(`${apiUrl}/api/admin/update-level/${playerId}/${newLevel}`);
            setUsers(users.map(user => user.player_id === playerId ? { ...user, current_level: newLevel } : user));
        } catch (error) {
            console.error('Error updating level:', error);
        }
    };

    const removeUser = async (playerId) => {
        try {
            const apiUrl = getEnvVar('REACT_APP_API_URL') || '';
            await axios.delete(`${apiUrl}/api/admin/remove-user/${playerId}`);
            setUsers(users.filter(user => user.player_id !== playerId));
        } catch (error) {
            console.error('Error removing user:', error);
        }
    };

    return (
        <Container>
            <Title>Admin Panel</Title>
            <Table>
                <thead>
                    <tr>
                        <TableHeader>Name</TableHeader>
                        <TableHeader>Family Name</TableHeader>
                        <TableHeader>Time Left</TableHeader>
                        <TableHeader>Current Level</TableHeader>
                        <TableHeader>Actions</TableHeader>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.player_id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.family_name}</TableCell>
                            <TableCell>{user.time_left}</TableCell>
                            <TableCell>
                                <input
                                    type="number"
                                    value={user.current_level}
                                    onChange={(e) => updateLevel(user.player_id, parseInt(e.target.value, 10))}
                                />
                            </TableCell>
                            <TableCell>
                                <Button onClick={() => removeUser(user.player_id)}>Remove</Button>
                            </TableCell>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
};

export default AdminPanel;
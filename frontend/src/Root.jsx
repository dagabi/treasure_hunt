import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AdminPanel from './components/AdminPanel';
import App from './App';

const Root = () => {
    return (
        <Router>
            <Routes>
                <Route path="/administrator" element={<AdminPanel />} />
                <Route path="/*" element={<App />} />
            </Routes>
        </Router>
    );
};

export default Root;
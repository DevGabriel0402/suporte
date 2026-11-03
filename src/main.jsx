import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import FirebaseGate from './FirebaseGate';

import './styles/index.css';
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><FirebaseGate /></BrowserRouter></React.StrictMode>);


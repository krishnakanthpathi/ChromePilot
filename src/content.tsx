import React from 'react';
import { createRoot } from 'react-dom/client';
import { CommandPalette } from './components/CommandPalette';

console.log('[LeetCode Command Palette] Content script loaded.');

// Create a host element for the React app
const host = document.createElement('div');
host.id = 'leetcode-command-palette-host';
document.body.appendChild(host);

// Create a ShadowRoot to isolate styles
const shadowRoot = host.attachShadow({ mode: 'open' });

// Create the container element inside the shadow root
const rootElement = document.createElement('div');
shadowRoot.appendChild(rootElement);

// Render the React Command Palette component into the shadow root
const root = createRoot(rootElement);
root.render(<CommandPalette />);

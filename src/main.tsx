import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { CartProvider } from './contexts/CartContext.tsx';
import { DomainProvider } from './contexts/DomainContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <DomainProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </DomainProvider>
    </AuthProvider>
  </StrictMode>,
);

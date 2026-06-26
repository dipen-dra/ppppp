import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import Footer from '../src/layouts/Footer.jsx'; // Corrected path

describe('Footer Component', () => {
  test('renders the copyright text and current year', () => {
    render(<Footer />);
    const footerText = screen.getByText(`© ${new Date().getFullYear()} MotoFix. All rights reserved.`);
    expect(footerText).toBeInTheDocument();
  });

  test('renders the "Quick Links" section', () => {
    render(<Footer />);
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('About Us')).toBeInTheDocument();
  });

  test('renders the "Contact Info" section', () => {
    render(<Footer />);
    expect(screen.getByText('Contact Info')).toBeInTheDocument();
    expect(screen.getByText('Kathmandu, Nepal')).toBeInTheDocument();
    expect(screen.getByText('contact@motofix.com')).toBeInTheDocument();
  });

  test('renders the newsletter subscription form', () => {
    render(<Footer />);
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
  });
});
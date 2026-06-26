import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Header from '../src/layouts/Header.jsx';

describe('Header Component', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  test('renders the logo', () => {
    render(<BrowserRouter><Header /></BrowserRouter>);
    expect(screen.getByAltText(/motofix logo/i)).toBeInTheDocument();
  });

  test('renders all primary navigation links', () => {
    render(<BrowserRouter><Header /></BrowserRouter>);
    // Use `getAllBy` to handle separate mobile/desktop buttons
    expect(screen.getAllByRole('button', { name: /home/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /services/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /about us/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /contact/i })[0]).toBeInTheDocument();
  });

  test('renders Login and Register buttons', () => {
    render(<BrowserRouter><Header /></BrowserRouter>);
    expect(screen.getAllByText(/login/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/register/i).length).toBeGreaterThan(0);
  });

  test('toggles the mobile menu on click', () => {
    render(<BrowserRouter><Header /></BrowserRouter>);
    const menuButton = screen.getByRole('button', { name: /toggle menu/i });
    const mobileMenuContainer = menuButton.closest('nav').lastElementChild;

    expect(mobileMenuContainer.className).toContain('hidden');
    fireEvent.click(menuButton);
    expect(mobileMenuContainer.className).toContain('block');
    fireEvent.click(menuButton);
    expect(mobileMenuContainer.className).toContain('hidden');
  });
});
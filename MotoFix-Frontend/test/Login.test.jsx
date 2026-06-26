

import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../src/auth/AuthContext.jsx';
import { LoginForm } from '../src/components/auth/LoginForm.jsx';
import { SignupForm } from '../src/components/auth/SignupForm.jsx';
import { loginUserApi, registerUserApi } from '../src/api/authApi.js';

// --- Mocks ---
const mockLogin = vi.fn();
const mockOnSwitch = vi.fn();

// This is the correct way to mock the react-toastify library
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));
// Mock the API module
vi.mock('../src/api/authApi.js', () => ({
  loginUserApi: vi.fn(),
  registerUserApi: vi.fn(),
}));

// We need to import toast *after* the mock is defined.
import { toast } from 'react-toastify';


describe('LoginForm Component', () => {
  const renderLoginForm = () =>
    render(
      <AuthContext.Provider value={{ login: mockLogin }}>
        <BrowserRouter><LoginForm onSwitch={mockOnSwitch} /></BrowserRouter>
      </AuthContext.Provider>
    );

  beforeEach(() => { vi.clearAllMocks() });

  test('renders all login form fields correctly', () => {
    renderLoginForm();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  test('allows typing in email and password fields', () => {
    renderLoginForm();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    expect(screen.getByLabelText(/email/i).value).toBe('test@test.com');
  });

  test('shows an error toast if form is submitted with empty fields', async () => {
    renderLoginForm();
    const form = screen.getByRole('button', { name: /sign in/i }).closest('form');
    await act(async () => { fireEvent.submit(form); });
    expect(toast.error).toHaveBeenCalledWith('Please enter both email and password.');
  });
  
  test('calls login context and toasts success on successful submission', async () => {
    loginUserApi.mockResolvedValue({ data: { token: 'fake-token' } });
    renderLoginForm();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'good@user.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    const form = screen.getByRole('button', { name: /sign in/i }).closest('form');
    await act(async () => { fireEvent.submit(form); });
    
    expect(loginUserApi).toHaveBeenCalledWith({ email: 'good@user.com', password: 'password123' });
    expect(mockLogin).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Login successful!');
  });

  test('shows error toast on failed API call', async () => {
    loginUserApi.mockRejectedValue(new Error('Invalid credentials'));
    renderLoginForm();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bad@user.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } });
    
    const form = screen.getByRole('button', { name: /sign in/i }).closest('form');
    await act(async () => { fireEvent.submit(form); });
    
    expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
  });

  test('calls the switch function when "Sign Up" button is clicked', () => {
    renderLoginForm();
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(mockOnSwitch).toHaveBeenCalledTimes(1);
  });
});

describe('SignupForm Component', () => {
  const renderSignupForm = () => render(<BrowserRouter><SignupForm onSwitch={mockOnSwitch} /></BrowserRouter>);

  beforeEach(() => { vi.clearAllMocks() });

  test('renders all signup form fields correctly', () => {
    renderSignupForm();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /i agree to the/i })).toBeInTheDocument();
  });

  test('allows typing in all signup fields', () => {
    renderSignupForm();
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'signup@test.com' } });
    expect(screen.getByLabelText(/full name/i).value).toBe('Test User');
    expect(screen.getByLabelText(/email address/i).value).toBe('signup@test.com');
  });
  
  test('shows an error if submitted without filling fields', async () => {
    renderSignupForm();
    const form = screen.getByRole('button', { name: /create account/i }).closest('form');
    await act(async () => { fireEvent.submit(form); });
    expect(toast.error).toHaveBeenCalledWith('Please fill in all fields.');
  });
  
  test('shows an error if submitted without agreeing to terms', async () => {
    renderSignupForm();
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
    const form = screen.getByRole('button', { name: /create account/i }).closest('form');
    await act(async () => { fireEvent.submit(form); });
    expect(toast.error).toHaveBeenCalledWith('You must agree to the terms and conditions.');
  });
  
  test('calls register API and toasts success on valid submission', async () => {
    registerUserApi.mockResolvedValue({ data: { message: 'Success' } });
    renderSignupForm();

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'new@user.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('checkbox'));

    const form = screen.getByRole('button', { name: /create account/i }).closest('form');
    await act(async () => { fireEvent.submit(form); });
    
    expect(registerUserApi).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Sign up Successful");
  });

  test('enables submit button only after agreeing to terms', () => {
    renderSignupForm();
    const submitButton = screen.getByRole('button', { name: /create account/i });
    const termsCheckbox = screen.getByRole('checkbox', { name: /i agree to the/i });
    expect(submitButton).toBeDisabled();
    fireEvent.click(termsCheckbox);
    expect(submitButton).not.toBeDisabled();
  });

  test('calls the switch function when "Sign In" link is clicked', () => {
    renderSignupForm();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(mockOnSwitch).toHaveBeenCalledTimes(1);
  });
});
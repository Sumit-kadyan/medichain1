import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginPage from '../page';
import { useClinicContext } from '@/context/clinic-context';
import { useRouter } from 'next/navigation';

// Mock the context and router
jest.mock('@/context/clinic-context', () => ({
  useClinicContext: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('LoginPage', () => {
  const mockLogin = jest.fn();
  const mockRouterPush = jest.fn();

  beforeEach(() => {
    (useClinicContext as jest.Mock).mockReturnValue({
      login: mockLogin,
    });
    (useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush,
    });
  });

  it('renders the login form correctly', () => {
    render(<LoginPage />);

    // Check for title and description
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Enter your clinic credentials to access your dashboard.')).toBeInTheDocument();

    // Check for input fields and button
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });
});

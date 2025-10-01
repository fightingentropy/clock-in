import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

const mockRouter = {
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
};

let mockPathname = '/login';

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockPathname,
}));

import { signIn } from 'next-auth/react';
import { LoginForm } from './login-form';

const mockSignIn = signIn as unknown as ReturnType<typeof vi.fn>;

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/login';
  });

  it('navigates with replace when destination differs from current path', async () => {
    mockSignIn.mockResolvedValue({
      error: undefined,
      ok: true,
      status: 200,
      url: 'http://localhost/admin',
    });

    render(<LoginForm callbackUrl="/admin" />);

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
        email: 'admin@example.com',
        password: 'password123',
        callbackUrl: '/admin',
      }));
    });

    expect(mockRouter.replace).toHaveBeenCalledWith('/admin');
    expect(mockRouter.refresh).not.toHaveBeenCalled();
  });

  it('refreshes the page when destination matches the current path', async () => {
    mockSignIn.mockResolvedValue({
      error: undefined,
      ok: true,
      status: 200,
      url: 'http://localhost/login',
    });

    mockPathname = '/login';

    render(<LoginForm callbackUrl="/login" />);

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });

    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockRouter.refresh).toHaveBeenCalledTimes(1);
  });
});

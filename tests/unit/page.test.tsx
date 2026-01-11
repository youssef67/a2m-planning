import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home Page', () => {
  it('renders the canary page with correct title', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('A2M Planning');
  });

  it('displays the version number', () => {
    render(<Home />);

    expect(screen.getByText('v0.1')).toBeInTheDocument();
  });
});

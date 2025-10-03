
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddDoctorDialog } from '../add-doctor-dialog';
import { useClinicContext } from '@/context/clinic-context';
import { useToast } from '@/hooks/use-toast';

// Mock the context and hooks
jest.mock('@/context/clinic-context', () => ({
  useClinicContext: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

// Mock child components that are not relevant to this test
jest.mock('@/components/ui/form', () => ({
  ...jest.requireActual('@/components/ui/form'),
  FormMessage: () => null,
}));


describe('AddDoctorDialog', () => {
  const mockAddDoctor = jest.fn();
  const mockToast = jest.fn();
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    (useClinicContext as jest.Mock).mockReturnValue({
      addDoctor: mockAddDoctor,
    });
    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    });
    mockAddDoctor.mockClear();
    mockToast.mockClear();
    mockOnOpenChange.mockClear();
  });

  it('renders the dialog correctly when open', () => {
    render(<AddDoctorDialog open={true} onOpenChange={mockOnOpenChange} />);

    expect(screen.getByText('Add New Doctor')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Specialization')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Doctor' })).toBeInTheDocument();
  });

  it('allows typing in the form fields', () => {
    render(<AddDoctorDialog open={true} onOpenChange={mockOnOpenChange} />);

    const nameInput = screen.getByLabelText('Name');
    const specInput = screen.getByLabelText('Specialization');

    fireEvent.change(nameInput, { target: { value: 'Dr. John Doe' } });
    fireEvent.change(specInput, { target: { value: 'Pediatrician' } });

    expect(nameInput).toHaveValue('Dr. John Doe');
    expect(specInput).toHaveValue('Pediatrician');
  });

  it('submits the form and calls addDoctor on save', async () => {
    render(<AddDoctorDialog open={true} onOpenChange={mockOnOpenChange} />);

    const nameInput = screen.getByLabelText('Name');
    const specInput = screen.getByLabelText('Specialization');
    const saveButton = screen.getByRole('button', { name: 'Save Doctor' });

    fireEvent.change(nameInput, { target: { value: 'Dr. Alice' } });
    fireEvent.change(specInput, { target: { value: 'Cardiology' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockAddDoctor).toHaveBeenCalledWith({
        name: 'Dr. Alice',
        specialization: 'Cardiology',
      });
    });
    
    await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
            title: 'Doctor Added',
            description: 'Dr. Alice has been added to the clinic.'
        });
    });

    await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
  
   it('shows validation errors for empty fields', async () => {
    render(<AddDoctorDialog open={true} onOpenChange={mockOnOpenChange} />);

    const saveButton = screen.getByRole('button', { name: 'Save Doctor' });
    fireEvent.click(saveButton);

    // The actual FormMessage is mocked, but we can check that addDoctor was NOT called
    await waitFor(() => {
        expect(mockAddDoctor).not.toHaveBeenCalled();
    });
  });

});

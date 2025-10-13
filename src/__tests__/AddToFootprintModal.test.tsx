import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AddToFootprintModal from '../components/AddToFootprintModal';

// Mock the userFootprintApi
jest.mock('../services/userFootprintApi', () => ({
  trackFootprint: jest.fn(),
}));

const mockProduct = {
  id: '1',
  code: '1234567890123',
  product_name: 'Test Product',
  brands: ['Test Brand'],
  categories: ['Test Category'],
  carbon_footprint: 2.5,
  carbon_footprint_source: 'agribalyse',
  carbon_footprint_reference: 'Test Reference',
  has_barcode: true,
  is_base_component: false,
  source_database: 'test',
  product_type: 'food'
};

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('AddToFootprintModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render modal when open', () => {
    renderWithTheme(
      <AddToFootprintModal
        open={true}
        onClose={mockOnClose}
        product={mockProduct}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Add to My Footprint')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument(); // Default quantity
  });

  test('should not render modal when closed', () => {
    renderWithTheme(
      <AddToFootprintModal
        open={false}
        onClose={mockOnClose}
        product={mockProduct}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText('Add to My Footprint')).not.toBeInTheDocument();
  });

  test('should handle null product gracefully', () => {
    renderWithTheme(
      <AddToFootprintModal
        open={true}
        onClose={mockOnClose}
        product={null}
        onSuccess={mockOnSuccess}
      />
    );

    // Should not crash and should not show product-specific content
    expect(screen.queryByText('Test Product')).not.toBeInTheDocument();
  });

  test('should update quantity when input changes', () => {
    renderWithTheme(
      <AddToFootprintModal
        open={true}
        onClose={mockOnClose}
        product={mockProduct}
        onSuccess={mockOnSuccess}
      />
    );

    const quantityInput = screen.getByDisplayValue('1');
    fireEvent.change(quantityInput, { target: { value: '2' } });

    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
  });

  test('should update unit when selection changes', () => {
    renderWithTheme(
      <AddToFootprintModal
        open={true}
        onClose={mockOnClose}
        product={mockProduct}
        onSuccess={mockOnSuccess}
      />
    );

    // Find and click the unit selector
    const unitSelect = screen.getByRole('combobox');
    fireEvent.mouseDown(unitSelect);

    // Wait for dropdown to appear and select 'kg'
    waitFor(() => {
      const kgOption = screen.getByText('kg');
      fireEvent.click(kgOption);
    });
  });

  test('should calculate total carbon footprint correctly', () => {
    renderWithTheme(
      <AddToFootprintModal
        open={true}
        onClose={mockOnClose}
        product={mockProduct}
        onSuccess={mockOnSuccess}
      />
    );

    const quantityInput = screen.getByDisplayValue('1');
    fireEvent.change(quantityInput, { target: { value: '2' } });

    // Should show calculated total (2 * 2.5 = 5.0)
    expect(screen.getByText(/5\.00 kg CO₂e/)).toBeInTheDocument();
  });

  test('should call onClose when cancel button is clicked', () => {
    renderWithTheme(
      <AddToFootprintModal
        open={true}
        onClose={mockOnClose}
        product={mockProduct}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('should validate quantity input', () => {
    renderWithTheme(
      <AddToFootprintModal
        open={true}
        onClose={mockOnClose}
        product={mockProduct}
        onSuccess={mockOnSuccess}
      />
    );

    const quantityInput = screen.getByDisplayValue('1');
    
    // Test invalid quantity (0)
    fireEvent.change(quantityInput, { target: { value: '0' } });
    const addButton = screen.getByText('Add to Footprint');
    
    // Button should be disabled or show error
    expect(addButton).toBeDisabled();
  });

  test('should handle form submission', async () => {
    const userFootprintApi = require('../services/userFootprintApi');
    userFootprintApi.trackFootprint.mockResolvedValue({ success: true });

    renderWithTheme(
      <AddToFootprintModal
        open={true}
        onClose={mockOnClose}
        product={mockProduct}
        onSuccess={mockOnSuccess}
      />
    );

    const addButton = screen.getByText('Add to Footprint');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(userFootprintApi.trackFootprint).toHaveBeenCalledWith({
        product_id: '1',
        product_name: 'Test Product',
        quantity: 1,
        unit: 'item',
        total_footprint: 2.5,
        categories: ['Test Category'],
        carbon_footprint_source: 'agribalyse',
        carbon_footprint_reference: 'Test Reference'
      });
    });
  });

  test('should handle API errors gracefully', async () => {
    const userFootprintApi = require('../services/userFootprintApi');
    userFootprintApi.trackFootprint.mockRejectedValue(new Error('API Error'));

    renderWithTheme(
      <AddToFootprintModal
        open={true}
        onClose={mockOnClose}
        product={mockProduct}
        onSuccess={mockOnSuccess}
      />
    );

    const addButton = screen.getByText('Add to Footprint');
    fireEvent.click(addButton);

    await waitFor(() => {
      // Should show error message or handle error gracefully
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('should show loading state during submission', async () => {
    const userFootprintApi = require('../services/userFootprintApi');
    userFootprintApi.trackFootprint.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    renderWithTheme(
      <AddToFootprintModal
        open={true}
        onClose={mockOnClose}
        product={mockProduct}
        onSuccess={mockOnSuccess}
      />
    );

    const addButton = screen.getByText('Add to Footprint');
    fireEvent.click(addButton);

    // Should show loading state
    expect(addButton).toBeDisabled();
  });
});

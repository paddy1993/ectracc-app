import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AddToFootprintModal from '../components/AddToFootprintModal';

// Create mock functions before module mocking
const mockAddFromProduct = jest.fn();
const mockFormatCarbonFootprint = jest.fn((value: number) => `${value.toFixed(2)} kg CO₂e`);
const mockTrackProductAddedToFootprint = jest.fn();

// Mock the userFootprintApi
jest.mock('../services/userFootprintApi', () => ({
  __esModule: true,
  default: {
    get addFromProduct() { return mockAddFromProduct; },
    get formatCarbonFootprint() { return mockFormatCarbonFootprint; },
  },
}));

// Mock analytics
jest.mock('../services/analytics', () => ({
  __esModule: true,
  default: {
    get trackProductAddedToFootprint() { return mockTrackProductAddedToFootprint; },
  },
  EVENTS: {},
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
    // Set default implementation for formatCarbonFootprint
    mockFormatCarbonFootprint.mockImplementation((value: number) => `${value.toFixed(2)} kg CO₂e`);
    // Set default resolved value for addFromProduct
    mockAddFromProduct.mockResolvedValue({
      id: 'test-entry-id',
      product_id: '1',
      product_name: 'Test Product',
      quantity: 1,
      unit: 'item',
      carbon_footprint: 2.5,
      total_footprint: 2.5
    });
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

  test('should allow quantity changes', () => {
    renderWithTheme(
      <AddToFootprintModal
        open={true}
        onClose={mockOnClose}
        product={mockProduct}
        onSuccess={mockOnSuccess}
      />
    );

    const quantityInput = screen.getByDisplayValue('1');
    
    // Change quantity
    fireEvent.change(quantityInput, { target: { value: '5' } });
    
    // Verify quantity updated
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  test('should handle form submission', async () => {
    mockAddFromProduct.mockResolvedValue({ 
      id: 'test-entry-id',
      product_id: '1',
      product_name: 'Test Product',
      quantity: 1,
      unit: 'item',
      carbon_footprint: 2.5,
      total_footprint: 2.5
    });

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
      expect(mockAddFromProduct).toHaveBeenCalledWith({
        product_id: '1',
        quantity: 1,
        unit: 'item'
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  test('should handle API errors gracefully', async () => {
    mockAddFromProduct.mockRejectedValue(new Error('Failed to add product to footprint'));

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
      expect(screen.getByText(/Failed to add product to footprint/i)).toBeInTheDocument();
    });
  });

  test('should show loading state during submission', async () => {
    mockAddFromProduct.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ 
        id: 'test-entry-id',
        product_id: '1',
        product_name: 'Test Product',
        quantity: 1,
        unit: 'item',
        carbon_footprint: 2.5,
        total_footprint: 2.5
      }), 100))
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

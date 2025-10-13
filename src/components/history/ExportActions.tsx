import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  Download,
  FileDownload,
  Share,
  Image as ImageIcon,
  TableChart
} from '@mui/icons-material';
import { UserFootprintEntry } from '../../services/userFootprintApi';

interface ExportActionsProps {
  entries: UserFootprintEntry[];
  chartData?: any[];
  categoryData?: any[];
  onExportComplete?: (type: string) => void;
}

export default function ExportActions({ 
  entries, 
  chartData, 
  categoryData, 
  onExportComplete 
}: ExportActionsProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const formatCarbonFootprint = (value: number) => {
    if (value === 0) return '0g CO₂e';
    if (value < 1000) return `${Math.round(value)}g CO₂e`;
    return `${(value / 1000).toFixed(1)}kg CO₂e`;
  };

  const exportToCSV = async () => {
    setExporting('csv');
    try {
      const headers = [
        'Date',
        'Product Name',
        'Category',
        'Quantity',
        'Unit',
        'Carbon Footprint (g CO₂e)',
        'Total Carbon (g CO₂e)'
      ];

      const csvData = entries.map(entry => [
        new Date(entry.date_added).toLocaleDateString(),
        entry.product_name || 'Manual Entry',
        (entry as any).category || 'Unknown',
        entry.quantity.toString(),
        entry.unit || 'item',
        entry.carbon_footprint.toString(),
        (entry.carbon_footprint * entry.quantity).toString()
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ectracc-history-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onExportComplete?.('csv');
    } catch (error) {
      console.error('Export to CSV failed:', error);
    } finally {
      setExporting(null);
      handleClose();
    }
  };

  const exportSummaryReport = async () => {
    setExporting('summary');
    try {
      const totalEntries = entries.length;
      const totalCarbon = entries.reduce((sum, entry) => sum + (entry.carbon_footprint * entry.quantity), 0);
      const avgCarbon = totalEntries > 0 ? totalCarbon / totalEntries : 0;
      
      const categoryBreakdown = entries.reduce((acc, entry) => {
        const category = (entry as any).category || 'Other';
        if (!acc[category]) {
          acc[category] = { total: 0, count: 0 };
        }
        acc[category].total += entry.carbon_footprint * entry.quantity;
        acc[category].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      const reportContent = [
        'ECTRACC Carbon Footprint Summary Report',
        `Generated: ${new Date().toLocaleDateString()}`,
        '',
        'OVERVIEW',
        `Total Entries: ${totalEntries}`,
        `Total Carbon Footprint: ${formatCarbonFootprint(totalCarbon)}`,
        `Average per Entry: ${formatCarbonFootprint(avgCarbon)}`,
        '',
        'CATEGORY BREAKDOWN',
        ...Object.entries(categoryBreakdown).map(([category, data]) => 
          `${category}: ${formatCarbonFootprint(data.total)} (${data.count} entries)`
        ),
        '',
        'DETAILED ENTRIES',
        'Date,Product,Category,Quantity,Unit,Carbon Footprint',
        ...entries.map(entry => 
          `${new Date(entry.date_added).toLocaleDateString()},${entry.product_name || 'Manual Entry'},${(entry as any).category || 'Unknown'},${entry.quantity},${entry.unit || 'item'},${formatCarbonFootprint(entry.carbon_footprint * entry.quantity)}`
        )
      ].join('\n');

      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ectracc-summary-${new Date().toISOString().split('T')[0]}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onExportComplete?.('summary');
    } catch (error) {
      console.error('Export summary failed:', error);
    } finally {
      setExporting(null);
      handleClose();
    }
  };

  const shareData = async () => {
    setExporting('share');
    try {
      const totalCarbon = entries.reduce((sum, entry) => sum + (entry.carbon_footprint * entry.quantity), 0);
      const shareText = `My carbon footprint tracking: ${formatCarbonFootprint(totalCarbon)} across ${entries.length} entries. Track yours with ECTRACC! 🌱`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'My Carbon Footprint - ECTRACC',
          text: shareText,
          url: window.location.origin
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareText);
        // You could show a snackbar here indicating text was copied
      }

      onExportComplete?.('share');
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setExporting(null);
      handleClose();
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<Download />}
        onClick={handleClick}
        disabled={entries.length === 0}
        sx={{
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2
          }
        }}
      >
        Export
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={exportToCSV} disabled={exporting === 'csv'}>
          <ListItemIcon>
            {exporting === 'csv' ? (
              <CircularProgress size={20} />
            ) : (
              <TableChart />
            )}
          </ListItemIcon>
          <ListItemText>Export as CSV</ListItemText>
        </MenuItem>

        <MenuItem onClick={exportSummaryReport} disabled={exporting === 'summary'}>
          <ListItemIcon>
            {exporting === 'summary' ? (
              <CircularProgress size={20} />
            ) : (
              <FileDownload />
            )}
          </ListItemIcon>
          <ListItemText>Summary Report</ListItemText>
        </MenuItem>

        <MenuItem onClick={shareData} disabled={exporting === 'share'}>
          <ListItemIcon>
            {exporting === 'share' ? (
              <CircularProgress size={20} />
            ) : (
              <Share />
            )}
          </ListItemIcon>
          <ListItemText>Share Summary</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

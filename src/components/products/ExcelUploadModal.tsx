'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Loader2,
  Table as TableIcon,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { productsApi } from '@/lib/api';
import { ProductDto } from '@/lib/types';
import { useToast } from '@/lib/toast';
import * as XLSX from 'xlsx';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (products: ProductDto[]) => void;
}

interface ParsedPreviewRow {
  name: string;
  stockQuantity: number | string;
  description: string;
  categoryName: string;
  unitPrice: number | string;
}

export default function ExcelUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: ExcelUploadModalProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preview state
  const [previewRows, setPreviewRows] = useState<ParsedPreviewRow[]>([]);
  const [totalRowsCount, setTotalRowsCount] = useState(0);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [showGuidelines, setShowGuidelines] = useState(false);

  // Result state
  const [uploadResult, setUploadResult] = useState<{
    uploadedProducts: ProductDto[];
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset modal state
  const handleReset = () => {
    setFile(null);
    setPreviewRows([]);
    setTotalRowsCount(0);
    setPreviewHeaders([]);
    setErrorMessage(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      const sampleData = [
        ['Name', 'Stock Quantity', 'Description', 'Category', 'Unit Price'],
        ['Logitech MX Master 3S', 25, 'High precision ergonomic wireless mouse', 'Electronics', 99.99],
        ['Keychron K2 Mechanical Keyboard', 15, '75% layout wireless mechanical keyboard with RGB', 'Electronics', 89.00],
        ['Dell UltraSharp 27 4K Monitor', 10, '27-inch 4K UHD IPS display with USB-C hub', 'Displays', 499.50],
        ['Ergonomic Office Chair', 8, 'Breathable mesh lumbar support desk chair', 'Furniture', 219.00],
        ['Sony WH-1000XM5 Headphones', 20, 'Industry-leading noise cancelling wireless headphones', 'Audio', 398.00],
      ];

      const ws = XLSX.utils.aoa_to_sheet(sampleData);

      // Set nice column widths
      ws['!cols'] = [
        { wch: 32 }, // Name
        { wch: 16 }, // Stock Quantity
        { wch: 45 }, // Description
        { wch: 18 }, // Category
        { wch: 14 }, // Unit Price
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      XLSX.writeFile(wb, 'inventory_products_template.xlsx');
      toastSuccess('Template downloaded', 'Use this file format for bulk product imports.');
    } catch (err: unknown) {
      const e = err as Error;
      toastError('Download failed', e.message);
    }
  };

  // Parse Excel file for client-side preview and verification
  const parseExcelPreview = (selectedFile: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) return;

        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setErrorMessage('The Excel file appears to be empty.');
          return;
        }

        const sheet = workbook.Sheets[sheetName];
        // Read raw 2D array
        const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          blankrows: false,
        });

        if (!rawData || rawData.length <= 1) {
          setErrorMessage('The file contains a header or is empty, but no data rows were found.');
          return;
        }

        const headers = (rawData[0] || []).map((h) => String(h || ''));
        setPreviewHeaders(headers);

        const dataRows = rawData.slice(1);
        const parsedRows: ParsedPreviewRow[] = [];

        dataRows.forEach((row) => {
          const name = row[0] !== undefined && row[0] !== null ? String(row[0]).trim() : '';
          if (!name) return; // Skip rows where name is blank (matching backend logic)

          parsedRows.push({
            name,
            stockQuantity: row[1] !== undefined ? (Number(row[1]) || 0) : 0,
            description: row[2] !== undefined && row[2] !== null ? String(row[2]) : '',
            categoryName: row[3] !== undefined && row[3] !== null ? String(row[3]) : 'General',
            unitPrice: row[4] !== undefined ? (Number(row[4]) || 0) : 0,
          });
        });

        setTotalRowsCount(parsedRows.length);
        setPreviewRows(parsedRows.slice(0, 5));
        setErrorMessage(null);
      } catch (err: unknown) {
        console.error(err);
        setErrorMessage('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.');
      }
    };

    reader.onerror = () => {
      setErrorMessage('Failed to read the selected file.');
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processSelectedFile(selected);
    }
  };

  const processSelectedFile = (selected: File) => {
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = selected.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setErrorMessage('Invalid file format. Please upload an Excel document (.xlsx or .xls).');
      setFile(null);
      return;
    }

    setErrorMessage(null);
    setFile(selected);
    parseExcelPreview(selected);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processSelectedFile(droppedFile);
    }
  };

  // Execute Upload
  const handleUpload = async () => {
    if (!file) {
      setErrorMessage('Please select an Excel file to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const res = await productsApi.uploadExcel(file);
      const addedList = res.products || [];

      setUploadResult({
        uploadedProducts: addedList,
        message: res.message || 'Products uploaded successfully',
      });

      toastSuccess(
        'Upload Complete',
        `${addedList.length} product(s) successfully added to inventory.`
      );

      // Notify parent to refresh list
      onSuccess(addedList);
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'Upload failed. Please check the backend connection and try again.');
      toastError('Upload Failed', e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatCurrency = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(num);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Import Products via Excel"
      maxWidth="720px"
    >
      {/* SUCCESS RESULT VIEW */}
      {uploadResult ? (
        <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 0 20px var(--success-border)',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Products Processed Successfully!
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {uploadResult.uploadedProducts.length > 0 ? (
              <>
                Added <strong>{uploadResult.uploadedProducts.length}</strong> new product(s) to your catalog.
                {totalRowsCount > uploadResult.uploadedProducts.length && (
                  <span style={{ display: 'block', marginTop: '0.25rem', color: 'var(--warning)' }}>
                    Note: {totalRowsCount - uploadResult.uploadedProducts.length} item(s) already existed and were skipped.
                  </span>
                )}
              </>
            ) : (
              <span style={{ color: 'var(--warning)' }}>
                0 new items added. Any products with names that already exist in your database were skipped.
              </span>
            )}
          </p>

          {/* List of imported products if any */}
          {uploadResult.uploadedProducts.length > 0 && (
            <div className="excel-preview-container" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadResult.uploadedProducts.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>
                        <span className="badge badge-neutral">{p.categoryName}</span>
                      </td>
                      <td>{p.stockQuantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(p.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button onClick={handleReset} className="btn btn-secondary">
              Upload Another Spreadsheet
            </button>
            <button onClick={handleModalClose} className="btn btn-primary">
              Done & View Inventory
            </button>
          </div>
        </div>
      ) : (
        /* UPLOAD & PREVIEW VIEW */
        <div>
          {/* Template Download Banner */}
          <div className="template-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  Need the Excel Format?
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Download the sample template with pre-configured columns & examples.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="btn btn-secondary btn-sm"
              style={{ flexShrink: 0, gap: '0.4rem' }}
            >
              <Download size={14} />
              <span>Get Template</span>
            </button>
          </div>

          {/* Quick Format Guidelines Toggle */}
          <div style={{ marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setShowGuidelines(!showGuidelines)}
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                padding: '0.25rem 0.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <HelpCircle size={14} />
              <span>{showGuidelines ? 'Hide column specifications' : 'View required column layout'}</span>
            </button>

            {showGuidelines && (
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Sheet Requirements (First Sheet, Row 1 = Headers):
                </div>
                <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <li><strong>Col A: Name</strong> (String, required - unique product title)</li>
                  <li><strong>Col B: Stock Quantity</strong> (Integer number, e.g. 50)</li>
                  <li><strong>Col C: Description</strong> (String, e.g. features/specs)</li>
                  <li><strong>Col D: Category</strong> (String - created automatically if not existing)</li>
                  <li><strong>Col E: Unit Price</strong> (Numeric value, e.g. 29.99)</li>
                </ol>
              </div>
            )}
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger)',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* File Input */}
          <input
            id="excel-file-input"
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }}
            onChange={handleFileChange}
          />

          {/* Dropzone Area or File Selected View */}
          {!file ? (
            <div
              className={`dropzone ${isDragging ? 'drag-active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="dropzone-icon-box">
                <Upload size={24} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                Click to browse or drag & drop Excel file
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                Supports standard .xlsx and .xls spreadsheets (up to 10MB)
              </div>
            </div>
          ) : (
            <div>
              {/* Selected File Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1.125rem',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-card)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileSpreadsheet size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatFileSize(file.size)} • {totalRowsCount} valid items detected
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-ghost btn-sm"
                    disabled={isUploading}
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn btn-ghost btn-icon"
                    style={{ color: 'var(--danger)', padding: '6px' }}
                    title="Remove File"
                    disabled={isUploading}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Data Preview Table */}
              {previewRows.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                      <TableIcon size={14} /> Previewing First {previewRows.length} of {totalRowsCount} Rows
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Ready to import
                    </span>
                  </div>

                  <div className="excel-preview-container">
                    <table className="data-table" style={{ fontSize: '0.8125rem' }}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Stock</th>
                          <th>Unit Price</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {row.name}
                            </td>
                            <td>
                              <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                                {row.categoryName}
                              </span>
                            </td>
                            <td>{row.stockQuantity}</td>
                            <td style={{ fontWeight: 600 }}>{formatCurrency(row.unitPrice)}</td>
                            <td
                              style={{
                                color: 'var(--text-muted)',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {row.description || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={handleModalClose}
              className="btn btn-secondary"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              id="import-submit-btn"
              type="button"
              onClick={handleUpload}
              className="btn btn-primary"
              disabled={!file || isUploading || totalRowsCount === 0}
              style={{ minWidth: '140px' }}
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Import Products</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

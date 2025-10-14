import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Developer } from '../types';
import { Upload, Download, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';

interface BulkAddDevelopersProps {
  onClose: () => void;
}

interface ImportResult {
  success: Developer[];
  failed: Array<{ row: number; error: string; data: any }>;
}

const BulkAddDevelopers: React.FC<BulkAddDevelopersProps> = ({ onClose }) => {
  const { addDeveloper, developers } = useData();
  const [importData, setImportData] = useState('');
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('csv');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const downloadTemplate = () => {
    if (importFormat === 'csv') {
      const csv = 'name,email,skills\nJohn Doe,john@example.com,"React,TypeScript,Node.js"\nJane Smith,jane@example.com,"Python,Django,PostgreSQL"';
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'developers_template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const json = JSON.stringify([
        {
          name: 'John Doe',
          email: 'john@example.com',
          skills: ['React', 'TypeScript', 'Node.js']
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          skills: ['Python', 'Django', 'PostgreSQL']
        }
      ], null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'developers_template.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const parseCSV = (csv: string): any[] => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const developers = [];

    for (let i = 1; i < lines.length; i++) {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      // Parse CSV handling quoted values
      for (let char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      if (values.length === headers.length) {
        const dev: any = {};
        headers.forEach((header, index) => {
          if (header === 'skills') {
            // Parse skills from comma-separated string or quoted string
            const skillsStr = values[index].replace(/^"|"$/g, '');
            dev.skills = skillsStr.split(',').map((s: string) => s.trim()).filter((s: string) => s);
          } else {
            dev[header] = values[index];
          }
        });
        developers.push(dev);
      }
    }

    return developers;
  };

  const validateDeveloper = (dev: any): { valid: boolean; error?: string } => {
    if (!dev.name || typeof dev.name !== 'string') {
      return { valid: false, error: 'Name is required and must be a string' };
    }
    if (!dev.email || typeof dev.email !== 'string') {
      return { valid: false, error: 'Email is required and must be a string' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dev.email)) {
      return { valid: false, error: 'Invalid email format' };
    }
    if (developers.some(d => d.email === dev.email)) {
      return { valid: false, error: 'Email already exists in database' };
    }
    if (!dev.skills || !Array.isArray(dev.skills) || dev.skills.length === 0) {
      return { valid: false, error: 'Skills is required and must be a non-empty array' };
    }
    return { valid: true };
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      alert('Please enter data to import');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      let parsedData: any[];

      if (importFormat === 'csv') {
        parsedData = parseCSV(importData);
      } else {
        parsedData = JSON.parse(importData);
        if (!Array.isArray(parsedData)) {
          throw new Error('JSON must be an array of developer objects');
        }
      }

      const success: Developer[] = [];
      const failed: Array<{ row: number; error: string; data: any }> = [];

      for (let i = 0; i < parsedData.length; i++) {
        const dev = parsedData[i];
        const validation = validateDeveloper(dev);

        if (!validation.valid) {
          failed.push({
            row: i + 1,
            error: validation.error!,
            data: dev
          });
          continue;
        }

        try {
          const newDev: Developer = {
            id: `dev${Date.now()}_${i}`,
            name: dev.name,
            email: dev.email,
            skills: dev.skills,
            avatar: dev.avatar || undefined,
          };

          await addDeveloper(newDev);
          success.push(newDev);
        } catch (error: any) {
          failed.push({
            row: i + 1,
            error: error.message || 'Failed to add developer',
            data: dev
          });
        }
      }

      setResult({ success, failed });
    } catch (error: any) {
      alert(`Failed to parse ${importFormat.toUpperCase()}: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Upload className="w-6 h-6 text-primary-600" />
              Bulk Add Developers
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Import multiple developers at once using CSV or JSON format
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Import Format
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="csv"
                  checked={importFormat === 'csv'}
                  onChange={() => setImportFormat('csv')}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-gray-700">CSV (Comma-separated)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="json"
                  checked={importFormat === 'json'}
                  onChange={() => setImportFormat('json')}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-gray-700">JSON</span>
              </label>
            </div>
          </div>

          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900">Need a template?</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Download a sample {importFormat.toUpperCase()} file to see the required format
                </p>
                <button
                  onClick={downloadTemplate}
                  className="mt-2 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <Download className="w-4 h-4" />
                  Download {importFormat.toUpperCase()} Template
                </button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File (Optional)
            </label>
            <input
              type="file"
              accept={importFormat === 'csv' ? '.csv' : '.json'}
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          {/* Manual Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Paste {importFormat.toUpperCase()} Data
            </label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              rows={10}
              placeholder={
                importFormat === 'csv'
                  ? 'name,email,skills\nJohn Doe,john@example.com,"React,TypeScript,Node.js"'
                  : '[\n  {\n    "name": "John Doe",\n    "email": "john@example.com",\n    "skills": ["React", "TypeScript"]\n  }\n]'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Format Help */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              {importFormat === 'csv' ? 'CSV Format' : 'JSON Format'}:
            </h4>
            {importFormat === 'csv' ? (
              <div className="text-sm text-gray-700 space-y-1">
                <p>• First row must be headers: <code className="bg-gray-200 px-1 rounded">name,email,skills</code></p>
                <p>• Skills should be comma-separated within quotes</p>
                <p>• Example: <code className="bg-gray-200 px-1 rounded">Alice,alice@company.com,"React,TypeScript"</code></p>
              </div>
            ) : (
              <div className="text-sm text-gray-700 space-y-1">
                <p>• Must be a JSON array of objects</p>
                <p>• Required fields: <code className="bg-gray-200 px-1 rounded">name</code>, <code className="bg-gray-200 px-1 rounded">email</code>, <code className="bg-gray-200 px-1 rounded">skills</code></p>
                <p>• Skills must be an array of strings</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={isProcessing || !importData.trim()}
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Import Developers
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {result.success.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-green-900">
                        Successfully Added {result.success.length} Developer{result.success.length !== 1 ? 's' : ''}
                      </h3>
                      <div className="mt-2 space-y-1">
                        {result.success.map((dev, idx) => (
                          <p key={idx} className="text-sm text-green-700">
                            ✓ {dev.name} ({dev.email})
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {result.failed.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-red-900">
                        Failed to Add {result.failed.length} Developer{result.failed.length !== 1 ? 's' : ''}
                      </h3>
                      <div className="mt-2 space-y-2">
                        {result.failed.map((fail, idx) => (
                          <div key={idx} className="text-sm">
                            <p className="text-red-700 font-medium">Row {fail.row}:</p>
                            <p className="text-red-600 ml-4">• {fail.error}</p>
                            <p className="text-red-500 ml-4 text-xs">
                              Data: {JSON.stringify(fail.data)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkAddDevelopers;


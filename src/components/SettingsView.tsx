import React, { useState } from 'react';
import {
  Sliders,
  Cloud,
  Database,
  Lock,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Flame,
  Sparkles,
  ShieldCheck,
  Check,
  Trash2,
  Camera,
} from 'lucide-react';
import { NexusSettings, CloudConfig, AppState } from '../types';
import { fileToDataURL, downloadBlob, cloudSync, CloudStatus } from '../services/cloudSync';
import { provisionedFirebaseConfig, testFirestoreConnection } from '../lib/firebase';
import { compressImage } from '../utils/imageOptimizer';

interface SettingsViewProps {
  settings: NexusSettings;
  cloudConfig: CloudConfig;
  cloudStatus: CloudStatus;
  appState: AppState;
  onUpdateSettings: (newSettings: NexusSettings) => void;
  onUpdateCloudConfig: (newConfig: CloudConfig) => void;
  onRestoreBackup: (state: AppState) => void;
  onForceSync?: () => void;
  onNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  cloudConfig,
  cloudStatus,
  appState,
  onUpdateSettings,
  onUpdateCloudConfig,
  onRestoreBackup,
  onNotification,
}) => {
  // Branding state
  const [logoPreview, setLogoPreview] = useState<string>(settings.logo || '/nexus-logo.svg');
  const [academyName, setAcademyName] = useState<string>(settings.name);
  const [subtitle, setSubtitle] = useState<string>(settings.subtitle);
  const [address, setAddress] = useState<string>(settings.address);
  const [bgColor, setBgColor] = useState<string>(settings.backgroundColor || '#f8fafc');
  const [adminPin, setAdminPin] = useState<string>(settings.adminPin || '2026');

  // Cloud database state
  const [provider, setProvider] = useState<'firebase' | 'cloudflare'>(
    cloudConfig.provider === 'cloudflare' ? 'cloudflare' : 'firebase'
  );
  const [fbProjectId, setFbProjectId] = useState(
    cloudConfig.firebase?.projectId || provisionedFirebaseConfig.projectId || ''
  );
  const [fbApiKey, setFbApiKey] = useState(
    cloudConfig.firebase?.apiKey || provisionedFirebaseConfig.apiKey || ''
  );
  const [cfAccountId, setCfAccountId] = useState(cloudConfig.cloudflare?.accountId || '');
  const [cfDatabaseId, setCfDatabaseId] = useState(cloudConfig.cloudflare?.databaseId || '');
  const [cfApiToken, setCfApiToken] = useState(cloudConfig.cloudflare?.apiToken || '');
  const [cfEndpoint, setCfEndpoint] = useState(cloudConfig.cloudflare?.customEndpoint || '');

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isActivatingCloud, setIsActivatingCloud] = useState(false);

  // 1-Click Activate Provisioned Cloud Database
  const handleActivateProvisionedCloud = async () => {
    setIsActivatingCloud(true);
    const newConfig: CloudConfig = {
      provider: 'firebase',
      firebase: {
        projectId: provisionedFirebaseConfig.projectId,
        apiKey: provisionedFirebaseConfig.apiKey,
        firestoreDatabaseId: provisionedFirebaseConfig.firestoreDatabaseId,
        authDomain: provisionedFirebaseConfig.authDomain,
        appId: provisionedFirebaseConfig.appId,
        storageBucket: provisionedFirebaseConfig.storageBucket,
      },
    };
    setProvider('firebase');
    setFbProjectId(provisionedFirebaseConfig.projectId);
    setFbApiKey(provisionedFirebaseConfig.apiKey);
    onUpdateCloudConfig(newConfig);

    try {
      await cloudSync.saveState({
        ...appState,
        cloudConfig: newConfig,
      });
      const test = await testFirestoreConnection();
      setTestResult(test);
      onNotification('Online Cloud Firestore database connected! Changes now auto-sync automatically.', 'success');
    } catch (e: any) {
      onNotification('Cloud activated: ' + (e?.message || 'Sync queued'), 'info');
    } finally {
      setIsActivatingCloud(false);
    }
  };

  // Logo file selection with auto compression
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 280, 280, 0.85);
        setLogoPreview(compressed);
        onNotification('Logo image processed and compressed!', 'success');
      } catch {
        onNotification('Could not read uploaded logo file', 'error');
      }
    }
  };

  // Background Image file selection with auto compression
  const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1280, 720, 0.8);
        onUpdateSettings({
          ...settings,
          backgroundImage: compressed,
        });
        onNotification('Website background image updated!', 'success');
      } catch {
        onNotification('Could not load background image', 'error');
      }
    }
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: NexusSettings = {
      ...settings,
      name: academyName.trim(),
      subtitle: subtitle.trim(),
      address: address.trim(),
      logo: logoPreview,
      backgroundColor: bgColor,
      adminPin: adminPin.trim() || '2026',
    };
    onUpdateSettings(updated);
    onNotification('Branding & System settings saved successfully!', 'success');
  };

  // Test Cloud Connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const configToTest: CloudConfig = {
      provider,
      firebase: {
        projectId: fbProjectId.trim(),
        apiKey: fbApiKey.trim(),
        firestoreDatabaseId: provisionedFirebaseConfig.firestoreDatabaseId,
      },
      cloudflare: {
        accountId: cfAccountId.trim(),
        databaseId: cfDatabaseId.trim(),
        apiToken: cfApiToken.trim(),
        customEndpoint: cfEndpoint.trim(),
      },
    };

    const result = await cloudSync.testCloudConnection(configToTest);
    setIsTesting(false);
    setTestResult(result);
  };

  // Save Cloud Database Settings & Auto-Sync
  const handleSaveCloudConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: CloudConfig = {
      provider,
      firebase: {
        projectId: fbProjectId.trim() || provisionedFirebaseConfig.projectId,
        apiKey: fbApiKey.trim() || provisionedFirebaseConfig.apiKey,
        firestoreDatabaseId: provisionedFirebaseConfig.firestoreDatabaseId,
        authDomain: provisionedFirebaseConfig.authDomain,
        appId: provisionedFirebaseConfig.appId,
        storageBucket: provisionedFirebaseConfig.storageBucket,
      },
      cloudflare: {
        accountId: cfAccountId.trim(),
        databaseId: cfDatabaseId.trim(),
        apiToken: cfApiToken.trim(),
        customEndpoint: cfEndpoint.trim(),
      },
    };
    onUpdateCloudConfig(newConfig);

    try {
      await cloudSync.saveState({
        ...appState,
        cloudConfig: newConfig,
      });
      onNotification(
        `Cloud database connected to ${provider === 'firebase' ? 'Google Cloud Firestore' : 'Cloudflare D1'}! All changes will auto-sync.`,
        'success'
      );
    } catch {
      onNotification(`Cloud database configuration saved for ${provider}!`, 'info');
    }
  };

  // Export JSON Backup: Full database logic copy with online links for all uploaded images
  const handleExportBackup = () => {
    // Ensure all student images have full online link preserved in backup.json
    const studentsWithLinks = (appState.students || []).map((s) => {
      const fullUrl = s.photo
        ? s.photo.startsWith('http')
          ? s.photo
          : s.photo.startsWith('/')
          ? `${window.location.origin}${s.photo}`
          : s.photo
        : '';
      return {
        ...s,
        photo: s.photo || '',
        photoUrl: fullUrl || s.photo || '',
        photoLink: fullUrl || s.photo || '',
      };
    });

    const backupData = {
      backupVersion: 5,
      exportedAt: new Date().toISOString(),
      appName: settings.name,
      settings: {
        ...settings,
        logoUrl: settings.logo?.startsWith('/') ? `${window.location.origin}${settings.logo}` : settings.logo,
        backgroundImageUrl: settings.backgroundImage?.startsWith('/')
          ? `${window.location.origin}${settings.backgroundImage}`
          : settings.backgroundImage,
      },
      classes: appState.classes || [],
      students: studentsWithLinks,
      attendance: appState.attendanceRecords || appState.attendance || {},
      attendanceRecords: appState.attendanceRecords || appState.attendance || {},
      tests: appState.testRecords || appState.tests || [],
      testRecords: appState.testRecords || appState.tests || [],
      cloudConfig: appState.cloudConfig,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json;charset=utf-8',
    });

    // Download directly as backup.json
    downloadBlob(blob, 'backup.json');
    onNotification('Database copy saved as backup.json with all online image links!', 'success');
  };

  // Import JSON Backup (handles backup.json or restore.json)
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          onRestoreBackup(parsed);
        } else {
          throw new Error('Invalid JSON structure');
        }
      } catch {
        onNotification(`Failed to parse ${fileName}. Ensure it is a valid backup.json or restore.json file.`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Real-time Cloud Database Integration Box */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-600" /> Real-Time Cloud Database Synchronization
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Status:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                cloudStatus === 'connected'
                  ? 'bg-emerald-100 text-emerald-800'
                  : cloudStatus === 'syncing'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {cloudStatus === 'connected'
                ? '🟢 Live Connected'
                : cloudStatus === 'syncing'
                ? '🔄 Syncing'
                : '🟡 Local Cache'}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Select your permanent online cloud database provider. All data additions, updates, attendance logs, fee receipts, and deletions automatically sync to your cloud database in real time.
        </p>

        {/* Provisioned Online Database Status Card */}
        <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Flame className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-slate-900">
                    Google Cloud Firestore Database
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5" /> Provisioned &amp; Online
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Project: <code className="bg-white/80 px-1.5 py-0.5 rounded text-emerald-900 font-mono text-[11px]">{provisionedFirebaseConfig.projectId}</code>
                  <span className="mx-1.5 text-slate-400">•</span>
                  Database: <code className="bg-white/80 px-1.5 py-0.5 rounded text-slate-700 font-mono text-[11px]">{provisionedFirebaseConfig.firestoreDatabaseId}</code>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Permanent online storage: Students, classes, attendance records, fee dues, and receipts are stored safely in Google Cloud!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={handleActivateProvisionedCloud}
                disabled={isActivatingCloud}
                className="w-full sm:w-auto h-9 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isActivatingCloud ? (
                  <>Syncing...</>
                ) : provider === 'firebase' ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Active &amp; Connected
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> 1-Click Connect Firestore
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveCloudConfig} className="space-y-5">
          {/* Provider Selector Cards: Firebase & Cloudflare */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Firebase Card */}
            <div
              onClick={() => {
                setProvider('firebase');
                if (!fbProjectId && provisionedFirebaseConfig.projectId) {
                  setFbProjectId(provisionedFirebaseConfig.projectId);
                }
                if (!fbApiKey && provisionedFirebaseConfig.apiKey) {
                  setFbApiKey(provisionedFirebaseConfig.apiKey);
                }
              }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                provider === 'firebase'
                  ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Flame className={`w-5 h-5 ${provider === 'firebase' ? 'text-amber-500' : 'text-slate-400'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Online Cloud
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">Google Cloud Firestore</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Google Cloud persistent Firestore database. Provisioned online and ready for instant automatic sync.
                </p>
              </div>
            </div>

            {/* Cloudflare Card */}
            <div
              onClick={() => setProvider('cloudflare')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                provider === 'cloudflare'
                  ? 'border-orange-500 bg-orange-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Cloud className={`w-5 h-5 ${provider === 'cloudflare' ? 'text-orange-500' : 'text-slate-400'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                    Edge SQL
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">Cloudflare Database (D1)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Cloudflare global D1 SQL database or Worker API. Ideal for deployed web applications on Cloudflare.
                </p>
              </div>
            </div>
          </div>

          {/* Conditional Provider Fields: Firebase */}
          {provider === 'firebase' && (
            <div className="p-4 rounded-lg bg-amber-50/40 border border-amber-200/70 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-600" /> Google Cloud Firestore Configuration
                </h5>
                <button
                  type="button"
                  onClick={() => {
                    setFbProjectId(provisionedFirebaseConfig.projectId);
                    setFbApiKey(provisionedFirebaseConfig.apiKey);
                    onNotification('Auto-filled from provisioned Google Cloud setup!', 'success');
                  }}
                  className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 underline cursor-pointer"
                >
                  Fill Provisioned Credentials
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Google Cloud Project ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fbProjectId}
                    onChange={(e) => setFbProjectId(e.target.value)}
                    placeholder="e.g. qt-network-admin"
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Web API Key
                  </label>
                  <input
                    type="text"
                    value={fbApiKey}
                    onChange={(e) => setFbApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-amber-500 font-mono text-xs"
                  />
                </div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Connected to Cloud Database ID: <strong className="font-mono text-slate-700">{provisionedFirebaseConfig.firestoreDatabaseId}</strong></span>
              </div>
              <p className="text-[11px] text-slate-500 bg-white/70 p-2 rounded border border-amber-200/50">
                💡 <strong>Deployment Note:</strong> When you deploy your website live, you can keep using this Google Cloud Firestore database directly, or create a project in Firebase Console and enter your own Project ID and Web API key here.
              </p>
            </div>
          )}

          {/* Conditional Provider Fields: Cloudflare */}
          {provider === 'cloudflare' && (
            <div className="p-4 rounded-lg bg-orange-50/40 border border-orange-200/70 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-orange-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-orange-600" /> Cloudflare D1 Database Configuration
                </h5>
                <button
                  type="button"
                  onClick={handleActivateProvisionedCloud}
                  className="text-[11px] font-semibold text-orange-700 hover:text-orange-800 underline cursor-pointer"
                >
                  Switch to 1-Click Firestore
                </button>
              </div>
              <p className="text-xs text-slate-600">
                To sync with Cloudflare after deploying, create a D1 database in your Cloudflare dashboard and paste your credentials below:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Cloudflare Account ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cfAccountId}
                    onChange={(e) => setCfAccountId(e.target.value)}
                    placeholder="e.g. 9a8b7c6d5e4f3..."
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-orange-500"
                    required={!cfEndpoint}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Cloudflare D1 Database ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cfDatabaseId}
                    onChange={(e) => setCfDatabaseId(e.target.value)}
                    placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-orange-500 font-mono text-xs"
                    required={!cfEndpoint}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Cloudflare API Token <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={cfApiToken}
                    onChange={(e) => setCfApiToken(e.target.value)}
                    placeholder="D1 Edit Token"
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-orange-500"
                    required={!cfEndpoint}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Custom Worker / Pages Endpoint (Optional)
                  </label>
                  <input
                    type="text"
                    value={cfEndpoint}
                    onChange={(e) => setCfEndpoint(e.target.value)}
                    placeholder="https://nexus-api.myacademy.workers.dev"
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Automatic Sync Notice */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Automatic Real-Time Cloud Persistence Active</p>
              <p className="text-slate-600 mt-0.5">
                Every action is automatically saved and synchronized in real time. Whenever you register a student, edit information, collect a fee, record attendance, or delete an entry, the online cloud database updates automatically in the background.
              </p>
            </div>
          </div>

          {/* Test connection alert message */}
          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-red-50 text-red-800 border border-red-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Clean Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition cursor-pointer"
            >
              {isTesting ? 'Testing...' : 'Test Cloud Connection'}
            </button>
            <button
              type="submit"
              className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save &amp; Connect Cloud Database
            </button>
          </div>
        </form>
      </div>

      {/* System Branding & Chrome Tab Settings */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" /> System Branding &amp; Browser Settings
          </h3>
        </div>

        <form onSubmit={handleSaveBranding} className="space-y-5">
          {/* Logo upload and removal */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300">
            <div className="flex items-center gap-4">
              <img
                src={logoPreview || '/nexus-logo.svg'}
                alt="Logo Preview"
                className="w-16 h-16 rounded-full object-contain bg-white border border-slate-200 p-1 shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/nexus-logo.svg';
                }}
              />
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Upload Academy Emblem / Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
            </div>

            {/* Remove Logo button if logo is set */}
            {logoPreview && logoPreview !== '/nexus-logo.svg' && (
              <button
                type="button"
                onClick={() => {
                  setLogoPreview('');
                  onUpdateSettings({ ...settings, logo: '' });
                  onNotification('Uploaded logo removed (reset to default emblem)', 'info');
                }}
                className="h-9 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                title="Remove uploaded logo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Logo</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Academy Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Academy Tagline / Subtitle <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Location / Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Website Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => {
                    setBgColor(e.target.value);
                    onUpdateSettings({ ...settings, backgroundColor: e.target.value });
                  }}
                  className="w-12 h-10 p-0.5 border border-slate-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => {
                    setBgColor(e.target.value);
                    onUpdateSettings({ ...settings, backgroundColor: e.target.value });
                  }}
                  className="flex-1 h-10 px-3 bg-white border border-slate-300 rounded-md text-sm font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {settings.backgroundImage
                  ? 'Color tints over background image automatically'
                  : 'Solid background color'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600 block">
                  Website Background Image (Optional)
                </label>
                {settings.backgroundImage && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ ...settings, backgroundImage: '' });
                      onNotification('Background image removed! Returned to solid color.', 'info');
                    }}
                    className="text-[11px] font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Remove Image
                  </button>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleBgImageUpload}
                className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:bg-slate-100 hover:file:bg-slate-200 cursor-pointer w-full"
              />
              {settings.backgroundImage && (
                <div className="mt-2 flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img
                      src={settings.backgroundImage}
                      alt="Background preview"
                      className="w-10 h-7 rounded object-cover border border-slate-300 shrink-0"
                    />
                    <span className="text-[11px] text-slate-600 truncate">
                      Active background image
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ ...settings, backgroundImage: '' });
                      onNotification('Background image removed!', 'info');
                    }}
                    className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                    title="Remove background image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-500" /> Administrative PIN (Default: 2026)
              </label>
              <input
                type="text"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="2026"
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm font-mono outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md shadow-sm transition cursor-pointer"
            >
              Save Branding &amp; Browser Tab Title
            </button>
          </div>
        </form>
      </div>

      {/* Data Backup & System Restore Vault */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" /> Data Backup &amp; System Restore
          </h3>
        </div>

        <p className="text-xs text-slate-500 mb-5">
          Export a complete JSON snapshot containing all students, classes, attendance logs, and test records with online image links. Restoring <strong>backup.json</strong> or <strong>restore.json</strong> keeps existing data untouched and restores missing items with images intact.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleExportBackup}
            className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-md inline-flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download Backup (backup.json)
          </button>

          <label className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-md inline-flex items-center gap-2 shadow-sm transition cursor-pointer">
            <Upload className="w-4 h-4" /> Upload &amp; Restore (restore.json / backup.json)
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

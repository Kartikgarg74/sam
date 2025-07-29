'use client';

interface SystemStatusProps {
  status: {
    voiceRecognition: boolean;
    aiProcessing: boolean;
    browserIntegration: boolean;
    microphoneAccess: boolean;
  };
}

export function SystemStatus({ status }: SystemStatusProps) {
  const getStatusIcon = (isActive: boolean) => {
    return isActive ? '🟢' : '🔴';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  const getStatusBg = (isActive: boolean) => {
    return isActive
      ? 'bg-green-50 dark:bg-green-900/20'
      : 'bg-red-50 dark:bg-red-900/20';
  };

  const statusItems = [
    {
      key: 'voiceRecognition',
      label: 'Voice Recognition',
      description: 'Speech-to-text processing',
      status: status.voiceRecognition
    },
    {
      key: 'aiProcessing',
      label: 'AI Processing',
      description: 'Command understanding & response',
      status: status.aiProcessing
    },
    {
      key: 'browserIntegration',
      label: 'Browser Integration',
      description: 'Tab & page automation',
      status: status.browserIntegration
    },
    {
      key: 'microphoneAccess',
      label: 'Microphone Access',
      description: 'Audio input permissions',
      status: status.microphoneAccess
    }
  ];

  const overallStatus = Object.values(status).every(Boolean);

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <div className={`
        p-3 rounded-lg border-2 transition-all duration-200
        ${overallStatus
          ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
          : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'
        }
      `}>
        <div className="flex items-center space-x-2">
          <span className="text-lg">
            {overallStatus ? '🟢' : '🟡'}
          </span>
          <div>
            <p className={`font-semibold ${overallStatus ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
              {overallStatus ? 'All Systems Operational' : 'Some Systems Inactive'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {overallStatus
                ? 'Ready for voice commands'
                : 'Check system status below'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Individual Status Items */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          System Components
        </h4>

        {statusItems.map((item) => (
          <div
            key={item.key}
            className={`
              flex items-center justify-between p-3 rounded-lg border transition-all duration-200
              ${item.status
                ? 'border-green-200 bg-green-50 dark:bg-green-900/10'
                : 'border-red-200 bg-red-50 dark:bg-red-900/10'
              }
            `}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getStatusIcon(item.status)}</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBg(item.status)} ${getStatusColor(item.status)}`}>
                {getStatusText(item.status)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Troubleshooting */}
      {!overallStatus && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
            Troubleshooting Tips
          </h4>
          <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
            {!status.microphoneAccess && (
              <li>• Allow microphone access in browser settings</li>
            )}
            {!status.voiceRecognition && (
              <li>• Ensure Web Speech API is supported in your browser</li>
            )}
            {!status.browserIntegration && (
              <li>• Check extension permissions in Chrome settings</li>
            )}
            {!status.aiProcessing && (
              <li>• Verify internet connection for AI processing</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

import React from 'react';

const DERIVED_FIELDS_DEBUG_PATH = '/?debug=derived-fields';

const Settings: React.FC = () => {
  const openDerivedFieldsDebug = () => {
    window.open(DERIVED_FIELDS_DEBUG_PATH, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full min-w-0">
      <div className="mx-auto w-full max-w-2xl px-4 pt-4">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        </div>

        <div className="rounded-md bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900">Derived Field Tuner</h2>
              <p className="mt-1 text-sm text-gray-500">Tune rule and field color constants in a live debug view.</p>
            </div>
            <button
              type="button"
              onClick={openDerivedFieldsDebug}
              className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Open Tuner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

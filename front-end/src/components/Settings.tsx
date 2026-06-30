import React from 'react';
import { useUser, useUserData } from '../hooks/AppContext';

const DERIVED_FIELDS_DEBUG_PATH = '/?debug=derived-fields';

const Settings: React.FC = () => {
  const { userData: authUser } = useUser();
  const { userData: preferences, updateUserData } = useUserData();
  const showOldTaskCalendarViews = preferences?.show_old_task_calendar_views === true;

  const openDerivedFieldsDebug = () => {
    window.open(DERIVED_FIELDS_DEBUG_PATH, '_blank', 'noopener,noreferrer');
  };

  const toggleOldTaskCalendarViews = () => {
    if (!authUser?.id) return;
    updateUserData(authUser.id, {
      show_old_task_calendar_views: !showOldTaskCalendarViews,
    });
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

        <div className="mt-4 rounded-md bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900">Legacy Task and Calendar Views</h2>
              <p className="mt-1 text-sm text-gray-500">Show the old standalone task list and calendar navigation items.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showOldTaskCalendarViews}
              onClick={toggleOldTaskCalendarViews}
              disabled={!authUser?.id}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                showOldTaskCalendarViews ? 'bg-blue-600' : 'bg-gray-300'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
                  showOldTaskCalendarViews ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

// Import package.json to get version
import packageJson from '../../package.json';

export const VERSION = packageJson.version;
export const APP_NAME = packageJson.name;

// Helper function to format version with 'v' prefix
export const getVersionString = () => `v${VERSION}`;

// Helper function to get full app info
export const getAppInfo = () => ({
  name: APP_NAME,
  version: VERSION,
  versionString: getVersionString(),
});

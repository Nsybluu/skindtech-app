import appConfig from '../../app.json';

/** Single source of truth for the version shown in Profile and About: `expo.version` in app.json. */
export const APP_VERSION: string = appConfig.expo.version;

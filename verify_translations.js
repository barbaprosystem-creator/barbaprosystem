import { translations } from './src/i18n/translations.js';

function checkKeys(esObj, enObj, path = '') {
  const esKeys = Object.keys(esObj);
  const enKeys = Object.keys(enObj);

  // Check for keys in ES but missing in EN
  for (const key of esKeys) {
    const fullPath = path ? `${path}.${key}` : key;
    if (!(key in enObj)) {
      console.warn(`WARNING: Key "${fullPath}" is in ES but missing in EN`);
      continue;
    }

    const esType = typeof esObj[key];
    const enType = typeof enObj[key];

    if (esType !== enType) {
      console.error(`ERROR: Type mismatch for "${fullPath}": ES is ${esType}, EN is ${enType}`);
    } else if (esType === 'object' && esObj[key] !== null) {
      checkKeys(esObj[key], enObj[key], fullPath);
    }
  }

  // Check for keys in EN but missing in ES
  for (const key of enKeys) {
    const fullPath = path ? `${path}.${key}` : key;
    if (!(key in esObj)) {
      console.warn(`WARNING: Key "${fullPath}" is in EN but missing in ES`);
    }
  }
}

console.log("Checking translations...");
checkKeys(translations.es, translations.en);
console.log("Done checking!");

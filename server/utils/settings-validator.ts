/**
 * Settings Persistence Validator
 * 
 * This utility helps prevent settings persistence issues by validating that all
 * schema fields are properly handled in the storage layer.
 */

import { userSettings } from "@shared/schema";
import type { InsertUserSettings, UserSettings } from "@shared/schema";

/**
 * Get all settable field names from the schema (excluding id and userId)
 */
export function getSettingsFields(): string[] {
  // Manually define the expected settings fields based on the schema
  // This should match exactly with the userSettings table definition in shared/schema.ts
  return [
    'aiProvider',
    'apiKeys', 
    'promptTemplates',
    'defaultModifiers',
    'splitMode',
    'theme',
    'inputHistory',
    'integrations',
  ];
}

/**
 * Validate that all schema fields are included in the defaults object
 */
export function validateDefaultsCompleteness(defaults: Record<string, any>): {
  isValid: boolean;
  missingFields: string[];
  extraFields: string[];
} {
  const schemaFields = getSettingsFields();
  const defaultFields = Object.keys(defaults);
  
  const missingFields = schemaFields.filter(field => !defaultFields.includes(field));
  const extraFields = defaultFields.filter(field => !schemaFields.includes(field));
  
  return {
    isValid: missingFields.length === 0 && extraFields.length === 0,
    missingFields,
    extraFields,
  };
}

/**
 * Validate that settings data contains all expected fields
 */
export function validateSettingsData(data: Partial<InsertUserSettings>): {
  isValid: boolean;
  unexpectedFields: string[];
  recommendations: string[];
} {
  const schemaFields = getSettingsFields();
  const dataFields = Object.keys(data);
  
  const unexpectedFields = dataFields.filter(field => !schemaFields.includes(field));
  const recommendations: string[] = [];
  
  if (unexpectedFields.length > 0) {
    recommendations.push(`Consider adding these fields to the schema: ${unexpectedFields.join(', ')}`);
  }
  
  // Check for common patterns that might indicate issues
  if (data.integrations && typeof data.integrations === 'object') {
    const integrationCount = Object.keys(data.integrations).length;
    if (integrationCount > 0) {
      recommendations.push(`Integration data found with ${integrationCount} integration(s) - ensure storage layer preserves this`);
    }
  }
  
  return {
    isValid: unexpectedFields.length === 0,
    unexpectedFields,
    recommendations,
  };
}

/**
 * Log comprehensive settings information for debugging
 */
export function logSettingsDebugInfo(
  operation: 'create' | 'update',
  userId: string,
  incoming: Partial<InsertUserSettings>,
  existing?: UserSettings | null,
  final?: any
) {
  console.log(`\n=== SETTINGS ${operation.toUpperCase()} DEBUG INFO ===`);
  console.log(`User ID: ${userId}`);
  console.log(`Operation: ${operation}`);
  
  if (existing) {
    console.log(`Existing settings keys: ${Object.keys(existing).join(', ')}`);
  }
  
  console.log(`Incoming data keys: ${Object.keys(incoming).join(', ')}`);
  
  // Specifically check integration data
  if (incoming.integrations) {
    const integrations = incoming.integrations as Record<string, any>;
    const integrationKeys = Object.keys(integrations);
    console.log(`Integration keys in request: ${integrationKeys.join(', ')}`);
    
    integrationKeys.forEach(key => {
      const config = integrations[key];
      const configKeys = Object.keys(config || {});
      console.log(`${key} integration config keys: ${configKeys.join(', ')}`);
    });
  }
  
  if (final) {
    console.log(`Final result keys: ${Object.keys(final).join(', ')}`);
    if (final.integrations) {
      console.log(`Final integrations: ${JSON.stringify(final.integrations, null, 2)}`);
    }
  }
  
  console.log(`=== END SETTINGS DEBUG ===\n`);
}

/**
 * Test function to verify settings persistence - call this in development
 */
export function runSettingsPersistenceTest() {
  const testDefaults = {
    aiProvider: "testquality",
    splitMode: true,
    apiKeys: {},
    promptTemplates: {},
    defaultModifiers: {},
    theme: "system",
    inputHistory: [],
    integrations: {},
  };
  
  console.log('=== SETTINGS PERSISTENCE TEST ===');
  
  const validation = validateDefaultsCompleteness(testDefaults);
  console.log('Defaults validation:', validation);
  
  if (!validation.isValid) {
    console.error('❌ SETTINGS PERSISTENCE ISSUE DETECTED!');
    console.error('Missing fields in defaults:', validation.missingFields);
    console.error('Extra fields in defaults:', validation.extraFields);
  } else {
    console.log('✅ Defaults validation passed');
  }
  
  // Test integration data
  const testIntegrationData: Partial<InsertUserSettings> = {
    integrations: {
      github: { org: 'test', repo: 'test', accessToken: 'test' },
      jira: { url: 'test', email: 'test', apiToken: 'test' },
      linear: { apiKey: 'test' }
    }
  };
  
  const dataValidation = validateSettingsData(testIntegrationData);
  console.log('Integration data validation:', dataValidation);
  
  console.log('=== END SETTINGS TEST ===');
}
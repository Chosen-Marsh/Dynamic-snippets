export default {
  app: {
    name: 'Dynamic Snippets'
  },
  content: {
    untitledSnippet: 'Untitled Snippet',
    fillVariablesTitle: 'Fill Snippet Variables',
    preview: 'Preview',
    cancel: 'Cancel',
    insert: 'Insert',
    enterValue: 'Enter value',
    datePlaceholder: 'YYYY-MM-DD'
  },
  background: {
    insertSnippetMenu: 'Insert Snippet',
    noSnippets: 'No snippets available',
    untitledSnippet: 'Untitled Snippet',
    insertCopied: 'Could not insert Snippet. Text copied to clipboard.',
    insertFailed: 'Could not insert snippet and clipboard copy failed.'
  },
  common: {
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    insert: 'Insert',
    preview: 'Preview'
  },
  sidebar: {
    title: 'Snippets',
    defaultFolderName: 'New Folder',
    defaultSnippetName: 'Untitled Snippet',
    menu: {
      newSnippet: 'New Snippet',
      newFolder: 'New Folder',
      rename: 'Rename',
      delete: 'Delete',
      deleteSnippet: 'Delete Snippet'
    }
  },
  footer: {
    settings: 'Settings',
    lastSavedAt: 'Last saved at {time}',
    notSavedYet: 'Not saved yet'
  },
  snippet: {
    untitled: 'Untitled Snippet',
    commandTitle: 'Type this anywhere on the web to trigger this snippet',
    commandPlaceholder: 'command',
    closeAria: 'Close snippet',
    closeTitle: 'Back to welcome',
    editorPlaceholder: '// paste or type your snippet here...',
    addVariable: 'Add Variable',
    addGlobalVariable: 'Add Global Variable',
    status: {
      loading: 'Loading...',
      saving: 'Saving...',
      unsaved: 'Unsaved changes'
    }
  },
  varModal: {
    ariaLabel: 'Insert variable',
    title: 'Insert Variable',
    type: 'Type',
    types: {
      dropdown: 'Dropdown with options',
      text: 'Text input',
      date: 'Date input'
    },
    key: 'Key',
    keyPlaceholder: 'example: env',
    options: 'Options (comma separated)',
    optionsPlaceholder: 'dev,staging,prod',
    defaultValue: 'Default value',
    defaultPlaceholder: 'my-default',
    datePlaceholder: 'yyyy-mm-dd'
  },
  globalVarModal: {
    ariaLabel: 'Insert global variable',
    title: 'Insert Global Variable',
    help: 'Pick a global variable from Settings. Missing keys paste as',
    helpAfter: 'at insert time.',
    label: 'Global variable',
    empty: 'No global variables yet. Add them in Settings → Global Variables.'
  },
  settings: {
    title: 'Settings',
    sections: 'Settings sections',
    tabs: {
      general: 'General',
      data: 'Data',
      globals: 'Global Variables'
    },
    general: {
      theme: 'Theme',
      themeDark: 'Dark',
      themeLight: 'Light',
      language: 'Language',
      debounce: 'Auto-save debounce (ms)',
      analytics: 'Usage analytics',
      analyticsHelp: 'Tracks action names locally only — never snippet content or personal data.'
    },
    data: {
      title: 'Data tools',
      help: 'Import or export snippets, folders, global variables, and settings as a versioned pack.',
      import: 'Import',
      export: 'Export'
    },
    globals: {
      helpBefore: 'Define reusable values for',
      helpAfter: 'tokens. Missing keys paste as',
      key: 'Key',
      value: 'Value',
      keyPlaceholder: 'key',
      valuePlaceholder: 'value',
      remove: 'Remove variable',
      empty: 'No global variables yet.',
      add: 'Add variable'
    },
    import: {
      title: 'Import preview',
      schema: 'Schema {version}',
      unknown: 'unknown',
      totalSnippets: 'Total snippets:',
      folders: 'Folders:',
      globalVariables: 'Global variables:',
      settingsFields: 'Settings fields:',
      mergeChecks: 'Merge checks',
      idConflicts: 'ID conflicts: {count}',
      variableConflicts: 'Global variable key conflicts: {count}',
      settingsChanges: 'Settings changes: {count}',
      warnings: 'Warnings',
      blocked: 'Import blocked',
      overwrite: 'Overwrite',
      overwriting: 'Overwriting...',
      merge: 'Merge',
      merging: 'Merging...',
      previewFailed: 'Import preview failed. Please verify the file format.',
      failed: 'Import failed. Please verify the file format.',
      completeMerged: 'Import complete: merged with your existing data.',
      completeOverwritten: 'Import complete: existing data overwritten with imported pack.'
    }
  },
  pack: {
    missingIds: 'Some imported items were missing IDs and will be regenerated.',
    missingNames: 'Some imported items were missing names and were normalized.',
    duplicateIds: '{count} duplicate IDs detected in the import file.',
    empty: 'Import file does not contain snippets, folders, or global variables.',
    invalidJson: 'Invalid JSON file.',
    notObject: 'Import file must be a JSON object.',
    missingSchema: 'Import file is missing schemaVersion.',
    unsupportedSchema: 'Unsupported schema version: {version}',
    missingData: 'Import file is missing data payload.'
  },
  analytics: {
    consentEyebrowOpt: 'Optional analytics',
    consentTitle: 'Help us improve Dynamic Snippets',
    consentDescription: 'We collect anonymous usage events only, and never capture your snippets or personal data.',
    detailsLabel: 'Data collection details',
    collectTitle: 'What we collect',
    collectUsage: 'Feature and button usage',
    collectTimestamps: 'Local timestamps',
    neverTitle: 'What we never collect',
    neverSnippets: 'Snippet content',
    neverVariables: 'Variable values',
    neverPersonal: 'Personal data',
    note: 'Your preference is stored locally in this extension.',
    decline: 'Not now',
    accept: 'Allow anonymous analytics'
  },
  rate: {
    eyebrow: 'Quick feedback',
    title: 'Love Dynamic Snippets?',
    text: 'You’ve been using it for a day. If it has saved you time, a quick review would mean a lot.',
    starsLabel: 'Five star rating',
    dismiss: 'No thanks',
    later: 'Maybe later',
    accept: 'Rate 5 stars'
  },
  welcome: {
    ariaLabel: 'Welcome',
    heading: 'Build smart snippets in seconds',
    lead: 'Select a snippet on the left or create one from the sidebar menu. Use variables to fill values quickly at insert time.',
    dropdown: {
      title: 'Dropdown Variable',
      text: 'Choose from predefined values at paste time.'
    },
    text: {
      title: 'Text Input Variable',
      text: 'Prompt for custom values before inserting.'
    },
    date: {
      title: 'Date Variable',
      text: 'Pick a date and insert it using your local date format.'
    },
    global: {
      title: 'Global Variable',
      text: 'Uses a value from Settings. Missing keys paste as'
    },
    tip1: 'Tip: Right-click in the editor to add variables quickly.',
    tip2: 'Tip: Use folders to group snippets by project or workflow.',
    tip3: 'Tip: Date variables insert in your browser\'s local format.',
    viewHistory: 'View version history'
  },
  changelog: {
    versionHistory: 'Version history',
    whatsNew: 'What\'s New',
    releaseNotes: 'Release Notes',
    latestUpdates: 'Latest updates',
    version: 'Version {version}',
    openChangelog: 'Open changelog',
    closeChangelog: 'Close changelog',
    comingSoon: 'Coming soon',
    viewingDetails: 'Viewing release details.',
    chooseRelease: 'Choose a release card to view full changes.',
    onlyOnce: 'You will only see this once per version.',
    closeHistory: 'Close history',
    gotIt: 'Got it',
    types: {
      added: 'added',
      changed: 'changed',
      fixed: 'fixed',
      removed: 'removed'
    }
  }
};

export default {
  version: '1.2.0',
  title: 'Improved drag-and-drop reordering and import/export workflow',
  date: '2026-08-10',
  changes: [
    {
      type: 'changed',
      text: 'Improved drag-and-drop reordering so it is clearer where a snippet will be inserted.'
    },
    {
      type: 'changed',
      text: 'Added clearer drop indicators for moving snippets above, below, or into folders.'
    },
    {
      type: 'fixed',
      text: 'Fixed the placement logic so snippet reordering is more predictable during drag and drop.'
    },
    {
      type: 'fixed',
      text: 'Improved light mode contrast in the changelog panel to make cards, badges, and metadata easier to read.'
    },
    {
      type: 'changed',
      text: 'Standardized code and token styling in light mode for better readability and visual consistency.'
    },
    {
      type: 'added',
      text: 'Added a versioned snippet pack format that exports snippets, folders, global variables, and settings together.'
    },
    {
      type: 'added',
      text: 'Added smart import preview with item counts before applying imported data.'
    },
    {
      type: 'added',
      text: 'Added merge and overwrite import modes for safer data recovery and migration workflows.'
    },
    {
      type: 'fixed',
      text: 'Added schema and payload validation to reject malformed import files before they modify stored data.'
    }
  ],
  comingSoon: [
    'Quick Snippet command - Paste a snippet by name or keyword without opening the app. For example /bugtemplate will paste the bug report template snippet directly into the active text field.'
  ]
};

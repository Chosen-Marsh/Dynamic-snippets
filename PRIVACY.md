# Dynamic Snippets Privacy Policy

**Last updated:** July 23, 2026

## Data Collection

Dynamic Snippets does **not** collect, transmit, or share personal data.

The extension does not send snippet content, variable values, or personal identifiers anywhere.

Analytics network sending is currently disabled in the shipped build.

## Data Storage

All snippets, folders, and extension settings (theme preference, auto-save timing) are stored locally on your device using the Chrome Storage API (`chrome.storage.local`). This data never leaves your browser.

If optional analytics is enabled in a future release, usage events are designed to be action-level only (for example, "settings_opened"), never snippet text.

## Third Parties

No data is sold, transferred, or shared with third parties.

The extension does not use advertising trackers or third-party cookies.

## Permissions

The extension requests the following permissions solely to provide its core functionality:

- **storage** — Save your snippets and settings locally
- **contextMenus** — Build the right-click menu for snippet insertion
- **scripting** — Insert snippet text into editable fields on the active page
- **activeTab** — Access the current tab only when you explicitly select a snippet from the context menu
- **host_permissions (`<all_urls>`)** — Required to insert snippets on any website you choose to use them on

## Remote Code

Dynamic Snippets does not load or execute any remote code. All code is bundled within the extension package.

## Changes

If this policy is updated, the changes will be reflected in this document with an updated date.

## Contact

If you have questions about this privacy policy, please open an issue on the extension's GitHub repository.

import storage from './Storage';

const FOLDERS_KEY = 'snippetsFolders';
const SNIPPETS_KEY = 'snippets';
const DEFAULTS_SEEDED_KEY = 'snippetsDefaultsSeededV1';

class Snippets {
    constructor() {
        this.snippetsFoldersKey = FOLDERS_KEY;
        this.snippetsKey = SNIPPETS_KEY;
        this.defaultsSeededKey = DEFAULTS_SEEDED_KEY;
        this._initPromise = null;
    }

    _now() {
        return new Date().toISOString();
    }

    _buildDefaultContent() {
        const now = this._now();
        const baseId = Date.now();

        const snippets = [
            {
                id: baseId + 1,
                name: 'Bug Report Template',
                type: 'snippet',
                content: [
                    'Title: ${summary-input|Short issue summary}',
                    'Environment: ${{environment-dropdown|dev,staging,production}',
                    'Severity: ${{severity-dropdown|low,medium,high,critical}',
                    'Steps to Reproduce:',
                    '1. ${step1-input|Open the app}',
                    '2. ${step2-input|Click the target action}',
                    '',
                    'Expected: ${expected-input|Describe expected behavior}',
                    'Actual: ${actual-input|Describe actual behavior}'
                ].join('\n'),
                createdAt: now,
                updatedAt: now
            },
            {
                id: baseId + 2,
                name: 'PR Checklist Comment',
                type: 'snippet',
                content: [
                    '## Pull Request Checklist',
                    '- Type: ${{prtype-dropdown|feature,fix,refactor,chore,docs}',
                    '- Risk: ${{risk-dropdown|low,medium,high}',
                    '- Tests: ${tests-input|Unit + manual smoke test completed}',
                    '- Notes: ${notes-input|Any rollout or migration notes}'
                ].join('\n'),
                createdAt: now,
                updatedAt: now
            }
        ];

        const folders = [
            {
                id: baseId + 10,
                name: 'Message Templates',
                type: 'folder',
                createdAt: now,
                updatedAt: now,
                children: [
                    {
                        id: baseId + 11,
                        name: 'Customer Follow-up',
                        type: 'snippet',
                        content: [
                            'Hi ${name-input|there},',
                            '',
                            'Following up on your ${topic-input|request}.',
                            'Current status: ${{status-dropdown|in-progress,ready,blocked}',
                            'Next update by: ${date-input|Friday}',
                            '',
                            'Thanks,',
                            '${sender-input|Support Team}'
                        ].join('\n'),
                        createdAt: now,
                        updatedAt: now
                    },
                    {
                        id: baseId + 12,
                        name: 'Quick Standup',
                        type: 'snippet',
                        content: [
                            'Yesterday: ${yesterday-input|Worked on...}',
                            'Today: ${today-input|Planning to...}',
                            'Blockers: ${blockers-input|None}',
                            'Confidence: ${{confidence-dropdown|low,medium,high}'
                        ].join('\n'),
                        createdAt: now,
                        updatedAt: now
                    }
                ]
            }
        ];

        return { snippets, folders };
    }

    async _ensureInitialized() {
        if (this._initPromise) {
            await this._initPromise;
            return;
        }

        this._initPromise = (async () => {
            const result = await storage.getLocal([
                this.snippetsKey,
                this.snippetsFoldersKey,
                this.defaultsSeededKey
            ]);

            const hasSnippets = Array.isArray(result[this.snippetsKey]);
            const hasFolders = Array.isArray(result[this.snippetsFoldersKey]);
            const snippets = hasSnippets ? result[this.snippetsKey] : [];
            const folders = hasFolders ? result[this.snippetsFoldersKey] : [];
            const defaultsSeeded = Boolean(result[this.defaultsSeededKey]);

            const writePayload = {};
            if (!hasSnippets) writePayload[this.snippetsKey] = [];
            if (!hasFolders) writePayload[this.snippetsFoldersKey] = [];

            const shouldSeedDefaults = !defaultsSeeded && snippets.length === 0 && folders.length === 0;

            if (shouldSeedDefaults) {
                const defaults = this._buildDefaultContent();
                writePayload[this.snippetsKey] = defaults.snippets;
                writePayload[this.snippetsFoldersKey] = defaults.folders;
                writePayload[this.defaultsSeededKey] = true;
            } else if (!defaultsSeeded) {
                writePayload[this.defaultsSeededKey] = true;
            }

            if (Object.keys(writePayload).length) {
                await storage.setLocal(writePayload);
            }
        })();

        await this._initPromise;
    }

    _findFolder(items, id) {
        for (const item of items) {
            if (String(item.id) === String(id) && item.type === 'folder') return item;
            if (item.children?.length) {
                const found = this._findFolder(item.children, id);
                if (found) return found;
            }
        }
        return null;
    }

    _findSnippet(items, sid) {
        for (const item of items) {
            if (!item.children?.length) continue;
            const found = item.children.find(c => String(c.id) === sid && c.type === 'snippet');
            if (found) return found;
            const nested = this._findSnippet(item.children, sid);
            if (nested) return nested;
        }
        return null;
    }

    _removeSnippet(items, sid) {
        for (const item of items) {
            if (!item.children?.length) continue;
            const index = item.children.findIndex(c => String(c.id) === sid && c.type === 'snippet');
            if (index !== -1) return item.children.splice(index, 1)[0];
            const found = this._removeSnippet(item.children, sid);
            if (found) return found;
        }
        return null;
    }

    _removeFolder(items, id) {
        const fid = String(id);
        for (const item of items) {
            if (!item.children?.length) continue;
            const index = item.children.findIndex(
                c => String(c.id) === fid && c.type === 'folder'
            );
            if (index !== -1) return item.children.splice(index, 1)[0];
            const found = this._removeFolder(item.children, fid);
            if (found) return found;
        }
        return null;
    }

    async _getAll() {
        await this._ensureInitialized();
        const [snippetsResult, foldersResult] = await Promise.all([
            storage.getLocal(this.snippetsKey),
            storage.getLocal(this.snippetsFoldersKey)
        ]);
        return {
            snippets: snippetsResult[this.snippetsKey] || [],
            folders: foldersResult[this.snippetsFoldersKey] || []
        };
    }

    async getSnippetsFolders() {
        await this._ensureInitialized();
        const result = await storage.getLocal(this.snippetsFoldersKey);
        return result[this.snippetsFoldersKey] || [];
    }

    async createSnippetFolder(folderName, parentId = null) {
        const now = this._now();

        const data = {
            id: Date.now(),
            name: folderName || 'Unnamed Folder',
            type: 'folder',
            children: [],
            createdAt: now,
            updatedAt: now
        };

        const folders = await this.getSnippetsFolders();

        if (parentId) {
            const parent = this._findFolder(folders, parentId);
            
            if (!parent) {
                throw new Error('Parent folder not found.');
            }

            parent.children = parent.children || [];
            parent.children.unshift(data);
            parent.updatedAt = now;
        } else {
            folders.unshift(data);
        }

        await storage.setLocal({
            [this.snippetsFoldersKey]: folders
        });
    }

    async renameSnippetFolder(id, newName) {
        if (!id || !newName) throw new Error('ID and new name are required.');
        const folders = await this.getSnippetsFolders();
        const folder = this._findFolder(folders, id);
        if (folder) {
            folder.name = newName;
            folder.updatedAt = this._now();
        }
        await storage.setLocal({ [this.snippetsFoldersKey]: folders });
    }

    async deleteSnippetFolder(id) {
        if (!id) throw new Error('Folder ID is required to delete a folder.');
        const fid = String(id);
        let folders = await this.getSnippetsFolders();
        const rootCount = folders.length;
        folders = folders.filter(f => String(f.id) !== fid);
        if (folders.length !== rootCount) {
            await storage.setLocal({ [this.snippetsFoldersKey]: folders });
            return;
        }

        const removed = this._removeFolder(folders, fid);
        if (!removed) throw new Error('Folder not found.');
        await storage.setLocal({ [this.snippetsFoldersKey]: folders });
    }

    async moveSnippetFolder(id, newParentId) {
        if (!id) throw new Error('Folder ID is required to move a folder.');
        let folders = await this.getSnippetsFolders();

        function extractFolder(items) {
            const index = items.findIndex(f => f.id === id);
            if (index !== -1) return items.splice(index, 1)[0];
            for (const item of items) {
                if (item.children?.length) {
                    const found = extractFolder(item.children);
                    if (found) return found;
                }
            }
            return null;
        }

        const folder = extractFolder(folders);
        if (!folder) throw new Error('Folder not found.');
        const now = this._now();
        folder.updatedAt = now;

        if (newParentId) {
            const parentFolder = this._findFolder(folders, newParentId);
            if (!parentFolder) throw new Error('Parent folder not found.');
            parentFolder.children = parentFolder.children || [];
            parentFolder.children.unshift(folder);
            parentFolder.updatedAt = now;
        } else {
            folders.unshift(folder);
        }
        await storage.setLocal({ [this.snippetsFoldersKey]: folders });
    }

    async getSnippets() {
        await this._ensureInitialized();
        const result = await storage.getLocal(this.snippetsKey);
        return result[this.snippetsKey] || [];
    }

    async createSnippet(snippetData, folderId = null) {
        const now = this._now();
        const snippet = {
            id: Date.now(),
            name: snippetData.name || 'Unnamed Snippet',
            content: snippetData.content || '',
            type: 'snippet',
            createdAt: now,
            updatedAt: now
        };
        if (folderId) {
            const folders = await this.getSnippetsFolders();
            const folder = this._findFolder(folders, folderId);
            if (!folder) throw new Error('Target folder not found.');
            folder.children = folder.children || [];
            folder.children.push(snippet);
            folder.updatedAt = now;
            await storage.setLocal({ [this.snippetsFoldersKey]: folders });
        } else {
            const snippets = await this.getSnippets();
            snippets.push(snippet);
            await storage.setLocal({ [this.snippetsKey]: snippets });
        }
        return snippet;
    }

    async renameSnippet(id, newName) {
        if (!id || !newName) throw new Error('ID and new name are required.');
        const sid = String(id);
        const snippets = await this.getSnippets();
        const rootSnippet = snippets.find(s => String(s.id) === sid);
        if (rootSnippet) {
            rootSnippet.name = newName;
            rootSnippet.updatedAt = this._now();
            await storage.setLocal({ [this.snippetsKey]: snippets });
            return;
        }
        const folders = await this.getSnippetsFolders();
        const nested = this._findSnippet(folders, sid);
        if (nested) {
            nested.name = newName;
            nested.updatedAt = this._now();
            await storage.setLocal({ [this.snippetsFoldersKey]: folders });
        }
    }

    async updateSnippetData(id, updates) {
        if (!id) throw new Error('Snippet ID is required to update snippet data.');
        if (!updates || typeof updates !== 'object') throw new Error('Updates object is required.');

        const sid = String(id);
        const { snippets, folders } = await this._getAll();

        const rootSnippet = snippets.find(s => String(s.id) === sid && s.type === 'snippet');
        if (rootSnippet) {
            Object.assign(rootSnippet, updates, { updatedAt: this._now() });
            await storage.setLocal({ [this.snippetsKey]: snippets });
            return rootSnippet;
        }

        const nestedSnippet = this._findSnippet(folders, sid);
        if (!nestedSnippet) throw new Error('Snippet not found.');
        Object.assign(nestedSnippet, updates, { updatedAt: this._now() });
        await storage.setLocal({ [this.snippetsFoldersKey]: folders });
        return nestedSnippet;
    }

    async deleteSnippet(id) {
        if (!id) throw new Error('Snippet ID is required to delete a snippet.');
        const sid = String(id);
        let snippets = await this.getSnippets();
        const rootCount = snippets.length;
        snippets = snippets.filter(s => String(s.id) !== sid);
        if (snippets.length !== rootCount) {
            await storage.setLocal({ [this.snippetsKey]: snippets });
            return;
        }

        const folders = await this.getSnippetsFolders();
        const removed = this._removeSnippet(folders, sid);
        if (!removed) throw new Error('Snippet not found.');
        await storage.setLocal({ [this.snippetsFoldersKey]: folders });
    }

    async moveSnippet(id, newFolderId) {
        if (!id) throw new Error('Snippet ID is required to move a snippet.');
        const sid = String(id);
        const { snippets, folders } = await this._getAll();

        const rootIndex = snippets.findIndex(s => String(s.id) === sid);
        const snippet = rootIndex !== -1
            ? snippets.splice(rootIndex, 1)[0]
            : this._removeSnippet(folders, sid);

        if (!snippet) throw new Error('Snippet not found.');
        snippet.updatedAt = this._now();

        if (newFolderId) {
            const folder = this._findFolder(folders, newFolderId);
            if (!folder) throw new Error('Target folder not found.');
            folder.children = folder.children || [];
            folder.children.push(snippet);
            folder.updatedAt = this._now();
        } else {
            snippets.push(snippet);
        }

        await storage.setLocal({
            [this.snippetsKey]: snippets,
            [this.snippetsFoldersKey]: folders
        });
    }

    async getSnippetData(id) {
        if (!id) throw new Error('Snippet ID is required to get snippet data.');
        const sid = String(id);
        const { snippets, folders } = await this._getAll();
        return snippets.find(s => String(s.id) === sid) ?? this._findSnippet(folders, sid);
    }

    async exportAll() {
        const { snippets, folders } = await this._getAll();
        return JSON.stringify({ snippets, folders }, null, 2);
    }

    async importAll(jsonString) {
        if (!jsonString || typeof jsonString !== 'string') {
            throw new Error('A valid JSON string is required.');
        }
        const data = JSON.parse(jsonString);
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid import data.');
        }
        const snippets = Array.isArray(data.snippets) ? data.snippets : [];
        const folders = Array.isArray(data.folders) ? data.folders : [];
        await storage.setLocal({
            [this.snippetsKey]: snippets,
            [this.snippetsFoldersKey]: folders
        });
    }
}

export default Snippets;
export default {
  app: {
    name: 'Dynamic Snippets'
  },
  content: {
    untitledSnippet: '無題のスニペット',
    fillVariablesTitle: 'スニペット変数を入力',
    preview: 'プレビュー',
    cancel: 'キャンセル',
    insert: '挿入',
    enterValue: '値を入力',
    datePlaceholder: 'YYYY-MM-DD'
  },
  background: {
    insertSnippetMenu: 'スニペットを挿入',
    noSnippets: '利用可能なスニペットはありません',
    untitledSnippet: '無題のスニペット',
    insertCopied: 'スニペットを挿入できませんでした。テキストをクリップボードにコピーしました。',
    insertFailed: 'スニペットを挿入できず、クリップボードへのコピーにも失敗しました。'
  },
  common: {
    close: '閉じる',
    cancel: 'キャンセル',
    save: '保存',
    insert: '挿入',
    preview: 'プレビュー'
  },
  sidebar: {
    title: 'スニペット',
    defaultFolderName: '新しいフォルダ',
    defaultSnippetName: '無題のスニペット',
    menu: {
      newSnippet: '新しいスニペット',
      newFolder: '新しいフォルダ',
      rename: '名前を変更',
      delete: '削除',
      deleteSnippet: 'スニペットを削除'
    }
  },
  footer: {
    settings: '設定',
    lastSavedAt: '最終保存: {time}',
    notSavedYet: '未保存'
  },
  snippet: {
    untitled: '無題のスニペット',
    commandTitle: 'ウェブ上のどこでもこれを入力すると、このスニペットが呼び出されます',
    commandPlaceholder: 'コマンド',
    closeAria: 'スニペットを閉じる',
    closeTitle: 'ようこそ画面に戻る',
    editorPlaceholder: '// ここにスニペットを貼り付けるか入力してください...',
    addVariable: '変数を追加',
    addGlobalVariable: 'グローバル変数を追加',
    status: {
      loading: '読み込み中...',
      saving: '保存中...',
      unsaved: '未保存の変更'
    }
  },
  varModal: {
    ariaLabel: '変数を挿入',
    title: '変数を挿入',
    type: '種類',
    types: {
      dropdown: '選択肢付きドロップダウン',
      text: 'テキスト入力',
      date: '日付入力'
    },
    key: 'キー',
    keyPlaceholder: '例: env',
    options: '選択肢（カンマ区切り）',
    optionsPlaceholder: 'dev,staging,prod',
    defaultValue: '既定値',
    defaultPlaceholder: 'my-default',
    datePlaceholder: 'yyyy-mm-dd'
  },
  globalVarModal: {
    ariaLabel: 'グローバル変数を挿入',
    title: 'グローバル変数を挿入',
    help: '設定からグローバル変数を選択します。存在しないキーは挿入時に',
    helpAfter: 'として貼り付けられます。',
    label: 'グローバル変数',
    empty: 'グローバル変数はまだありません。設定 → グローバル変数 で追加してください。'
  },
  settings: {
    title: '設定',
    sections: '設定セクション',
    tabs: {
      general: '一般',
      data: 'データ',
      globals: 'グローバル変数'
    },
    general: {
      theme: 'テーマ',
      themeDark: 'ダーク',
      themeLight: 'ライト',
      language: '言語',
      debounce: '自動保存の遅延 (ms)',
      analytics: '使用状況の分析',
      analyticsHelp: '操作名のみをローカルで記録します。スニペットの内容や個人データは収集しません。'
    },
    data: {
      title: 'データツール',
      help: 'スニペット、フォルダ、グローバル変数、設定をバージョン付きパックとしてインポート／エクスポートします。',
      import: 'インポート',
      export: 'エクスポート'
    },
    globals: {
      helpBefore: '再利用できる値を定義します:',
      helpAfter: 'トークン用。存在しないキーは次のように貼り付けられます:',
      key: 'キー',
      value: '値',
      keyPlaceholder: 'キー',
      valuePlaceholder: '値',
      remove: '変数を削除',
      empty: 'グローバル変数はまだありません。',
      add: '変数を追加'
    },
    import: {
      title: 'インポートのプレビュー',
      schema: 'スキーマ {version}',
      unknown: '不明',
      totalSnippets: 'スニペット合計:',
      folders: 'フォルダ:',
      globalVariables: 'グローバル変数:',
      settingsFields: '設定項目:',
      mergeChecks: 'マージの確認',
      idConflicts: 'IDの競合: {count}',
      variableConflicts: 'グローバル変数キーの競合: {count}',
      settingsChanges: '設定の変更: {count}',
      warnings: '警告',
      blocked: 'インポートがブロックされました',
      overwrite: '上書き',
      overwriting: '上書き中...',
      merge: 'マージ',
      merging: 'マージ中...',
      previewFailed: 'インポートのプレビューに失敗しました。ファイル形式を確認してください。',
      failed: 'インポートに失敗しました。ファイル形式を確認してください。',
      completeMerged: 'インポート完了: 既存のデータとマージしました。',
      completeOverwritten: 'インポート完了: 既存のデータをインポートしたパックで上書きしました。'
    }
  },
  pack: {
    missingIds: 'IDのないインポート項目があったため、再生成されます。',
    missingNames: '名前のないインポート項目があったため、補正されました。',
    duplicateIds: 'インポートファイルで重複したIDが {count} 件見つかりました。',
    empty: 'インポートファイルにスニペット、フォルダ、グローバル変数が含まれていません。',
    invalidJson: '無効なJSONファイルです。',
    notObject: 'インポートファイルはJSONオブジェクトである必要があります。',
    missingSchema: 'インポートファイルに schemaVersion がありません。',
    unsupportedSchema: '未対応のスキーマバージョンです: {version}',
    missingData: 'インポートファイルにデータがありません。'
  },
  analytics: {
    consentEyebrowOpt: '任意の分析',
    consentTitle: 'Dynamic Snippets の改善にご協力ください',
    consentDescription: '匿名の使用状況イベントのみを収集し、スニペットや個人データは一切取得しません。',
    detailsLabel: 'データ収集の詳細',
    collectTitle: '収集する情報',
    collectUsage: '機能とボタンの使用状況',
    collectTimestamps: 'ローカルのタイムスタンプ',
    neverTitle: '収集しない情報',
    neverSnippets: 'スニペットの内容',
    neverVariables: '変数の値',
    neverPersonal: '個人データ',
    note: 'この設定はこの拡張機能内にローカル保存されます。',
    decline: '今はしない',
    accept: '匿名の分析を許可'
  },
  rate: {
    eyebrow: 'ご意見をお聞かせください',
    title: 'Dynamic Snippets はお気に入りですか？',
    text: '使い始めて1日が経ちました。お役に立てたなら、ぜひレビューをお願いします。',
    starsLabel: '5つ星評価',
    dismiss: '結構です',
    later: 'あとで',
    accept: '星5つで評価'
  },
  welcome: {
    ariaLabel: 'ようこそ',
    heading: 'スマートなスニペットを数秒で作成',
    lead: '左側のスニペットを選択するか、サイドバーのメニューから新規作成してください。変数を使うと、挿入時にすばやく値を入力できます。',
    dropdown: {
      title: 'ドロップダウン変数',
      text: '貼り付け時に、あらかじめ用意した値から選べます。'
    },
    text: {
      title: 'テキスト入力変数',
      text: '挿入前に任意の値の入力を求めます。'
    },
    date: {
      title: '日付変数',
      text: '日付を選んで、お使いのローカル形式で挿入します。'
    },
    global: {
      title: 'グローバル変数',
      text: '設定の値を使用します。存在しないキーは次のように貼り付けられます:'
    },
    tip1: 'ヒント: エディタで右クリックすると、変数をすばやく追加できます。',
    tip2: 'ヒント: フォルダを使って、プロジェクトやワークフローごとにスニペットを整理できます。',
    tip3: 'ヒント: 日付変数はブラウザのローカル形式で挿入されます。',
    viewHistory: 'バージョン履歴を見る'
  },
  changelog: {
    versionHistory: 'バージョン履歴',
    whatsNew: '新機能',
    releaseNotes: 'リリースノート',
    latestUpdates: '最新のアップデート',
    version: 'バージョン {version}',
    openChangelog: '変更履歴を開く',
    closeChangelog: '変更履歴を閉じる',
    comingSoon: '近日公開',
    viewingDetails: 'リリースの詳細を表示しています。',
    chooseRelease: 'リリースカードを選ぶと、変更内容の全文を確認できます。',
    onlyOnce: 'この表示はバージョンごとに1回のみです。',
    closeHistory: '履歴を閉じる',
    gotIt: '了解',
    types: {
      added: '追加',
      changed: '変更',
      fixed: '修正',
      removed: '削除'
    }
  }
};

"use client";

import {
  getKanaRows,
  KANA_BY_SCRIPT,
  KANA_CATEGORY_LABELS,
  type KanaCategory,
  type KanaScript,
} from "@/data/kana";
import type { TestSettings } from "@/lib/test-settings";

type Props = {
  script: KanaScript;
  settings: TestSettings;
  onChange: (settings: TestSettings) => void;
  allowedCategories?: KanaCategory[];
};

export function KanaScopeSelector({ script, settings, onChange, allowedCategories }: Props) {
  const presentCategories = [...new Set(KANA_BY_SCRIPT[script].map((kana) => kana.category))];
  const categories = presentCategories.filter((category) => !allowedCategories || allowedCategories.includes(category));
  const selectedCategories = settings.categories.filter((category) => categories.includes(category));
  const rows = getKanaRows(script, selectedCategories);

  const selectCategories = (nextCategories: KanaCategory[]) => {
    const nextRows = getKanaRows(script, nextCategories).map((row) => row.key);
    onChange({ ...settings, categories: nextCategories, rows: nextRows });
  };

  const toggleCategory = (category: KanaCategory) => {
    if (selectedCategories.includes(category)) {
      onChange({
        ...settings,
        categories: selectedCategories.filter((item) => item !== category),
        rows: settings.rows.filter((row) => !row.startsWith(`${category}:`)),
      });
      return;
    }
    onChange({
      ...settings,
      categories: [...selectedCategories, category],
      rows: [...new Set([...settings.rows, ...getKanaRows(script, [category]).map((row) => row.key)])],
    });
  };

  const toggleRow = (key: string) => {
    const nextRows = settings.rows.includes(key)
      ? settings.rows.filter((row) => row !== key)
      : [...settings.rows, key];
    onChange({ ...settings, rows: nextRows });
  };

  return (
    <div className="kana-scope-selector">
      <div className="scope-heading">
        <div><strong>Kana scope</strong><span>Select one or more categories and rows.</span></div>
        <div className="scope-actions">
          <button type="button" onClick={() => selectCategories(categories)}>Select all</button>
          <button type="button" onClick={() => onChange({ ...settings, categories: [], rows: [] })}>Clear</button>
        </div>
      </div>
      <div className="scope-category-buttons">
        {categories.map((category) => (
          <button
            type="button"
            className={selectedCategories.includes(category) ? "selected" : ""}
            key={category}
            onClick={() => toggleCategory(category)}
            aria-pressed={selectedCategories.includes(category)}
          >
            {KANA_CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>
      {rows.length > 0 && (
        <div className="scope-row-groups">
          {selectedCategories.map((category) => (
            <div className="scope-row-group" key={category}>
              <span>{KANA_CATEGORY_LABELS[category]}</span>
              <div>
                {rows.filter((row) => row.category === category).map((row) => (
                  <button
                    type="button"
                    className={settings.rows.includes(row.key) ? "selected" : ""}
                    key={row.key}
                    onClick={() => toggleRow(row.key)}
                    aria-pressed={settings.rows.includes(row.key)}
                  >
                    {row.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

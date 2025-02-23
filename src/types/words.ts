export interface WordResult {
  word: string;
  is_exact: boolean;
  wildcard_positions?: number[];
}

export interface WordGroups {
  [key: string]: WordResult[];
}

export interface WordVariation {
  word: string;
  variation_type: 'exact' | 'wildcard_1' | 'wildcard_2' | 'plus_one' | 'shorter';
  wildcards_used: number;
  sort_order: number;
  wildcard_positions?: number[];
}

export interface AnagramResults {
  exact: WordGroups;
  plusOne: WordGroups;
  shorter: WordGroups;
}
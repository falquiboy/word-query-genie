export interface WordResult {
  word: string;
  is_exact: boolean;
}

export interface WordGroups {
  [key: string]: WordResult[];
}

export interface AnagramResults {
  exact: WordGroups;
  plusOne: WordGroups;
  shorter: WordGroups;
}
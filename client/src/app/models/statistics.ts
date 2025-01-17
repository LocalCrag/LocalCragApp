type ItemCompletion = {
  ascents: number;
  totalLines: number;
};

export type Completion = {
  crags: { [cragId: string]: ItemCompletion };
  sectors: { [cragId: string]: ItemCompletion };
  areas: { [cragId: string]: ItemCompletion };
};

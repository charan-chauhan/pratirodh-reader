export type SectionLayout = 'grid' | 'digest' | 'carousel' | 'feature' | 'gallery' | 'opinion';
export type Section = { slug: string; label: string; layout: SectionLayout; home: boolean };

export const sections: Section[] = [
  { slug: 'politics-society', label: 'Politics & Society', layout: 'digest', home: true },
  { slug: 'earth-and-ecology', label: 'Earth and Ecology', layout: 'carousel', home: true },
  { slug: 'world-view', label: 'World View', layout: 'feature', home: true },
  { slug: 'arts-and-aesthetics', label: 'Arts and Aesthetics', layout: 'gallery', home: true },
  { slug: 'the-new-feudals', label: 'The New Feudals', layout: 'opinion', home: true },
  { slug: 'newswires', label: 'Newswires', layout: 'grid', home: false },
  { slug: 'for-the-record', label: 'For the Record', layout: 'grid', home: false },
  { slug: 'multimedia', label: 'Multimedia', layout: 'grid', home: false },
];

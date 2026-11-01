import { describe, it, expect } from 'vitest';
import { HELP_FAQS, searchFaqs } from './help-faqs';

describe('help center search', () => {
  it('finds WASSCE questions', () => expect(searchFaqs(HELP_FAQS, 'wassce', null).some(f => f.q === 'Can I download past WASSCE papers?')).toBe(true));
  it('filters by category', () => expect(searchFaqs(HELP_FAQS, '', 'payments').map(f => f.q)).toEqual(['Is BridgeLIB free to use?']));
  it('returns nothing for unmatched words', () => expect(searchFaqs(HELP_FAQS, 'zzzz', null)).toHaveLength(0));
  it('lists the eight reference questions first', () => expect(HELP_FAQS[7]?.q).toBe('What if I face technical problems?'));
});

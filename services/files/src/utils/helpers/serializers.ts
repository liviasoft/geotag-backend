import * as CheerioObj from 'cheerio';

export const extractAttrFromHTML = ({
  tag = 'a',
  attr = 'href',
  html = '',
}: {
  tag?: string;
  attr?: string;
  html: string;
}) => {
  const $ = CheerioObj.load(html);

  const results: string[] = [];

  $(tag).each((_, e) => {
    const href = $(e).attr(attr);
    if (href) {
      results.push(href);
    }
  });
  return results;
};

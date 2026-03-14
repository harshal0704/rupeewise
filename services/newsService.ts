import { finnhub, NewsItem } from './finnhub';

export interface UnifiedNewsItem {
    id: string;
    headline: string;
    summary: string;
    url: string;
    source: string;
    datetime: number; // Unix timestamp
    image?: string;
    category?: string;
}

const CORS_PROXY = 'https://corsproxy.io/?'; // Using corsproxy.io as it's more reliable

const CATEGORY_FEEDS: Record<string, {source: string, url: string}[]> = {
    general: [
        { source: 'Moneycontrol', url: 'https://www.moneycontrol.com/rss/MCtopnews.xml' },
        { source: 'LiveMint', url: 'https://www.livemint.com/rss/markets' },
        { source: 'Economic Times', url: 'https://economictimes.indiatimes.com/markets/rssfeeds/19770215.cms' },
        { source: 'Business Standard', url: 'https://www.business-standard.com/rss/markets-106.rss' },
        { source: 'CNBC-TV18', url: 'https://www.cnbctv18.com/rss/market.xml' }
    ],
    crypto: [
        { source: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
        { source: 'CoinTelegraph', url: 'https://cointelegraph.com/rss' },
        { source: 'NewsBTC', url: 'https://newsbtc.com/feed/' }
    ],
    technology: [
        { source: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
        { source: 'Economic Times Tech', url: 'https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms' },
        { source: 'LiveMint Tech', url: 'https://www.livemint.com/rss/technology' }
    ],
    business: [
        { source: 'Business Standard Companies', url: 'https://www.business-standard.com/rss/companies-109.rss' },
        { source: 'Financial Express', url: 'https://www.financialexpress.com/market/feed/' },
        { source: 'Forbes India', url: 'https://www.forbesindia.com/rss/allcontent.xml' }
    ],
    economy: [
        { source: 'Economic Times Economy', url: 'https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms' },
        { source: 'LiveMint Economy', url: 'https://www.livemint.com/rss/economy' },
        { source: 'Business Line', url: 'https://www.thehindubusinessline.com/economy/feeder/default.rss' }
    ]
};

export const newsService = {
    async getAggregatedNews(category: string = 'general'): Promise<UnifiedNewsItem[]> {
        const unifiedNews: UnifiedNewsItem[] = [];

        try {
            // 1. Fetch Finnhub News (Global context)
            const finnhubNews = await finnhub.getMarketNews(category);
            if (finnhubNews && finnhubNews.length > 0) {
                const mapped = finnhubNews.map((n: NewsItem) => ({
                    id: `finnhub-${n.id}`,
                    headline: n.headline,
                    summary: n.summary,
                    url: n.url,
                    source: n.source || 'Global Markets',
                    datetime: n.datetime,
                    image: n.image,
                    category: n.category
                }));
                unifiedNews.push(...mapped.slice(0, 15)); // Cap finnhub to 15 items
            }

            // 2. Fetch RSS Feeds securely via CORS Proxy
            const feedsToFetch = CATEGORY_FEEDS[category] || CATEGORY_FEEDS['general'];
            
            const rssPromises = feedsToFetch.map(async (feed) => {
                try {
                    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(feed.url)}`);
                    if (!response.ok) return [];
                    
                    let xmlText = '';
                    const contentType = response.headers.get('content-type') || '';
                    if (contentType.includes('application/json')) {
                        const data = await response.json();
                        xmlText = data.contents || data; // Handle allorigins format just in case
                    } else {
                        xmlText = await response.text();
                    }

                    const parser = new DOMParser();
                    const xml = parser.parseFromString(xmlText, "text/xml");
                    const items = Array.from(xml.querySelectorAll('item')).slice(0, 8); // Top 8 per feed

                    return items.map((item, index) => {
                        const title = item.querySelector('title')?.textContent || '';
                        const link = item.querySelector('link')?.textContent || '';
                        const pubDate = item.querySelector('pubDate')?.textContent || '';
                        const description = item.querySelector('description')?.textContent?.replace(/<[^>]*>?/gm, '').substring(0, 200) + '...' || '';
                        
                        // Enhanced Image extraction
                        let contentUrl = '';
                        const mediaContent = item.getElementsByTagName('media:content')[0];
                        if (mediaContent) contentUrl = mediaContent.getAttribute('url') || '';
                        
                        if (!contentUrl) {
                            const enclosure = item.querySelector('enclosure');
                            if (enclosure) contentUrl = enclosure.getAttribute('url') || '';
                        }
                        
                        if (!contentUrl) {
                            // Try to find image in description if possible (hacky)
                            const desc = item.querySelector('description')?.textContent || '';
                            const match = desc.match(/src="([^"]+)"/);
                            if (match) contentUrl = match[1];
                        }

                        return {
                            id: `rss-${feed.source}-${index}-${Date.now()}`,
                            headline: title,
                            summary: description,
                            url: link,
                            source: feed.source,
                            datetime: Math.floor(new Date(pubDate).getTime() / 1000) || Math.floor(Date.now() / 1000),
                            image: contentUrl,
                            category: 'Markets'
                        };
                    });
                } catch (e) {
                    // Silently fail for individual feeds
                    return [];
                }
            });

            const rssResults = await Promise.all(rssPromises);
            rssResults.forEach(resultsArray => {
                if (resultsArray && resultsArray.length > 0) {
                    unifiedNews.push(...resultsArray);
                }
            });

            // 3. Sort by datetime descending (newest first)
            unifiedNews.sort((a, b) => b.datetime - a.datetime);

            // 4. De-duplicate headlines (sometimes same news across providers)
            const seen = new Set();
            return unifiedNews.filter(item => {
                const normalizedHeadline = item.headline.toLowerCase().trim().substring(0, 50);
                if (seen.has(normalizedHeadline)) return false;
                seen.add(normalizedHeadline);
                return true;
            });

        } catch (error) {
            console.error("News Aggregation Error:", error);
            return unifiedNews;
        }
    }
};

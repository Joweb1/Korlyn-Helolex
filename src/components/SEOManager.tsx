import React, { useEffect } from 'react';
import korlynCubeImg from '../assets/images/korlyn_cube_illustration_1782756172238.jpg';
import helolexGameBanner from '../assets/images/helolex_game_banner.png';

interface SEOManagerProps {
  currentView: 'korlyn' | 'helolex' | 'admin' | 'print-certificate';
}

export const SEO_DATA = {
  korlyn: {
    title: 'KORLYN | Your Premium Platform for Digital Assets & Direct Payments',
    description: 'Claim, showcase, and monetize your digital creations instantly with KORLYN. Easy-to-use live dashboards, verified ownership registries, and fast global payouts. No code required. Set up your custom digital store and start earning today.',
    keywords: 'korlyn, digital ownership, creator economy, digital store, quick payouts, no-code monetization, custom dashboard, asset certification',
    url: 'https://mydomain.com/',
    imageUrl: korlynCubeImg,
    imageAlt: 'The KORLYN Premium Monolithic Product Cube',
    tagline: 'Zero Code. True Ownership. Instant Payouts.',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'KORLYN Platform',
      'operatingSystem': 'All',
      'applicationCategory': 'DeveloperApplication',
      'description': 'True digital asset title registries and seamless visual monetization dashboard for creators.',
      'browserRequirements': 'Requires HTML5 compatible browser.',
      'softwareVersion': '1.0.0',
      'offers': {
        '@type': 'Offer',
        'price': '0.00',
        'priceCurrency': 'USD',
        'category': 'Free Tier'
      },
      'featureList': [
        'Premium Title Registry',
        'Built-in Visual Monetization Canvas',
        'Advanced Creator Analytics & Funnels',
        'Instant Global CDN Distribution'
      ],
      'screenshot': 'https://raw.githubusercontent.com/Joweb1/Jovibe-images/main/korlyn_cube_illustration.jpg'
    },
    aioKeywords: [
      'What is KORLYN premium digital ownership platform',
      'How to monetize digital creations without coding',
      'Best dashboard for verified asset registries',
      'No-code digital monetization and instant payouts'
    ]
  },
  helolex: {
    title: 'HELOLEX Realms | Play Epic Indie Games & Claim Game Passes',
    description: 'Play premium indie games like Solstice Assassin, Ludo Max, and Sweet Match on HELOLEX. Claim your official verified game pass and unlock your mobile validation QR code. Enter the elite gaming lobby now.',
    keywords: 'helolex, play indie games, solstice assassin, ludo max, sweet match, boaster, road ball, game pass, mobile qr code, play to earn, epic games',
    url: 'https://mydomain.com/helolex',
    imageUrl: helolexGameBanner,
    imageAlt: 'HELOLEX Cinematic Game Realms Banner',
    tagline: 'Epic Indie Games. Verified Official Passes. Instant Mobile QR.',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'HELOLEX Game Realms',
      'url': 'https://mydomain.com/helolex',
      'description': 'Premium indie game publishing hub featuring Solstice Assassin, Helolex Ludo Max, Helolex Sweet Match, Helolex Boaster, and Helolex Road Ball with secure validation passes.',
      'genre': 'Indie Gaming',
      'image': helolexGameBanner,
      'publisher': {
        '@type': 'Organization',
        'name': 'HELOLEX',
        'logo': {
          '@type': 'ImageObject',
          'url': helolexGameBanner
        }
      },
      'hasPart': [
        { '@type': 'CreativeWork', 'name': 'Solstice Assassin', 'genre': 'Action Adventure' },
        { '@type': 'CreativeWork', 'name': 'Helolex Ludo Max', 'genre': 'Board / Multiplayer' },
        { '@type': 'CreativeWork', 'name': 'Helolex Sweet Match', 'genre': 'Puzzle' },
        { '@type': 'CreativeWork', 'name': 'Helolex Boaster', 'genre': 'Arcade' },
        { '@type': 'CreativeWork', 'name': 'Helolex Road Ball', 'genre': 'Racing / Arcade' }
      ]
    },
    aioKeywords: [
      'Play Helolex games Solstice Assassin and Ludo Max',
      'How to validate approved ownership ID for Helolex',
      'Unlock mobile QR verification for indie game realms',
      'Register for Helolex sweet match and road ball'
    ]
  },
  admin: {
    title: 'HELOLEX Admin Console | Secure Verification & Audit Panel',
    description: 'Secure administrative interface. Oversee digital ownership contracts, audit incoming financial records, manage bank transfers, and provision secure mobile validation QR certificates.',
    keywords: 'admin console, secure registries, payout authorization, ownership contracts',
    url: 'https://mydomain.com/admin',
    imageUrl: korlynCubeImg,
    imageAlt: 'Premium Security Gateway',
    tagline: 'Premium Title Ledger & Creator Governance.',
    structuredData: null,
    aioKeywords: []
  },
  'print-certificate': {
    title: 'Registry Verification Certificate | Secured Record',
    description: 'Official digital title verification registry page. Print or download certified credentials proving premium digital ownership under the HELOLEX protocol.',
    keywords: 'ownership certificate, print verification, digital credentials',
    url: 'https://mydomain.com/print-certificate',
    imageUrl: korlynCubeImg,
    imageAlt: 'Premium Verification Seal',
    tagline: 'Official Sealed Digital Ownership Certificate.',
    structuredData: null,
    aioKeywords: []
  }
};

export default function SEOManager({ currentView }: SEOManagerProps) {
  useEffect(() => {
    const data = SEO_DATA[currentView];
    if (!data) return;

    // 1. Update Title
    document.title = data.title;

    const head = document.head;

    // Helper to set or create meta tag
    const setMetaTag = (attributeName: string, attributeValue: string, content: string) => {
      let element = head.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to set or create link tag
    const setLinkTag = (rel: string, href: string) => {
      let element = head.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Set standard SEO elements
    setMetaTag('name', 'description', data.description);
    setMetaTag('name', 'keywords', data.keywords);
    setMetaTag('name', 'robots', 'index, follow');
    setMetaTag('name', 'author', 'KORLYN & HELOLEX');

    // 3. Set Open Graph (OG) tags (Advanced social optimization)
    const siteUrl = window.location.origin + (currentView === 'korlyn' ? '/' : `/${currentView}`);
    setLinkTag('canonical', siteUrl);

    setMetaTag('property', 'og:title', data.title);
    setMetaTag('property', 'og:description', data.description);
    setMetaTag('property', 'og:type', currentView === 'helolex' ? 'website' : 'article');
    setMetaTag('property', 'og:url', siteUrl);
    setMetaTag('property', 'og:site_name', 'KORLYN & HELOLEX Protocol');
    
    // Resolve absolute image path
    const absoluteImgUrl = data.imageUrl.startsWith('http') 
      ? data.imageUrl 
      : window.location.origin + data.imageUrl;
    setMetaTag('property', 'og:image', absoluteImgUrl);
    setMetaTag('property', 'og:image:alt', data.imageAlt);

    // 4. Set Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', data.title);
    setMetaTag('name', 'twitter:description', data.description);
    setMetaTag('name', 'twitter:image', absoluteImgUrl);

    // 5. Inject Structured JSON-LD Data (AIO & GEO Optimization)
    // AI Agents and Search Engines parse schema.org blocks to fetch rich context and display smart answers.
    const existingJsonLd = document.getElementById('seo-jsonld');
    if (existingJsonLd) {
      existingJsonLd.remove();
    }

    if (data.structuredData) {
      const script = document.createElement('script');
      script.id = 'seo-jsonld';
      script.type = 'application/ld+json';
      
      // Helper to recursively make relative URLs absolute in schema
      const resolveAbsolute = (val: any): any => {
        if (typeof val === 'string') {
          if (val.startsWith('/') || val.startsWith('.') || val.includes('assets/images/')) {
            const cleanPath = val.replace(/^\.+/, '');
            return window.location.origin + (cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath);
          }
          return val;
        }
        if (Array.isArray(val)) {
          return val.map(resolveAbsolute);
        }
        if (val !== null && typeof val === 'object') {
          const res: any = {};
          for (const k in val) {
            res[k] = resolveAbsolute(val[k]);
          }
          return res;
        }
        return val;
      };

      const resolvedStructuredData = resolveAbsolute(data.structuredData);

      // Inject standard and current domain-specific attributes
      const finalSchema = {
        ...resolvedStructuredData,
        'url': siteUrl
      };
      
      script.text = JSON.stringify(finalSchema, null, 2);
      head.appendChild(script);
    }
  }, [currentView]);

  return null; // Side-effect only component
}

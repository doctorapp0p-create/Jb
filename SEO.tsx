
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogUrl?: string;
  ogType?: 'website' | 'profile' | 'article' | 'medical-clinic';
  canonical?: string;
  schemas?: any[];
  lang?: 'en' | 'bn';
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords = [],
  ogImage = '/og-image.jpg',
  ogUrl,
  ogType = 'website',
  canonical,
  schemas = [],
  lang = 'en'
}) => {
  const siteUrl = 'https://nilpha.com';
  const fullCanonical = canonical ? `${siteUrl}${canonical}` : siteUrl;
  const fullOgUrl = ogUrl ? `${siteUrl}${ogUrl}` : fullCanonical;
  
  // Default values for missing fields
  const defaultKeywords = ['Nilpha', 'Nilpha.com', 'Doctor Appointment', 'Nilphamari Doctors', 'Telemedicine Bangladesh', 'ডাক্তার অ্যাপয়েন্টমেন্ট', 'নীলফামারী ডাক্তার'];
  const allKeywords = [...new Set([...keywords, ...defaultKeywords])].join(', ');

  return (
    <>
      <Helmet htmlAttributes={{ lang }}>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={allKeywords} />
        <link rel="canonical" href={fullCanonical} />
        <meta name="robots" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:site_name" content="Nilpha" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`} />
        <meta property="og:url" content={fullOgUrl} />
        <meta property="og:type" content={ogType === 'medical-clinic' ? 'website' : ogType} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`} />

        {/* Structured Data */}
        {schemas.map((schema, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </Helmet>
    </>
  );
};

export default SEO;

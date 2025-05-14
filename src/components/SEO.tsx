import { Helmet } from 'react-helmet';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  canonicalUrl?: string;
}

const SEO = ({
  title = 'JezX - Lead Management Platform',
  description = 'JezX offers a modern lead management and CRM solution to help businesses track, manage, and convert leads effectively.',
  keywords = 'CRM, lead management, customer relationship management, sales pipeline, lead tracking, business management',
  ogImage = 'https://crmx.jezx.in/images/og-image.png',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  canonicalUrl = 'https://crmx.jezx.in',
}: SEOProps) => {
  const fullTitle = `${title} | JezX CRM`;
  
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
};

export default SEO; 
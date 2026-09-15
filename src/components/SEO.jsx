import { Helmet } from 'react-helmet-async';
import { useSite } from '../site/SiteProvider';

export default function SEO({ title, description, keywords }) {
  const { nom: siteName, images } = useSite();
  return (
    <Helmet>
      <title>{`${title} | ${siteName}`}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Geo / Local SEO */}
      <meta name="geo.region" content="FR" />
      <meta name="geo.placename" content="Paris" />

      {/* Open Graph / Social */}
      <meta property="og:title" content={`${title} | ${siteName}`} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {images?.og && <meta property="og:image" content={images.og} />}
    </Helmet>
  );
}

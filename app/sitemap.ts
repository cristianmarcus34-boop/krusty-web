import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://krustyburger.com.ar'
  const currentPath = new Date().toISOString()
 
  return [
    {
      url: baseUrl,
      lastModified: currentPath,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/defensa`,
      lastModified: currentPath,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terminos`,
      lastModified: currentPath,
      changeFrequency: 'monthly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/privacidad`,
      lastModified: currentPath,
      changeFrequency: 'monthly',
      priority: 0.2,
    },
  ]
}
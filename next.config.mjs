/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'uropg.s3.sa-east-1.amazonaws.com' },
      { protocol: 'https', hostname: 'inovare.med.br' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'http', hostname: 'googleusercontent.com' },
      { protocol: 'https', hostname: 'yt3.googleusercontent.com' },
      { protocol: 'https', hostname: 'scontent.*.fbcdn.net' },
      { protocol: 'https', hostname: 'static.medicosbrasil.com' },
      { protocol: 'https', hostname: 'superdrbrasil.com' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
      { protocol: 'https', hostname: 's3-sa-east-1.amazonaws.com' },
      { protocol: 'https', hostname: 'melhores.com' },
      { protocol: 'https', hostname: 'www.angiolifeclinica.com.br' },
      { protocol: 'https', hostname: 'cdn.dpontanews.com.br' },
      { protocol: 'https', hostname: 'www.clinicadaimagempg.com.br' }
    ],
  },
};

export default nextConfig;
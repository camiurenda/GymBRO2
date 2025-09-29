import { Logo } from '@/components/shared/Logo';
import Image from 'next/image';
import placeholderImages from '@/lib/placeholder-images.json';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authImage = placeholderImages.placeholderImages.find(img => img.id === 'auth-hero');

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="flex items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:justify-start">
            <Logo />
          </div>
          {children}
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        {authImage && (
          <Image
            src={authImage.imageUrl}
            alt={authImage.description}
            width={1280}
            height={853}
            className="h-full w-full object-cover"
            data-ai-hint={authImage.imageHint}
            priority
          />
        )}
      </div>
    </div>
  );
}

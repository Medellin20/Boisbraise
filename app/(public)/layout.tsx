import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { RefreshOnReturn } from '@/components/layout/refresh-on-return';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-background flex min-h-screen flex-col">
      <RefreshOnReturn />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

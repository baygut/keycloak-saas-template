import { Header } from "@/components/core/header";
import { Footer } from "@/components/core/footer";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 flex flex-col w-full container py-8">{children}</main>
      <Footer />
    </div>
  );
}

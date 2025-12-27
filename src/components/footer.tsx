import Link from "next/link";
import { Twitter, Instagram, Facebook } from "lucide-react";

const SocialLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link href={href} className="text-muted-foreground hover:text-foreground">
    {children}
  </Link>
);

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} PISA VIBE. Todos os direitos reservados.
        </p>
        <div className="flex items-center gap-4">
          <SocialLink href="#">
            <Instagram className="h-5 w-5" />
          </SocialLink>
          <SocialLink href="#">
            <Facebook className="h-5 w-5" />
          </SocialLink>
          <SocialLink href="#">
            <Twitter className="h-5 w-5" />
          </SocialLink>
        </div>
      </div>
    </footer>
  );
}

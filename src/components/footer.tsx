import Link from "next/link";
import { Twitter, Instagram, Facebook } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

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

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <li>
        <Link href={href} className="text-sm text-muted-foreground hover:text-primary">
            {children}
        </Link>
    </li>
);

export default function Footer() {
  return (
    <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
                <div className="lg:col-span-2">
                    <h3 className="font-headline text-lg font-bold">PISA VIBE</h3>
                    <p className="mt-2 text-sm text-muted-foreground">O seu estilo começa aqui. Tênis e roupas com a atitude que você procura.</p>
                </div>

                <div>
                    <h4 className="font-semibold">Categorias</h4>
                    <ul className="mt-4 space-y-2">
                        <FooterLink href="/produtos?categoria=masculino">Masculino</FooterLink>
                        <FooterLink href="/produtos?categoria=feminino">Feminino</FooterLink>
                        <FooterLink href="/produtos?categoria=lancamentos">Lançamentos</FooterLink>
                        <FooterLink href="/produtos?categoria=ofertas">Ofertas</FooterLink>
                    </ul>
                </div>

                 <div>
                    <h4 className="font-semibold">Ajuda</h4>
                    <ul className="mt-4 space-y-2">
                        <FooterLink href="#">Dúvidas Frequentes</FooterLink>
                        <FooterLink href="#">Entregas e Frete</FooterLink>
                        <FooterLink href="#">Trocas e Devoluções</FooterLink>
                        <FooterLink href="#">Fale Conosco</FooterLink>
                    </ul>
                </div>
                
                 <div>
                    <h4 className="font-semibold">Institucional</h4>
                    <ul className="mt-4 space-y-2">
                        <FooterLink href="#">Sobre Nós</FooterLink>
                        <FooterLink href="#">Política de Privacidade</FooterLink>
                        <FooterLink href="#">Termos de Uso</FooterLink>
                    </ul>
                </div>
            </div>
        </div>
      <div className="bg-secondary text-secondary-foreground">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row">
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
      </div>
    </footer>
  );
}

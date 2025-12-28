
import Link from "next/link";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { megaMenuData } from "@/lib/menu-data";

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <li>
        <Link href={href} className="text-sm text-muted-foreground hover:text-primary">
            {children}
        </Link>
    </li>
);

export default function Footer() {
  const getCategoryHref = (title: string) => {
    if (title.toLowerCase() === 'masculino') return "/produtos?categoria=masculino";
    if (title.toLowerCase() === 'feminino') return "/produtos?categoria=feminino";
    if (title.toLowerCase() === 'lançamentos') return "/produtos?categoria=lancamentos";
    if (title.toLowerCase() === 'ofertas') return "/produtos?categoria=ofertas";
    return "#";
  }


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
                       {megaMenuData.map((category) => (
                           <FooterLink key={category.title} href={getCategoryHref(category.title)}>
                                {category.title}
                           </FooterLink>
                       ))}
                    </ul>
                </div>

                 <div>
                    <h4 className="font-semibold">Ajuda</h4>
                    <ul className="mt-4 space-y-2">
                        <FooterLink href="/duvidas-frequentes">Dúvidas Frequentes</FooterLink>
                        <FooterLink href="/trocas-e-devolucoes">Trocas e Devoluções</FooterLink>
                        <FooterLink href="/fale-conosco">Fale Conosco</FooterLink>
                    </ul>
                </div>
                
                 <div>
                    <h4 className="font-semibold">Institucional</h4>
                    <ul className="mt-4 space-y-2">
                        <FooterLink href="/sobre-nos">Sobre Nós</FooterLink>
                        <FooterLink href="/politica-de-privacidade">Política de Privacidade</FooterLink>
                        <FooterLink href="/termos-de-uso">Termos de Uso</FooterLink>
                        <FooterLink href="/entregas-e-envios">Entregas e Envios</FooterLink>
                    </ul>
                </div>
            </div>
        </div>
      <div className="bg-secondary text-secondary-foreground">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PISA VIBE. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

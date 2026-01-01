
import { Code, Users, Heart } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Créditos - PISA VIBE',
    description: 'Agradecimentos a todos que contribuíram para a criação da PISA VIBE.',
};

const CreditSection = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <section>
        <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold">
            {icon}
            {title}
        </h2>
        <div className="space-y-4 text-muted-foreground">
            {children}
        </div>
    </section>
);

const CreditLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
        {children}
    </a>
);


export default function CreditsPage() {
    return (
        <div className="container mx-auto max-w-4xl px-4 py-12">
            <header className="mb-10 text-center">
                <Heart className="mx-auto h-12 w-12 text-primary" />
                <h1 className="mt-4 font-headline text-4xl font-bold">Créditos</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Um agradecimento especial às ferramentas, tecnologias e pessoas que tornaram este projeto possível.
                </p>
            </header>

            <main className="space-y-10">
                <CreditSection title="Desenvolvimento e Design" icon={<Code className="h-7 w-7 text-primary" />}>
                     <p>
                        Este site foi desenvolvido com paixão e as mais modernas tecnologias web para oferecer a melhor experiência.
                    </p>
                    <ul className="list-inside list-disc space-y-2 pl-4">
                        <li>Desenvolvido por: <CreditLink href="https://www.linkedin.com/in/dylon-cirne-171809204/">Dylon Cirne</CreditLink></li>
                        <li>Plataforma: <CreditLink href="https://nextjs.org/">Next.js</CreditLink></li>
                        <li>Estilização: <CreditLink href="https://tailwindcss.com/">Tailwind CSS</CreditLink> & <CreditLink href="https://ui.shadcn.com/">Shadcn/UI</CreditLink></li>
                        <li>Backend e Hospedagem: <CreditLink href="https://firebase.google.com/">Firebase</CreditLink></li>
                    </ul>
                </CreditSection>
                
                <CreditSection title="Recursos Visuais" icon={<Users className="h-7 w-7 text-primary" />}>
                    <p>
                       As belas imagens que você vê em nosso site foram fornecidas por fotógrafos talentosos de todo o mundo, através de plataformas como:
                    </p>
                    <ul className="list-inside list-disc space-y-2 pl-4">
                        <li><CreditLink href="https://unsplash.com/">Unsplash</CreditLink></li>
                        <li><CreditLink href="https://www.pexels.com/">Pexels</CreditLink></li>
                    </ul>
                </CreditSection>

                <section className="border-t pt-8 text-center">
                     <h2 className="mb-4 font-headline text-2xl font-bold">
                       Obrigado por fazer parte!
                    </h2>
                    <p className="text-muted-foreground">
                      A PISA VIBE não existiria sem a comunidade e as ferramentas de código aberto. Nosso muito obrigado a todos!
                    </p>
                </section>
            </main>
        </div>
    );
}


import { Code, Users, Heart, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    title: 'Créditos - PISA VIBE',
    description: 'Um projeto desenvolvido pela Impulso Digital.',
};

export default function CreditsPage() {
    return (
        <div className="container mx-auto max-w-4xl px-4 py-16">
            <header className="mb-12 text-center">
                <Heart className="mx-auto h-12 w-12 text-primary" />
                <h1 className="mt-4 font-headline text-4xl font-bold">Créditos</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Este projeto foi idealizado e construído com dedicação e as melhores tecnologias.
                </p>
            </header>

            <main className="space-y-10">
                 <section className="rounded-lg border bg-card p-8 text-center shadow-sm">
                    <h2 className="mb-4 font-headline text-2xl font-bold">
                        Desenvolvido por Impulso Digital
                    </h2>
                    <p className="mx-auto max-w-xl text-muted-foreground">
                        Este site foi cuidadosamente elaborado pela <strong>Impulso Digital</strong>, uma agência focada em criar soluções web modernas e de alta performance que geram resultados.
                    </p>
                    <Button asChild className="mt-6">
                        <a href="https://impulsodigital.com.br/" target="_blank" rel="noopener noreferrer">
                            Visite o Site
                             <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                </section>
                
                <section>
                    <h2 className="mb-4 flex items-center justify-center gap-3 font-headline text-2xl font-bold">
                        <Code className="h-7 w-7 text-primary" />
                        Tecnologias Utilizadas
                    </h2>
                    <ul className="mx-auto max-w-md list-inside list-disc space-y-2 text-center text-muted-foreground">
                        <li>Plataforma: <span className="font-semibold">Next.js</span></li>
                        <li>Estilização: <span className="font-semibold">Tailwind CSS & Shadcn/UI</span></li>
                        <li>Backend e Hospedagem: <span className="font-semibold">Firebase</span></li>
                    </ul>
                </section>
                
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

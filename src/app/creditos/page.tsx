
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
                
            </main>
        </div>
    );
}

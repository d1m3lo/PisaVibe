import { Award, Code, Users, Heart, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
          Um agradecimento especial a quem tornou este projeto possível.
        </p>
      </header>

      <main>
        <Card className="overflow-hidden shadow-lg transition-shadow hover:shadow-xl">
          <CardHeader className="bg-muted/30 p-6 text-center">
            <Award className="mx-auto h-10 w-10 text-primary" />
            <CardTitle className="mt-4 font-headline text-2xl">
              Desenvolvido por Impulso Digital
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <p className="mx-auto max-w-xl text-lg text-muted-foreground">
              Este e-commerce foi cuidadosamente elaborado pela{' '}
              <strong>Impulso Digital</strong>, uma agência focada em criar
              soluções web de alta performance que geram resultados reais.
            </p>
            <Button asChild className="mt-8" size="lg">
              <a
                href="https://studio--studio-4417341545-c813a.us-central1.hosted.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Conheça a Agência
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

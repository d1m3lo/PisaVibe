
import { Target, Zap, Heart } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
    title: 'Sobre Nós - PISA VIBE',
    description: 'Conheça a história e a missão da PISA VIBE, a sua loja de estilo urbano e minimalista.',
};

export default function AboutUsPage() {
    return (
        <div className="bg-background text-foreground">
            <div className="container mx-auto max-w-5xl px-4 py-16">
                <header className="mb-12 text-center">
                    <h1 className="font-headline text-5xl font-extrabold tracking-tight">
                        Nossa Vibe é o seu Estilo.
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        A PISA VIBE nasceu da paixão pelo estilo urbano e pela cultura minimalista. Acreditamos que a moda é uma forma de expressão e que cada peça deve refletir quem você é, com atitude e simplicidade.
                    </p>
                </header>

                <div className="relative mb-16 h-80 w-full overflow-hidden rounded-lg">
                    <Image
                        src="https://images.unsplash.com/photo-1529339944249-111a843e942f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHx1cmJhbiUyMGZhc2hpb24lMjBncm91cHxlbnwwfHx8fDE3NjY4MjY3NDl8MA&ixlib=rb-4.1.0&q=80&w=1080"
                        alt="Grupo de pessoas com estilo urbano"
                        fill
                        className="object-cover"
                        data-ai-hint="urban fashion group"
                    />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>


                <main className="space-y-16">
                    <section className="grid grid-cols-1 gap-12 md:grid-cols-3">
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Target className="h-7 w-7" />
                            </div>
                            <h2 className="font-headline text-2xl font-bold">Nossa Missão</h2>
                            <p className="mt-2 text-muted-foreground">
                                Oferecer produtos de alta qualidade com design autêntico, que permitam que você pise com confiança e mostre sua verdadeira vibe, unindo conforto, durabilidade e estilo.
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Zap className="h-7 w-7" />
                            </div>
                            <h2 className="font-headline text-2xl font-bold">Nossa Visão</h2>
                            <p className="mt-2 text-muted-foreground">
                                Ser a marca referência em moda urbana minimalista no Brasil, reconhecida pela curadoria de produtos que ditam tendências e pela conexão genuína com nossa comunidade.
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                             <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Heart className="h-7 w-7" />
                            </div>
                            <h2 className="font-headline text-2xl font-bold">Nossos Valores</h2>
                            <p className="mt-2 text-muted-foreground">
                                Atitude, Simplicidade, Qualidade e Comunidade. Valorizamos a autenticidade e a conexão com nossos clientes, sempre buscando o melhor em cada detalhe.
                            </p>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}

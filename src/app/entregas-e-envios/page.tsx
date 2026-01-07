

import { Award, CheckCircle, Diamond, Package, Star, Truck } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Envios e Entregas - PISA VIBE',
    description: 'Saiba como funciona nosso sistema de envio inteligente para garantir mais agilidade, eficiência e segurança na entrega dos seus produtos.',
};

export default function ShippingAndDeliveryPage() {
    return (
        <div className="container mx-auto max-w-4xl px-4 py-12">
            <header className="mb-10 text-center">
                <Package className="mx-auto h-12 w-12 text-primary" />
                <h1 className="mt-4 font-headline text-4xl font-bold">Envios e Entregas — Pisa Vibe</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Na Pisa Vibe, trabalhamos com um sistema de envio inteligente para garantir mais agilidade, eficiência e segurança na entrega dos nossos produtos. Nosso objetivo é fazer com que seu pedido chegue o mais rápido possível, mantendo sempre um padrão de qualidade e cuidado em cada etapa.
                </p>
            </header>

            <main className="space-y-12">
                <section>
                    <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold">
                        <Truck className="h-7 w-7 text-primary" />
                        Como funciona a entrega?
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                            Para otimizar prazos e garantir maior disponibilidade de produtos, trabalhamos com centros de distribuição parceiros, localizados em diferentes regiões.
                        </p>
                        <p>Isso significa que o seu pedido pode ser enviado diretamente de um desses parceiros, permitindo:</p>
                        <ul className="list-inside list-disc space-y-2 pl-4">
                            <li>Entregas mais rápidas</li>
                            <li>Menor risco de atrasos</li>
                            <li>Melhor disponibilidade de modelos e tamanhos</li>
                        </ul>
                         <p>Por esse motivo, a embalagem pode variar, podendo chegar em caixas ou embalagens diferentes do padrão da loja.</p>
                    </div>
                </section>

                <section className="rounded-lg border bg-secondary/50 p-6">
                    <h3 className="mb-2 font-semibold text-lg">Por que meu pedido chegou em uma embalagem diferente?</h3>
                    <p className="text-muted-foreground">
                        Alguns pedidos são enviados diretamente de nossos centros parceiros para garantir mais agilidade no envio. Por isso, é normal que a embalagem não tenha a identidade visual da Pisa Vibe.
                    </p>
                    <p className="mt-3 text-sm font-bold">
                        ⚠️ Importante: A embalagem pode variar, mas o cuidado, a conferência e o padrão de qualidade continuam os mesmos.
                    </p>
                </section>

                <section>
                    <h2 className="mb-6 text-center font-headline text-2xl font-bold">
                        Entenda nossas classificações de qualidade
                    </h2>
                    <p className="mb-8 text-center text-muted-foreground">
                        Para oferecer opções que atendam diferentes estilos e necessidades, trabalhamos com quatro níveis de qualidade:
                    </p>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                        <div className="flex flex-col items-center text-center">
                            <Diamond className="h-10 w-10 text-cyan-500" />
                            <h3 className="mt-3 font-bold text-xl">Qualidade Ultra</h3>
                            <p className="mt-1 text-sm text-muted-foreground">A perfeição em cada detalhe.</p>
                             <ul className="mt-3 list-inside list-disc text-sm text-muted-foreground space-y-1 text-left">
                                <li>Materiais premium</li>
                                <li>Acabamento impecável</li>
                                <li>Fidelidade máxima</li>
                                <li>Para os mais exigentes</li>
                            </ul>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <Award className="h-10 w-10 text-yellow-500" />
                            <h3 className="mt-3 font-bold text-xl">Qualidade Elite</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Nossa categoria mais alta.</p>
                             <ul className="mt-3 list-inside list-disc text-sm text-muted-foreground space-y-1 text-left">
                                <li>Acabamento superior</li>
                                <li>Materiais de alto padrão</li>
                                <li>Visual extremamente fiel</li>
                                <li>Ideal para quem busca o melhor</li>
                            </ul>
                        </div>
                         <div className="flex flex-col items-center text-center">
                            <Star className="h-10 w-10 text-blue-500" />
                            <h3 className="mt-3 font-bold text-xl">Qualidade Select</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Equilíbrio perfeito.</p>
                            <ul className="mt-3 list-inside list-disc text-sm text-muted-foreground space-y-1 text-left">
                                <li>Excelente acabamento</li>
                                <li>Ótima durabilidade</li>
                                <li>Visual muito próximo</li>
                            </ul>
                        </div>
                         <div className="flex flex-col items-center text-center">
                            <CheckCircle className="h-10 w-10 text-green-500" />
                            <h3 className="mt-3 font-bold text-xl">Qualidade Essential</h3>
                             <p className="mt-1 text-sm text-muted-foreground">Praticidade para o dia a dia.</p>
                           <ul className="mt-3 list-inside list-disc text-sm text-muted-foreground space-y-1 text-left">
                                <li>Boa qualidade e conforto</li>
                                <li>Design funcional</li>
                                <li>Ótimo custo-benefício</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="border-t pt-8 text-center">
                     <h2 className="mb-4 font-headline text-2xl font-bold">
                       Nosso compromisso com você
                    </h2>
                    <p className="text-muted-foreground">
                        Todos os produtos passam por verificação antes do envio e seguem nossos critérios internos de qualidade. Caso tenha qualquer dúvida sobre seu pedido, prazos ou características do produto, nossa equipe de suporte está sempre pronta para te atender.
                    </p>
                    <p className="mt-4 font-semibold">
                         📩 Fale com a gente sempre que precisar.
                    </p>
                </section>
            </main>
        </div>
    );
}

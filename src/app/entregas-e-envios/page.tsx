

import { Award, CheckCircle, Diamond, Package, Star, Truck, Gem, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
    title: 'Envios e Entregas - PISA VIBE',
    description: 'Saiba como funciona nosso sistema de envio inteligente para garantir mais agilidade, eficiência e segurança na entrega dos seus produtos.',
};

const qualityLevels = [
    {
        icon: <Gem className="h-10 w-10 text-amber-500" />,
        title: "Qualidade Ultra",
        subtitle: "A perfeição em cada detalhe.",
        features: ["Materiais premium", "Acabamento impecável", "Fidelidade máxima", "Para os mais exigentes"],
    },
    {
        icon: <Diamond className="h-10 w-10 text-purple-500" />,
        title: "Qualidade Elite",
        subtitle: "Nossa categoria mais alta.",
        features: ["Acabamento superior", "Materiais de alto padrão", "Visual extremamente fiel", "Ideal para quem busca o melhor"],
    },
    {
        icon: <Star className="h-10 w-10 text-blue-500" />,
        title: "Qualidade Select",
        subtitle: "Equilíbrio perfeito.",
        features: ["Excelente acabamento", "Ótima durabilidade", "Visual muito próximo"],
    },
    {
        icon: <CheckCircle className="h-10 w-10 text-green-500" />,
        title: "Qualidade Essential",
        subtitle: "Praticidade para o dia a dia.",
        features: ["Boa qualidade e conforto", "Design funcional", "Ótimo custo-benefício"],
    }
];

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
                
                <section>
                    <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold">
                        <MapPin className="h-7 w-7 text-primary" />
                        Área de Cobertura e Custos
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                           Atualmente, oferecemos <strong>entregas locais em Ipatinga, Minas Gerais</strong>, e também realizamos <strong>envios para todo o Brasil</strong> através de transportadoras parceiras.
                        </p>
                        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                             <p className="font-semibold">
                                Atenção: A cobrança de frete pode ser implementada ou alterada a qualquer momento, sem aviso prévio. Os custos de envio, quando aplicáveis, serão sempre exibidos de forma clara durante o processo de checkout, antes da finalização da sua compra.
                            </p>
                        </div>
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
                     <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {qualityLevels.map((level) => (
                            <Card key={level.title} className="flex flex-col text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                                <CardHeader className="items-center">
                                    {level.icon}
                                    <CardTitle className="mt-4 text-xl">{level.title}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{level.subtitle}</p>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        {level.features.map((feature) => (
                                            <li key={feature} className="flex items-start justify-center text-center">
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
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

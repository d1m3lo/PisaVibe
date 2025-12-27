
import { FileText, User, ShoppingCart, Shield, Info, Mail } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Termos de Uso - PISA VIBE',
    description: 'Leia os termos e condições de uso do site da PISA VIBE.',
};

export default function TermsOfUsePage() {
    return (
        <div className="container mx-auto max-w-4xl px-4 py-12">
            <header className="mb-10 text-center">
                <FileText className="mx-auto h-12 w-12 text-primary" />
                <h1 className="mt-4 font-headline text-4xl font-bold">Termos de Uso</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Ao utilizar nosso site, você concorda com os seguintes termos e condições.
                </p>
                 <p className="text-sm text-muted-foreground mt-2">Última atualização: 24 de julho de 2024</p>
            </header>

            <main className="space-y-10">
                <section>
                    <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold">
                        <Info className="h-7 w-7 text-primary" />
                        1. Aceitação dos Termos
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                           Bem-vindo à PISA VIBE! Ao acessar e usar nosso site (pisavibe.com), você expressa sua concordância e aceitação total destes Termos de Uso e da nossa <a href="/politica-de-privacidade" className="font-semibold text-primary hover:underline">Política de Privacidade</a>. Se você não concordar com qualquer parte destes termos, por favor, não utilize nossos serviços.
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold">
                        <User className="h-7 w-7 text-primary" />
                        2. Uso do Site e Conta de Usuário
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                            Para realizar compras, você poderá criar uma conta de usuário. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrerem em sua conta. Você concorda em nos notificar imediatamente sobre qualquer uso não autorizado de sua conta.
                        </p>
                        <p>
                            Você concorda em não usar o site para fins ilegais ou não autorizados e em cumprir todas as leis aplicáveis.
                        </p>
                    </div>
                </section>
                
                 <section>
                    <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold">
                        <ShoppingCart className="h-7 w-7 text-primary" />
                       3. Produtos, Preços e Pagamentos
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                           Buscamos exibir as informações dos produtos da forma mais precisa possível, incluindo cores e descrições. No entanto, não garantimos que as cores vistas no seu monitor reflitam com exatidão as cores reais do produto.
                        </p>
                        <p>
                            Os preços estão sujeitos a alterações sem aviso prévio. Nos reservamos o direito de recusar ou cancelar pedidos caso haja suspeita de fraude ou se um produto for listado com preço incorreto.
                        </p>
                    </div>
                </section>
                
                 <section>
                    <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold">
                        <Shield className="h-7 w-7 text-primary" />
                        4. Propriedade Intelectual
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                       <p>
                           Todo o conteúdo presente neste site, incluindo textos, gráficos, logos, ícones, imagens e software, é propriedade da PISA VIBE ou de seus fornecedores de conteúdo e é protegido pelas leis de direitos autorais. A compilação de todo o conteúdo deste site é propriedade exclusiva da PISA VIBE.
                       </p>
                    </div>
                </section>

                 <section>
                    <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold">
                        <Info className="h-7 w-7 text-primary" />
                        5. Limitação de Responsabilidade
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                       <p>
                           A PISA VIBE não se responsabiliza por quaisquer danos diretos, indiretos, incidentais ou consequentes que resultem do uso ou da incapacidade de usar nosso site ou serviços.
                       </p>
                    </div>
                </section>

                <section className="border-t pt-8">
                     <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold">
                       <Mail className="h-7 w-7 text-primary" />
                       6. Contato e Dúvidas
                    </h2>
                    <p className="text-muted-foreground">
                      Se tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco através do e-mail:
                    </p>
                    <p className="mt-4 font-semibold">
                         <a href="mailto:suporte@pisavibe.com" className="hover:underline">suporte@pisavibe.com</a>
                    </p>
                </section>
            </main>
        </div>
    );
}


import { Shield, Database, Users, Cookie, Mail, Lock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Política de Privacidade - PISA VIBE',
    description: 'Entenda como a PISA VIBE coleta, usa e protege seus dados pessoais.',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="container mx-auto max-w-4xl px-4 py-12">
            <header className="mb-10 text-center">
                <Shield className="mx-auto h-12 w-12 text-primary" />
                <h1 className="mt-4 font-headline text-4xl font-bold">Política de Privacidade</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Sua privacidade é importante para nós. Esta política explica como coletamos, usamos e protegemos suas informações.
                </p>
                 <p className="text-sm text-muted-foreground mt-2">Última atualização: 24 de julho de 2024</p>
            </header>

            <main className="space-y-10">
                <section>
                    <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold">
                        <Database className="h-7 w-7 text-primary" />
                        Quais dados coletamos?
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                           Coletamos informações que você nos fornece diretamente ao criar uma conta, fazer um pedido ou entrar em contato conosco. Isso inclui:
                        </p>
                        <ul className="list-inside list-disc space-y-2 pl-4">
                            <li><strong>Informações de Identificação:</strong> Nome, e-mail, telefone, endereço.</li>
                            <li><strong>Informações do Pedido:</strong> Produtos comprados, histórico de compras.</li>
                            <li><strong>Informações de Pagamento:</strong> Processadas por nossos parceiros de pagamento seguros (não armazenamos dados do seu cartão).</li>
                             <li><strong>Comunicações:</strong> Registros de suas interações com nosso suporte.</li>
                        </ul>
                         <p>
                           Também coletamos dados automaticamente quando você navega em nosso site, como endereço IP, tipo de navegador e páginas visitadas, através de cookies e tecnologias similares.
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold">
                        <Users className="h-7 w-7 text-primary" />
                        Como usamos seus dados?
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                        <p>Utilizamos suas informações para:</p>
                         <ul className="list-inside list-disc space-y-2 pl-4">
                            <li>Processar e entregar seus pedidos.</li>
                            <li>Melhorar sua experiência em nosso site, personalizando conteúdo e ofertas.</li>
                            <li>Comunicar novidades, promoções e informações sobre seu pedido.</li>
                            <li>Prestar suporte ao cliente e resolver problemas.</li>
                            <li>Garantir a segurança da nossa plataforma e prevenir fraudes.</li>
                        </ul>
                    </div>
                </section>
                
                 <section>
                    <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold">
                        <Lock className="h-7 w-7 text-primary" />
                       Com quem compartilhamos seus dados?
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                           Não vendemos suas informações pessoais. Podemos compartilhar seus dados com parceiros essenciais para nossa operação, como:
                        </p>
                         <ul className="list-inside list-disc space-y-2 pl-4">
                            <li><strong>Empresas de Logística:</strong> Para a entrega dos seus produtos.</li>
                            <li><strong>Plataformas de Pagamento:</strong> Para processar sua compra de forma segura.</li>
                            <li><strong>Ferramentas de Marketing:</strong> Para enviar e-mails e personalizar anúncios, sempre com a opção de você se descadastrar.</li>
                        </ul>
                        <p>
                            Exigimos que todos os nossos parceiros sigam padrões de segurança e privacidade compatíveis com a legislação.
                        </p>
                    </div>
                </section>
                
                 <section>
                    <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold">
                        <Cookie className="h-7 w-7 text-primary" />
                        Cookies e Tecnologias Semelhantes
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                       <p>
                           Usamos cookies para reconhecer seu navegador ou dispositivo, aprender mais sobre seus interesses e fornecer recursos e serviços essenciais. Você pode gerenciar os cookies nas configurações do seu navegador.
                       </p>
                    </div>
                </section>

                <section className="border-t pt-8">
                     <h2 className="mb-4 flex items-center gap-3 font-headline text-2xl font-bold">
                       <Mail className="h-7 w-7 text-primary" />
                       Seus Direitos e Contato
                    </h2>
                    <p className="text-muted-foreground">
                      Você tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento. Se tiver alguma dúvida sobre nossa política de privacidade ou quiser exercer seus direitos, entre em contato conosco pelo e-mail:
                    </p>
                    <p className="mt-4 font-semibold">
                         <a href="mailto:suportepisavibe@gmail.com" className="hover:underline">suportepisavibe@gmail.com</a>
                    </p>
                </section>
            </main>
        </div>
    );
}

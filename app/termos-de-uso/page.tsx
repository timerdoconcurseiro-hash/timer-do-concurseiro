import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermosUsoPage() {
  return (
    <div className="min-h-screen bg-[#090C15] text-slate-200 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <h1 className="text-3xl font-bold text-white">Termos de Uso</h1>
        <div className="prose prose-invert max-w-none text-slate-400 space-y-4">
          
          <h3 className="text-white font-semibold text-lg mt-6">1. Aceitação dos Termos</h3>
          <p>Ao acessar e utilizar o site Timer do Concurseiro, você concorda em cumprir estes termos de serviço, bem como todas as leis e regulamentos aplicáveis. Se você não concordar com algum desses termos, está proibido de usar ou acessar este serviço.</p>

          <h3 className="text-white font-semibold text-lg mt-6">2. Uso da Ferramenta e Planos</h3>
          <p>O Timer do Concurseiro é disponibilizado na modalidade gratuita (com recursos básicos) e na modalidade Premium (paga, com recursos avançados de Inteligência Artificial e sincronização). Nossa ferramenta tem o objetivo exclusivo de auxiliar no controle e organização do tempo de estudos.</p>

          <h3 className="text-white font-semibold text-lg mt-6">3. Isenção de Responsabilidade (Resultados)</h3>
          <p>Não garantimos resultados em provas, nomeações, aprovações ou desempenho acadêmico. A disciplina, o uso da ferramenta e o planejamento do estudo são de responsabilidade inteiramente do usuário.</p>

          <h3 className="text-white font-semibold text-lg mt-6">4. Armazenamento de Dados</h3>
          <p>Para usuários do plano gratuito (não logados), os dados são salvos apenas localmente no navegador. Não nos responsabilizamos pela perda do seu histórico de tempo caso você limpe o cache do seu dispositivo ou troque de aparelho. A sincronização e proteção contra perdas está disponível apenas para usuários com conta ativa (Premium).</p>

          <h3 className="text-white font-semibold text-lg mt-6">5. Reembolso e Garantia</h3>
          <p>Oferecemos uma Garantia Incondicional de 7 dias para as compras de planos Premium. Caso o usuário não esteja satisfeito com a ferramenta, poderá solicitar o reembolso integral enviando um e-mail para o suporte dentro do prazo de 7 dias após a compra.</p>

          <h3 className="text-white font-semibold text-lg mt-6">6. Modificações</h3>
          <p>O Timer do Concurseiro pode revisar e alterar estes termos de serviço a qualquer momento, sem aviso prévio. Ao continuar usando o site após tais alterações, você concorda em ficar vinculado à versão atual desses termos de serviço.</p>

          <h3 className="text-white font-semibold text-lg mt-6">7. Planos, Assinaturas e Acesso Vitalício</h3>
          <p>
            Os planos de assinatura (Mensal e Anual) são renovados automaticamente de acordo com seu ciclo de faturamento. O cancelamento interrompe cobranças futuras, mas não reembolsa valores de meses já iniciados (exceto no prazo da garantia de 7 dias).
            <br/><br/>
            O termo <strong>"Acesso Vitalício" (Lifetime)</strong> refere-se ao tempo de vida útil do produto. Isso garante ao comprador acesso contínuo à plataforma sem novas mensalidades enquanto o software "Timer do Concurseiro" estiver ativo, mantido e sendo comercializado pela empresa. A empresa reserva-se o direito de descontinuar ou alterar drasticamente o serviço, seus servidores e suas integrações com Inteligências Artificiais de terceiros a qualquer momento no futuro em caso de inviabilidade comercial ou mudança de modelo de negócios, não constituindo obrigação de prestação de serviços ad aeternum (pela eternidade) ao usuário.
          </p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#090C15] text-slate-200 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <h1 className="text-3xl font-bold text-white">Política de Privacidade</h1>
        <div className="prose prose-invert max-w-none text-slate-400 space-y-4">
          <p>A sua privacidade é importante para nós. É política do Timer do Concurseiro respeitar a sua privacidade e estar em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) em relação a qualquer informação sua que possamos coletar no site.</p>

          <h3 className="text-white font-semibold text-lg mt-6">1. Coleta e Tratamento de Dados</h3>
          <p>Para fornecer a melhor experiência, o Timer do Concurseiro oferece funcionalidades locais e em nuvem:</p>
          <ul className="list-disc pl-5">
            <li><strong>Usuários não cadastrados:</strong> O aplicativo funciona de forma anônima e os dados de tempo de estudo ficam armazenados exclusivamente no seu próprio dispositivo (cache/localStorage). Não coletamos seus dados pessoais.</li>
            <li><strong>Usuários cadastrados (Contas/Premium):</strong> Ao fazer login via Google OAuth, coletamos seu endereço de e-mail e nome público estritamente para a criação da sua conta e sincronização dos seus históricos de estudo em nosso banco de dados seguro na nuvem (Supabase).</li>
          </ul>

          <h3 className="text-white font-semibold text-lg mt-6">2. Pagamentos e Assinaturas</h3>
          <p>Os pagamentos são processados por uma plataforma parceira e totalmente segura (Asaas). O Timer do Concurseiro não armazena e não tem acesso aos dados sensíveis do seu cartão de crédito.</p>

          <h3 className="text-white font-semibold text-lg mt-6">3. Uso de Cookies e Analytics</h3>
          <p>Utilizamos cookies e o Google Analytics para entender de forma anônima como nossos visitantes usam o site. Isso inclui informações como páginas visitadas, tempo de permanência e dispositivo utilizado, nos ajudando a melhorar a ferramenta constantemente.</p>

          <h3 className="text-white font-semibold text-lg mt-6">4. Seus Direitos (LGPD)</h3>
          <p>Em conformidade com a LGPD, você tem o direito a qualquer momento de solicitar: o acesso aos seus dados, a correção de dados incompletos ou a exclusão total da sua conta e do seu histórico de estudos do nosso banco de dados.</p>

          <h3 className="text-white font-semibold text-lg mt-6">5. Contato</h3>
          <p>Se você tiver alguma dúvida sobre o tratamento dos seus dados ou quiser exercer seus direitos da LGPD, entre em contato através do e-mail oficial: <strong>timerdoconcurseiro@gmail.com</strong>.</p>

          <p className="mt-8 text-sm text-slate-500">Esta política é efetiva a partir de Setembro de 2026.</p>
        </div>
      </div>
    </div>
  );
}

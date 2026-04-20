export type Difficulty = "facil" | "medio" | "dificil";
export type Category =
  | "planejamento"
  | "lideranca"
  | "recursos-humanos"
  | "qualidade"
  | "etica"
  | "financeiro";

export interface Choice {
  id: string;
  text: string;
  isCorrect: boolean;
  points: number;
  feedback: string;
  reference: string;
}

export interface Case {
  id: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  scenario: string;
  context: string;
  question: string;
  choices: Choice[];
  learningObjective: string;
  keywords: string[];
}

export const CATEGORIES: Record<Category, { label: string; icon: string; color: string }> = {
  planejamento: { label: "Planejamento", icon: "📋", color: "bg-blue-500" },
  lideranca: { label: "Liderança", icon: "🌟", color: "bg-purple-500" },
  "recursos-humanos": { label: "Recursos Humanos", icon: "👥", color: "bg-green-500" },
  qualidade: { label: "Qualidade", icon: "✅", color: "bg-yellow-500" },
  etica: { label: "Ética", icon: "⚖️", color: "bg-red-500" },
  financeiro: { label: "Financeiro", icon: "💰", color: "bg-orange-500" },
};

export const CASES: Case[] = [
  {
    id: "case-001",
    title: "A Escala Problemática",
    category: "recursos-humanos",
    difficulty: "facil",
    scenario:
      "Você é a enfermeira gestora de uma Unidade de Internação Clínica com 30 leitos. Na segunda-feira pela manhã, você recebe a informação de que dois técnicos de enfermagem ligaram comunicando atestado médico. A escala do dia já estava apertada, e agora a situação fica crítica.",
    context:
      "A unidade opera com 6 técnicos por turno (manhã). Hoje só restam 4. O índice de ocupação é de 93%. Há dois pacientes em isolamento de contato. A supervisora de enfermagem está em reunião administrativa até ao meio-dia.",
    question:
      "Qual é a sua primeira e mais prioritária ação como enfermeira gestora nesta situação?",
    choices: [
      {
        id: "a",
        text: "Acionar imediatamente o banco de dados de profissionais disponíveis para horas extras e contatar os funcionários de folga que podem ser chamados, comunicando a supervisão sobre a situação.",
        isCorrect: true,
        points: 100,
        feedback:
          "Excelente decisão! A gestão de pessoal em situações de déficit requer ação imediata e comunicação ascendente. Garantir a segurança do paciente enquanto aciona mecanismos institucionais é a conduta correta conforme os princípios de dimensionamento de pessoal de Kurcgant.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 7 — Dimensionamento de pessoal de enfermagem.",
      },
      {
        id: "b",
        text: "Redistribuir as tarefas entre os 4 técnicos presentes e esperar até o meio-dia para falar com a supervisora.",
        isCorrect: false,
        points: 30,
        feedback:
          "Redistribuir tarefas é necessário, mas aguardar para comunicar à supervisão é um erro de gestão. A comunicação hierárquica deve ser imediata. Sobrecarregar a equipe existente sem buscar reforço também aumenta o risco de erros assistenciais.",
        reference:
          "Marquis, B. L.; Huston, C. J. (2015). Administração e liderança em enfermagem, cap. 18 — Gestão de pessoal e escalonamento.",
      },
      {
        id: "c",
        text: "Assumir pessoalmente a assistência direta aos pacientes mais críticos para garantir a segurança.",
        isCorrect: false,
        points: 20,
        feedback:
          "Embora demonstre comprometimento, a enfermeira gestora que abandona a função gerencial para assumir atividades assistenciais compromete a supervisão do conjunto da equipe. A gestão da crise é mais relevante do que a assistência direta neste momento.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 4 — Funções do enfermeiro gestor.",
      },
      {
        id: "d",
        text: "Registrar o ocorrido em livro de ocorrências e aguardar orientação superior antes de tomar qualquer decisão.",
        isCorrect: false,
        points: 0,
        feedback:
          "Registrar é importante, mas aguardar passivamente orientação superior sem tomar nenhuma medida é omissão gerencial. O gestor tem autonomia e responsabilidade para resolver situações emergenciais de dimensionamento.",
        reference:
          "Marquis, B. L.; Huston, C. J. (2015). Administração e liderança em enfermagem, cap. 6 — Tomada de decisão e resolução de problemas.",
      },
    ],
    learningObjective:
      "Aplicar princípios de dimensionamento de pessoal e gestão de crises em situações de déficit de equipe.",
    keywords: ["dimensionamento", "escala", "recursos humanos", "gestão de crise"],
  },
  {
    id: "case-002",
    title: "O Conflito na Equipe",
    category: "lideranca",
    difficulty: "medio",
    scenario:
      "Duas enfermeiras da sua equipe estão em conflito aberto há três semanas. A situação começou por uma discordância sobre a condução de um protocolo e evoluiu para desentendimentos pessoais. O clima na unidade piorou visivelmente: reuniões de passagem de plantão ficaram tensas, e outros membros da equipe começaram a tomar partido.",
    context:
      "Ambas as profissionais têm bom desempenho técnico individualmente. O conflito está afetando a comunicação e, consequentemente, a continuidade do cuidado. Uma delas já procurou você informalmente para reclamar da outra.",
    question:
      "Como você deve conduzir a gestão desse conflito interpessoal?",
    choices: [
      {
        id: "a",
        text: "Realizar uma reunião individual com cada uma separadamente para ouvir as perspectivas, em seguida promover uma reunião conjunta mediada por você, com foco na resolução e no impacto assistencial.",
        isCorrect: true,
        points: 100,
        feedback:
          "Correto! A gestão de conflitos eficaz requer escuta ativa, imparcialidade e mediação estruturada. Ouvir individualmente antes da reunião conjunta evita escalada e permite que o gestor compreenda ambas as perspectivas. O foco deve sempre ser o impacto no serviço.",
        reference:
          "Marquis, B. L.; Huston, C. J. (2015). Administração e liderança em enfermagem, cap. 22 — Gestão de conflitos.",
      },
      {
        id: "b",
        text: "Convocar as duas juntas imediatamente e exigir que resolvam o conflito entre si, deixando claro que o comportamento não será tolerado.",
        isCorrect: false,
        points: 15,
        feedback:
          "Convocar ambas sem preparação prévia pode acirrar o conflito. O gestor que apenas impõe autoridade sem mediar ativamente tende a suprimir o conflito temporariamente, mas não o resolve. A abordagem coercitiva é inadequada para conflitos de relacionamento.",
        reference:
          "Marquis, B. L.; Huston, C. J. (2015). Administração e liderança em enfermagem, cap. 22 — Estilos de resolução de conflitos.",
      },
      {
        id: "c",
        text: "Solicitar à supervisão que transfira uma das enfermeiras para outra unidade para resolver o problema.",
        isCorrect: false,
        points: 5,
        feedback:
          "Transferir profissionais como solução de conflito é uma estratégia de fuga que não resolve o problema de fundo e ainda prejudica a estabilidade da equipe. Além disso, como gestora de primeiro nível, você tem a responsabilidade e os recursos para mediar o conflito.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 9 — Liderança e gestão de pessoas.",
      },
      {
        id: "d",
        text: "Ignorar o conflito por ora, esperando que se resolva naturalmente, já que ambas têm bom desempenho técnico.",
        isCorrect: false,
        points: 0,
        feedback:
          "Conflitos ignorados raramente se resolvem sozinhos — tendem a se agravar e contaminar o ambiente de trabalho. O bom desempenho técnico individual não neutraliza os danos do conflito interpessoal à equipe e à qualidade do cuidado.",
        reference:
          "Marquis, B. L.; Huston, C. J. (2015). Administração e liderança em enfermagem, cap. 22 — Conflito como fenômeno organizacional.",
      },
    ],
    learningObjective:
      "Identificar e aplicar estratégias de gestão de conflitos interpessoais no contexto da liderança em enfermagem.",
    keywords: ["conflito", "mediação", "liderança", "clima organizacional"],
  },
  {
    id: "case-003",
    title: "A Meta de Qualidade",
    category: "qualidade",
    difficulty: "medio",
    scenario:
      "O indicador de taxa de infecção de corrente sanguínea associada a cateter venoso central (ICSACVC) da sua UTI apresentou um aumento de 2,1 para 4,8 por 1000 cateter-dia nos últimos dois meses. A direção de enfermagem solicita um plano de ação.",
    context:
      "A UTI tem 10 leitos. A equipe realiza inserção de CVC com frequência. Nas últimas semanas houve rotatividade de profissionais e dois plantões com equipe reduzida. O protocolo de inserção e manutenção existe, mas você percebe que a adesão não é monitorada sistematicamente.",
    question:
      "Qual deve ser o ponto de partida do seu plano de ação para reduzir a taxa de ICSACVC?",
    choices: [
      {
        id: "a",
        text: "Realizar uma auditoria de processo para identificar falhas de adesão ao protocolo, analisar os casos de infecção por meio de busca ativa nos prontuários e envolver a equipe na análise das causas.",
        isCorrect: true,
        points: 100,
        feedback:
          "Excelente! A melhoria de qualidade requer diagnóstico situacional preciso antes de qualquer intervenção. A análise de causa-raiz com envolvimento da equipe é fundamental. Sem saber onde o processo está falhando, qualquer intervenção pode ser equivocada.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 11 — Gestão da qualidade nos serviços de enfermagem.",
      },
      {
        id: "b",
        text: "Implementar imediatamente um treinamento obrigatório sobre inserção de CVC para toda a equipe.",
        isCorrect: false,
        points: 40,
        feedback:
          "O treinamento pode ser necessário, mas não deve ser o ponto de partida sem diagnóstico. Se a falha não está na técnica de inserção, mas na manutenção do cateter ou no processo de higienização das mãos, o treinamento de inserção terá pouco impacto.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 11 — Ciclo PDCA na enfermagem.",
      },
      {
        id: "c",
        text: "Propor à direção a aquisição de novos cateteres com tecnologia anti-infecção como medida prioritária.",
        isCorrect: false,
        points: 10,
        feedback:
          "Tecnologias podem contribuir para a redução de infecções, mas não devem ser a medida inicial sem diagnóstico de processo. Além disso, essa decisão geralmente depende de aprovação orçamentária e não resolve problemas de adesão a protocolos.",
        reference:
          "Marquis, B. L.; Huston, C. J. (2015). Administração e liderança em enfermagem, cap. 25 — Controle da qualidade.",
      },
      {
        id: "d",
        text: "Notificar imediatamente os casos à CCIH e aguardar o relatório de investigação para então planejar as ações.",
        isCorrect: false,
        points: 20,
        feedback:
          "Notificar a CCIH é obrigatório e importante, mas esperar passivamente o relatório sem iniciar sua própria análise de processo é uma postura inadequada para a gestora da unidade. As ações de melhoria da gestão e da vigilância epidemiológica devem ocorrer simultaneamente.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 11 — Indicadores de qualidade em enfermagem.",
      },
    ],
    learningObjective:
      "Aplicar o ciclo de melhoria da qualidade (PDCA) na análise e intervenção em indicadores assistenciais.",
    keywords: ["qualidade", "ICSACVC", "indicadores", "protocolo", "análise de processo"],
  },
  {
    id: "case-004",
    title: "A Denúncia Anônima",
    category: "etica",
    difficulty: "dificil",
    scenario:
      "Você recebe uma denúncia anônima via caixa de sugestões relatando que um técnico de enfermagem do noturno estaria dormindo durante o plantão com frequência e que os pacientes ficavam sem assistência nos momentos críticos. O técnico em questão trabalha na unidade há 12 anos, é querido pelos colegas e nunca teve registro de ocorrência.",
    context:
      "Você não tem provas concretas, apenas a denúncia. Não é possível rastrear o denunciante. O técnico mora longe e tem dois empregos. A situação, se confirmada, representa grave risco assistencial.",
    question:
      "Como você deve proceder diante dessa denúncia anônima?",
    choices: [
      {
        id: "a",
        text: "Iniciar uma supervisão discreta do plantão noturno por algumas noites, documentar observações, e só então — com evidências — conduzir uma conversa reservada com o profissional, garantindo o contraditório.",
        isCorrect: true,
        points: 100,
        feedback:
          "Correto! A gestora deve agir diante de riscos assistenciais, mas com responsabilidade ética e legal. Investigar com base em evidências antes de agir protege o profissional de acusações infundadas e sustenta qualquer medida administrativa posterior. O princípio do contraditório é fundamental.",
        reference:
          "Marquis, B. L.; Huston, C. J. (2015). Administração e liderança em enfermagem, cap. 23 — Gestão disciplinar e ética.",
      },
      {
        id: "b",
        text: "Convocar o técnico imediatamente, confrontar com a denúncia anônima e exigir explicações.",
        isCorrect: false,
        points: 20,
        feedback:
          "Confrontar com base em denúncia anônima sem investigação prévia é injusto eticamente e arriscado juridicamente. Pode gerar processo por assédio moral e ainda prejudicar o clima organizacional sem resolver o problema real.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 12 — Ética na gestão de pessoas.",
      },
      {
        id: "c",
        text: "Ignorar a denúncia por não ter provas e por se tratar de um funcionário com histórico limpo.",
        isCorrect: false,
        points: 0,
        feedback:
          "Ignorar uma denúncia de risco assistencial é omissão gerencial grave. O histórico limpo não invalida a necessidade de investigação. Se a situação for real e algo acontecer com um paciente, a gestora que ignorou a denúncia pode ser responsabilizada.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 12 — Responsabilidade do gestor de enfermagem.",
      },
      {
        id: "d",
        text: "Encaminhar imediatamente a denúncia ao RH e ao COREN para apuração formal.",
        isCorrect: false,
        points: 30,
        feedback:
          "Encaminhar ao COREN sem investigação prévia e sem evidências pode ser prematuro e injusto. A gestora tem a responsabilidade de realizar primeiro sua própria apuração no âmbito institucional antes de escalar para órgãos externos.",
        reference:
          "Marquis, B. L.; Huston, C. J. (2015). Administração e liderança em enfermagem, cap. 23 — Processo disciplinar e papéis do gestor.",
      },
    ],
    learningObjective:
      "Aplicar princípios éticos e legais na condução de situações disciplinares e denúncias no ambiente de trabalho.",
    keywords: ["ética", "disciplina", "denúncia", "investigação", "contraditório"],
  },
  {
    id: "case-005",
    title: "O Orçamento em Xeque",
    category: "financeiro",
    difficulty: "dificil",
    scenario:
      "Ao analisar o relatório mensal, você percebe que a sua unidade ultrapassou em 28% o orçamento previsto para materiais e insumos. O período ainda não acabou. A diretora financeira solicita uma reunião urgente e quer saber o que aconteceu e quais medidas serão tomadas.",
    context:
      "Nos últimos dois meses houve aumento do índice de ocupação (de 78% para 96%) e dois surtos de infecção que demandaram uso intensivo de EPI e materiais de isolamento. Parte dos insumos extras foi solicitada por médicos sem controle formal da enfermagem.",
    question:
      "Como você apresenta a situação e que medidas propõe à diretoria financeira?",
    choices: [
      {
        id: "a",
        text: "Apresentar análise contextualizada dos dados (aumento de ocupação + surtos), separar os gastos justificados dos que precisam de revisão, e propor medidas de controle como padronização de solicitações e monitoramento diário de consumo.",
        isCorrect: true,
        points: 100,
        feedback:
          "Excelente! O gestor deve ser capaz de justificar variações orçamentárias com dados concretos e propor soluções estruturadas. A análise de causa + plano de ação demonstra maturidade gerencial e protege a unidade de cortes desnecessários.",
        reference:
          "Marquis, B. L.; Huston, C. J. (2015). Administração e liderança em enfermagem, cap. 14 — Gestão financeira em enfermagem.",
      },
      {
        id: "b",
        text: "Responsabilizar os médicos pelo consumo não controlado de materiais e pedir que a diretoria intervenha junto ao corpo clínico.",
        isCorrect: false,
        points: 15,
        feedback:
          "Transferir a responsabilidade sem uma análise própria é uma postura defensiva que não resolve o problema. A gestora de enfermagem tem corresponsabilidade sobre o controle de insumos de sua unidade, independentemente de quem solicitou.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 6 — Gestão de recursos materiais.",
      },
      {
        id: "c",
        text: "Propor corte imediato de 30% no consumo de materiais para compensar o excesso, sem análise detalhada.",
        isCorrect: false,
        points: 5,
        feedback:
          "Cortes lineares sem análise podem comprometer a segurança assistencial. Reduzir materiais de forma indiscriminada em uma unidade com alta ocupação pode gerar riscos sérios aos pacientes e é eticamente inaceitável.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 6 — Custo-benefício na gestão de insumos.",
      },
      {
        id: "d",
        text: "Admitir o erro sem apresentar dados contextualizados e comprometer-se a resolver sem um plano estruturado.",
        isCorrect: false,
        points: 10,
        feedback:
          "Assumir responsabilidade é positivo, mas sem análise de dados e sem plano de ação estruturado, o gestor não demonstra competência gerencial. A diretoria precisará de informações concretas para tomar decisões.",
        reference:
          "Marquis, B. L.; Huston, C. J. (2015). Administração e liderança em enfermagem, cap. 14 — Responsabilidade financeira do gestor.",
      },
    ],
    learningObjective:
      "Desenvolver habilidade de gestão financeira e apresentação de resultados em contextos de variação orçamentária.",
    keywords: ["orçamento", "financeiro", "controle de custos", "gestão de insumos"],
  },
  {
    id: "case-006",
    title: "A Nova Protocolo",
    category: "planejamento",
    difficulty: "facil",
    scenario:
      "A direção de enfermagem determinou a implantação de um novo protocolo de prevenção de quedas em toda a instituição. Você recebeu o protocolo na quinta-feira e deve implementá-lo na sua unidade a partir da segunda-feira seguinte.",
    context:
      "Sua equipe é composta por 18 técnicos de enfermagem e 4 enfermeiras. O protocolo envolve nova metodologia de avaliação de risco (Escala de Morse), aplicação de sinalizadores no leito e orientação ao paciente e família. Parte da equipe já conhece a Escala de Morse por uso informal.",
    question:
      "Qual é a melhor estratégia para implementar o novo protocolo até segunda-feira?",
    choices: [
      {
        id: "a",
        text: "Realizar capacitação rápida por turnos ainda na sexta e no sábado, designar uma enfermeira referência para cada turno, criar material de consulta rápida e monitorar a adesão na primeira semana.",
        isCorrect: true,
        points: 100,
        feedback:
          "Excelente planejamento! A implementação eficaz de protocolos requer capacitação, designação de responsáveis e monitoramento. Aproveitar o final de semana para treinar minimiza a interrupção do fluxo de trabalho na segunda-feira.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 8 — Planejamento em enfermagem e implantação de protocolos.",
      },
      {
        id: "b",
        text: "Enviar o protocolo por e-mail para toda a equipe e solicitar que leiam até segunda-feira.",
        isCorrect: false,
        points: 10,
        feedback:
          "Enviar o protocolo sem capacitação não garante compreensão ou adesão. Protocolos distribuídos apenas por e-mail têm baixa implementação efetiva. O gestor tem responsabilidade de assegurar que a equipe compreenda e aplique corretamente.",
        reference:
          "Marquis, B. L.; Huston, C. J. (2015). Administração e liderança em enfermagem, cap. 8 — Educação continuada e treinamento.",
      },
      {
        id: "c",
        text: "Solicitar à direção mais tempo para uma implementação gradual ao longo de um mês.",
        isCorrect: false,
        points: 20,
        feedback:
          "Negociar prazos realistas é uma competência gerencial legítima, mas neste caso o prazo já está definido. É possível implementar em curto prazo com boa organização. Recusar um prazo definido sem justificativa técnica sólida pode ser mal interpretado.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 8 — Gestão de mudanças em serviços de saúde.",
      },
      {
        id: "d",
        text: "Implementar apenas com as enfermeiras na segunda-feira e treinar os técnicos nas semanas seguintes.",
        isCorrect: false,
        points: 30,
        feedback:
          "Implementar parcialmente pode criar inconsistências no cuidado. Se apenas as enfermeiras aplicam o protocolo, a avaliação de risco e os sinalizadores não serão feitos de forma sistemática. Os técnicos são parte fundamental da execução do protocolo.",
        reference:
          "Marquis, B. L.; Huston, C. J. (2015). Administração e liderança em enfermagem, cap. 10 — Delegação e supervisão.",
      },
    ],
    learningObjective:
      "Planejar e executar a implementação de novos protocolos assistenciais com eficiência gerencial.",
    keywords: ["planejamento", "protocolo", "implementação", "capacitação", "prevenção de quedas"],
  },
  {
    id: "case-007",
    title: "A Avaliação de Desempenho Difícil",
    category: "recursos-humanos",
    difficulty: "medio",
    scenario:
      "É época de avaliação de desempenho anual. Uma das suas enfermeiras — tecnicamente competente e dedicada — tem um ponto fraco significativo: dificuldade de comunicação com a equipe técnica e com os pacientes, gerando reclamações recorrentes. Ela, por sua vez, acredita que está indo muito bem e não percebe o problema.",
    context:
      "Você tem registros de três queixas formais de pacientes e dois feedbacks negativos de colegas nos últimos seis meses. A profissional nunca recebeu feedback formal sobre isso anteriormente.",
    question:
      "Como você conduz a avaliação de desempenho desta profissional?",
    choices: [
      {
        id: "a",
        text: "Usar os dados documentados para fundamentar o feedback, apresentar os registros de queixas com exemplos concretos, reconhecer os pontos fortes, e construir junto com ela um plano de desenvolvimento com metas e prazo.",
        isCorrect: true,
        points: 100,
        feedback:
          "Perfeito! O feedback eficaz é específico, baseado em evidências e orientado ao desenvolvimento. O plano construído em conjunto aumenta o engajamento da profissional com a mudança. Reconhecer os pontos fortes antes de abordar as dificuldades é estratégico.",
        reference:
          "Marquis, B. L.; Huston, C. J. (2015). Administração e liderança em enfermagem, cap. 20 — Avaliação de desempenho.",
      },
      {
        id: "b",
        text: "Dar uma avaliação positiva para não desmotivar a profissional, e abordar o problema informalmente depois.",
        isCorrect: false,
        points: 0,
        feedback:
          "Dar avaliação positiva quando há problema identificado é desonesto e prejudica o desenvolvimento da profissional e a qualidade do serviço. Adiar o feedback não resolve o problema — apenas o perpetua.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 9 — Avaliação de desempenho na enfermagem.",
      },
      {
        id: "c",
        text: "Apresentar a avaliação negativa de forma direta e contundente para que ela entenda a gravidade da situação.",
        isCorrect: false,
        points: 20,
        feedback:
          "A abordagem direta e contundente sem empatia e sem reconhecimento dos pontos fortes tende a gerar defensividade e resistência à mudança. O feedback deve ser honesto, mas conduzido de forma construtiva e baseada em dados.",
        reference:
          "Marquis, B. L.; Huston, C. J. (2015). Administração e liderança em enfermagem, cap. 20 — Técnicas de feedback eficaz.",
      },
      {
        id: "d",
        text: "Adiar a avaliação e primeiro encaminhá-la para uma capacitação de comunicação antes de avaliá-la.",
        isCorrect: false,
        points: 30,
        feedback:
          "Encaminhar para capacitação antes da avaliação formal pode parecer uma boa intenção, mas pula o processo de feedback — que é a base para qualquer desenvolvimento. Além disso, a profissional não sabe por que está sendo encaminhada, o que gera confusão.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 9 — Gestão do desenvolvimento de pessoas.",
      },
    ],
    learningObjective:
      "Conduzir processos de avaliação de desempenho com base em evidências e orientação ao desenvolvimento profissional.",
    keywords: ["avaliação de desempenho", "feedback", "desenvolvimento", "comunicação"],
  },
  {
    id: "case-008",
    title: "A Sobrecarga do Plantão",
    category: "lideranca",
    difficulty: "dificil",
    scenario:
      "Em uma reunião de equipe, vários técnicos de enfermagem relatam sentir-se sobrecarregados e esgotados. Um deles afirma que as condições de trabalho estão causando sofrimento e que há colegas pensando em pedir demissão. A fala é carregada de emoção. Outros concordam em silêncio.",
    context:
      "A unidade passou por uma reestruturação há 4 meses que reduziu o quadro em 2 profissionais sem reposição. Você sabe que o quadro está abaixo do recomendado, mas a direção alega contenção de custos. Você tem poucos recursos formais disponíveis.",
    question:
      "Como você reage e o que faz após essa reunião?",
    choices: [
      {
        id: "a",
        text: "Reconhecer publicamente o sofrimento da equipe, validar as queixas, apresentar os dados de carga de trabalho à diretoria com embasamento técnico e negociar soluções possíveis — mesmo que parciais — enquanto busca apoio institucional.",
        isCorrect: true,
        points: 100,
        feedback:
          "Excelente! Líderes eficazes reconhecem o sofrimento da equipe e agem como defensores (advocates) dos profissionais diante da instituição. Apresentar dados objetivos à diretoria é mais eficaz do que queixas subjetivas. Mesmo sem poder total, o gestor pode negociar melhorias parciais.",
        reference:
          "Marquis, B. L.; Huston, C. J. (2015). Administração e liderança em enfermagem, cap. 3 — Liderança transformacional; cap. 13 — Retenção de pessoal.",
      },
      {
        id: "b",
        text: "Pedir que a equipe mantenha o profissionalismo e tenha paciência, pois a situação é temporária.",
        isCorrect: false,
        points: 10,
        feedback:
          "Minimizar o sofrimento da equipe pedindo paciência sem ação concreta é uma resposta que deteriora ainda mais a relação de confiança. O líder que não age como defensor da equipe perde credibilidade e aumenta o risco de evasão de profissionais.",
        reference:
          "Marquis, B. L.; Huston, C. J. (2015). Administração e liderança em enfermagem, cap. 13 — Satisfação e retenção no trabalho.",
      },
      {
        id: "c",
        text: "Entrar em conflito aberto com a diretoria em nome da equipe, ameaçando expor a situação publicamente.",
        isCorrect: false,
        points: 5,
        feedback:
          "O confronto aberto e a ameaça pública são estratégias que raramente funcionam e podem resultar em retaliação institucional ou comprometimento da credibilidade da gestora. A defesa da equipe deve ser feita por canais formais e com argumentação técnica.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 9 — Gestão de conflito e negociação.",
      },
      {
        id: "d",
        text: "Elaborar uma escala mais rígida para compensar a falta de pessoal e evitar que a situação piore assistencialmente.",
        isCorrect: false,
        points: 20,
        feedback:
          "Ajustes de escala podem ser necessários a curto prazo, mas não abordam a causa raiz — o subdimensionamento. Uma escala mais rígida sem resolver o problema de pessoal pode aumentar ainda mais o esgotamento e a insatisfação.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 7 — Dimensionamento e condições de trabalho.",
      },
    ],
    learningObjective:
      "Exercer liderança transformacional em contextos de sofrimento organizacional e limitação de recursos.",
    keywords: ["liderança", "esgotamento", "advocacy", "condições de trabalho", "negociação"],
  },
  {
    id: "case-009",
    title: "O Erro de Medicação",
    category: "qualidade",
    difficulty: "medio",
    scenario:
      "Durante o seu turno, um técnico de enfermagem informa que administrou 10mg de morfina IV em um paciente idoso, mas a prescrição era de 2mg. O paciente está sonolento mas responsivo. O erro foi percebido logo após a administração.",
    context:
      "O técnico está visivelmente abalado e com medo das consequências. O paciente está monitorado. Você já acionou a equipe médica que está a caminho. O familiar do paciente está no corredor.",
    question:
      "Após garantir a segurança imediata do paciente e acionar a equipe médica, qual é a sua próxima prioridade gerencial?",
    choices: [
      {
        id: "a",
        text: "Garantir que o evento seja notificado no sistema de notificação de incidentes, apoiar o técnico emocionalmente sem isentar a responsabilidade, e conduzir uma análise do processo para identificar fatores contribuintes.",
        isCorrect: true,
        points: 100,
        feedback:
          "Correto! A cultura de segurança pós-evento inclui notificação, apoio ao profissional envolvido (segunda vítima) e análise de processo. Punição imediata sem análise de causa-raiz não previne novos erros. O sistema de notificação alimenta melhorias institucionais.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 11 — Segurança do paciente e gestão de incidentes.",
      },
      {
        id: "b",
        text: "Registrar o ocorrido e encaminhar imediatamente o técnico ao setor de RH para processo disciplinar.",
        isCorrect: false,
        points: 10,
        feedback:
          "Processo disciplinar imediato sem análise de processo é uma resposta punitiva que pode inibir futuras notificações — prejudicando a cultura de segurança. Além disso, erros geralmente têm fatores sistêmicos contribuintes que precisam ser investigados.",
        reference:
          "Marquis, B. L.; Huston, C. J. (2015). Administração e liderança em enfermagem, cap. 25 — Cultura de segurança e gerenciamento de riscos.",
      },
      {
        id: "c",
        text: "Comunicar o familiar imediatamente sobre o erro antes de estabilizar o paciente clinicamente.",
        isCorrect: false,
        points: 15,
        feedback:
          "A comunicação com o familiar é um direito e deve acontecer, mas não antes de garantir a estabilização do paciente. A prioridade imediata é assistencial. A comunicação ao familiar deve ser feita com a equipe médica, de forma transparente e empática.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 12 — Ética e comunicação de erros.",
      },
      {
        id: "d",
        text: "Assumir pessoalmente que o erro foi seu para proteger o técnico de consequências.",
        isCorrect: false,
        points: 0,
        feedback:
          "Assumir falsamente a responsabilidade por um erro é eticamente inaceitável e juridicamente problemático. Proteger o profissional de forma saudável é apoiá-lo emocionalmente e conduzir uma análise justa — não falsificar informações.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 12 — Responsabilidade ética e legal na gestão.",
      },
    ],
    learningObjective:
      "Gerenciar eventos adversos com base em princípios de cultura de segurança e análise sistêmica de incidentes.",
    keywords: ["erro de medicação", "segurança do paciente", "notificação", "cultura de segurança"],
  },
  {
    id: "case-010",
    title: "O Planejamento da Educação Continuada",
    category: "planejamento",
    difficulty: "facil",
    scenario:
      "Você tem R$ 5.000 disponíveis no orçamento para educação continuada do próximo semestre. Ao mesmo tempo, identificou três necessidades na equipe: atualização em cuidados paliativos (solicitada por 70% da equipe), treinamento em ventilação mecânica (necessidade técnica urgente identificada em auditoria) e participação em um congresso de enfermagem (solicitada por 2 enfermeiras).",
    context:
      "O setor tem leitos de pacientes oncológicos e em cuidados paliativos. Nos últimos meses, houve dois alarmes de ventilação mal configurados. O congresso custaria R$ 2.800 por participante.",
    question:
      "Como você prioriza e aloca o orçamento de educação continuada?",
    choices: [
      {
        id: "a",
        text: "Priorizar o treinamento em ventilação mecânica (necessidade técnica urgente de segurança) e cuidados paliativos (necessidade da equipe e do perfil de pacientes), deixando o congresso para o próximo orçamento.",
        isCorrect: true,
        points: 100,
        feedback:
          "Decisão acertada! A priorização em educação continuada deve considerar: segurança do paciente (ventilação), perfil assistencial da unidade (paliativos) e demanda da equipe. Congressos têm valor, mas o custo por participante aqui inviabilizaria as outras demandas mais críticas.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 10 — Educação continuada em enfermagem.",
      },
      {
        id: "b",
        text: "Investir tudo no congresso para as duas enfermeiras, já que é um evento de renome e vai trazer atualização para a equipe.",
        isCorrect: false,
        points: 5,
        feedback:
          "Investir todo o orçamento em uma ação que beneficia apenas 2 de ~22 profissionais, ignorando necessidades urgentes de segurança, é uma decisão de má gestão de recursos educacionais. O impacto coletivo deve ser priorizado.",
        reference:
          "Marquis, B. L.; Huston, C. J. (2015). Administração e liderança em enfermagem, cap. 8 — Educação em serviço e desenvolvimento profissional.",
      },
      {
        id: "c",
        text: "Dividir igualmente o orçamento entre as três necessidades.",
        isCorrect: false,
        points: 30,
        feedback:
          "A divisão igualitária parece justa mas ignora a hierarquia de prioridades. Se necessidades urgentes de segurança recebem o mesmo peso que demandas menos críticas, o resultado pode ser inadequado para todas.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 10 — Planejamento da educação continuada.",
      },
      {
        id: "d",
        text: "Consultar a equipe por votação e implementar a ação mais votada.",
        isCorrect: false,
        points: 20,
        feedback:
          "A participação da equipe é valiosa, mas a decisão de priorização orçamentária em educação é do gestor, que deve considerar segurança, perfil assistencial e impacto coletivo — não apenas a preferência da maioria. Cuidados paliativos pode vencer, mas ventilação pode ser ignorada por ser menos popular.",
        reference:
          "Kurcgant, P. (2016). Gerenciamento em enfermagem, cap. 10 — Tomada de decisão em educação continuada.",
      },
    ],
    learningObjective:
      "Planejar e priorizar ações de educação continuada com base em critérios técnicos, de segurança e de impacto coletivo.",
    keywords: ["educação continuada", "planejamento", "orçamento", "priorização"],
  },
];

export const FAQ = [
  {
    id: "faq-001",
    question: "Qual é a diferença entre liderança e gerência em enfermagem?",
    answer:
      "Gerência refere-se às funções formais de planejamento, organização, direção e controle de recursos. Liderança é a capacidade de influenciar pessoas em direção a metas, podendo ocorrer sem autoridade formal. O enfermeiro gestor ideal exerce ambas: gerencia processos e lidera pessoas.",
    reference: "Marquis & Huston (2015), cap. 1; Kurcgant (2016), cap. 9.",
  },
  {
    id: "faq-002",
    question: "Como calcular o dimensionamento de pessoal de enfermagem?",
    answer:
      "O dimensionamento considera: carga horária de trabalho, horas de assistência por paciente/dia (definidas pela Resolução COFEN), índice de segurança técnica (IST) para cobrir ausências, e o perfil de complexidade dos pacientes. A fórmula básica é: quadro de pessoal = (horas de assistência × leitos × dias / horas de jornada) × (1 + IST).",
    reference: "Kurcgant (2016), cap. 7; Resolução COFEN nº 543/2017.",
  },
  {
    id: "faq-003",
    question: "O que é cultura de segurança do paciente?",
    answer:
      "É um conjunto de valores, atitudes, competências e comportamentos que determinam o comprometimento com a gestão de saúde e segurança. Em uma cultura de segurança forte, erros são comunicados sem medo punitivo, analisados sistemicamente e usados para melhorar processos.",
    reference: "OMS (2009); Kurcgant (2016), cap. 11.",
  },
  {
    id: "faq-004",
    question: "Quais são os estilos de liderança mais estudados em enfermagem?",
    answer:
      "Os principais são: autocrático (centrado no líder), democrático (participativo), laissez-faire (liberal), situacional (adapta-se ao contexto) e transformacional (inspira e motiva). A liderança transformacional é atualmente a mais associada a resultados positivos em equipes de saúde.",
    reference: "Marquis & Huston (2015), cap. 3.",
  },
  {
    id: "faq-005",
    question: "O que é o PDCA e como aplicar em enfermagem?",
    answer:
      "PDCA (Plan-Do-Check-Act) é um ciclo de melhoria contínua. Em enfermagem: Plan = identificar o problema e planejar a intervenção; Do = implementar a mudança; Check = monitorar com indicadores; Act = padronizar se funcionou ou replanejar. É amplamente usado em gestão de qualidade assistencial.",
    reference: "Kurcgant (2016), cap. 11.",
  },
  {
    id: "faq-006",
    question: "Como conduzir uma avaliação de desempenho construtiva?",
    answer:
      "A avaliação eficaz deve ser: baseada em fatos e dados documentados, frequente (não apenas anual), bidirecional (com espaço para a autoavaliação), focada em comportamentos observáveis, orientada ao desenvolvimento (não apenas à punição) e conclusa com um plano de ação acordado com o profissional.",
    reference: "Marquis & Huston (2015), cap. 20.",
  },
];

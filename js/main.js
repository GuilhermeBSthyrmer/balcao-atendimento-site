/* Balcão — página do bot de atendimento
 * Simulação roteirizada da conversa, recado preenchido à mão,
 * abas de marcas do modelo e botão de copiar.
 * Nada aqui chama API: é uma demonstração que roda no navegador.
 */
(() => {
  'use strict';

  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const espera = (ms) => new Promise((ok) => setTimeout(ok, reduz ? Math.min(ms, 120) : ms));
  const agora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  /* ---------------- recado: escrever à mão ---------------- */
  function escrever(recado, campo, texto, atraso = 0) {
    const el = $(`[data-f="${campo}"]`, recado);
    if (!el) return;
    el.textContent = texto;
    const n = Math.max(6, texto.length);
    el.style.setProperty('--passos', String(Math.min(n, 60)));
    el.style.setProperty('--dur', `${Math.min(1.8, Math.max(.45, n * .045))}s`);
    el.style.animationDelay = `${atraso}ms`;
    el.classList.remove('escrevendo');
    void el.offsetWidth; // reinicia a animação
    if (!reduz) el.classList.add('escrevendo');
  }
  const marcar = (recado, chave, sim = true) => $(`[data-m="${chave}"]`, recado)?.classList.toggle('marcado', sim);

  /* ---------------- recado do hero: preenche sozinho ---------------- */
  const heroRec = $('[data-recado="hero"]');
  if (heroRec) {
    const marcas = $$('.recado__marcas li', heroRec);
    const marcados = marcas.filter((li) => li.classList.contains('marcado'));
    if (!reduz) {
      marcados.forEach((li) => li.classList.remove('marcado'));
      const campos = ['hora', 'para', 'de', 'assunto', 'horario', 'obs'];
      let t = 500;
      campos.forEach((c) => {
        const el = $(`[data-f="${c}"]`, heroRec);
        escrever(heroRec, c, el.textContent, t);
        t += Math.min(1800, Math.max(450, el.textContent.length * 45)) + 120;
      });
      marcados.forEach((li, i) => setTimeout(() => li.classList.add('marcado'), 1800 + i * 500));
      setTimeout(() => heroRec.classList.add('is-entregue'), t + 200);
    } else {
      heroRec.classList.add('is-entregue');
    }
  }

  /* ---------------- conversa simulada ---------------- */
  const UNIDADES = {
    Centro: { n: 1, end: 'Av. Afonso Pena, no Centro' },
    Savassi: { n: 2, end: 'Rua Pernambuco, na Savassi' },
    Pampulha: { n: 3, end: 'Av. Otacílio Negrão de Lima, na Pampulha' },
  };
  const SERVICOS = [
    { nome: 'Avaliação', chaves: ['avalia', 'consulta', 'marcar', 'agendar', 'primeira'] },
    { nome: 'Limpeza', chaves: ['limpeza', 'profilaxia', 'tártaro', 'tartaro'] },
    { nome: 'Clareamento', chaves: ['clarea', 'branque', 'dente branco'] },
    { nome: 'Aparelho', chaves: ['aparelho', 'ortodon', 'alinhador', 'invisível', 'invisivel'] },
    { nome: 'Dor de dente', chaves: ['dor', 'doendo', 'quebrou', 'quebrado', 'urgên', 'urgen', 'inchad', 'sangr'], urgente: true },
  ];
  const BAIRROS = { savassi: 'Savassi', funcion: 'Savassi', lourdes: 'Savassi', serra: 'Savassi', 'santo agostinho': 'Savassi', pampulha: 'Pampulha', 'ouro preto': 'Pampulha', jaragu: 'Pampulha', castelo: 'Pampulha', 'são luiz': 'Pampulha', 'sao luiz': 'Pampulha', centro: 'Centro', barro: 'Centro', floresta: 'Centro', 'santa efig': 'Centro' };
  const HORARIOS = [
    { nome: 'De manhã', chaves: ['manh', 'cedo'] },
    { nome: 'À tarde', chaves: ['tarde', 'almoço', 'almoco'] },
    { nome: 'Sábado de manhã', chaves: ['sábado', 'sabado', 'fim de semana'] },
  ];
  const sem = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const achar = (lista, texto) => lista.find((i) => i.chaves.some((k) => sem(texto).includes(sem(k))));

  const msgs = $('[data-msgs]');
  const rapidas = $('[data-rapidas]');
  const form = $('[data-form]');
  const input = $('#chat-texto');
  const recado = $('[data-recado="demo"]');
  const status = $('[data-status]');
  const chkFechado = $('[data-fechado]');
  let est;
  let geracao = 0; // invalida respostas pendentes ao recomeçar

  function novoEstado() {
    return { etapa: 'inicio', nome: '', servico: '', urgente: false, unidade: '', horario: '', humano: false, fim: false };
  }

  function rolar() { msgs.scrollTop = msgs.scrollHeight; }

  function balao(tipo, texto, tag) {
    const li = document.createElement('li');
    li.className = `balao balao--${tipo}`;
    li.textContent = texto;
    if (tag) {
      const s = document.createElement('span');
      s.className = 'balao__tag';
      s.textContent = tag;
      li.append(document.createElement('br'), s);
    }
    msgs.append(li);
    rolar();
    return li;
  }

  function opcoes(lista) {
    rapidas.replaceChildren(...lista.map((txt) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rapida';
      b.textContent = txt;
      b.addEventListener('click', () => enviar(txt));
      return b;
    }));
  }

  async function bot(texto, tag) {
    const g = geracao;
    const dig = document.createElement('li');
    dig.className = 'balao balao--bot digitando';
    dig.setAttribute('aria-label', 'digitando');
    dig.innerHTML = '<i></i><i></i><i></i>';
    msgs.append(dig);
    status.textContent = 'digitando…';
    rolar();
    await espera(Math.min(1500, 550 + texto.length * 11));
    dig.remove();
    if (g !== geracao) return false;
    status.textContent = 'online';
    balao('bot', texto, tag);
    return true;
  }

  function primeiroNome() { return est.nome.split(' ')[0]; }

  async function perguntarServico() {
    est.etapa = 'servico';
    if (!(await bot(`Prazer, ${primeiroNome()}! Em que posso te ajudar?`, `[NOME:${primeiroNome()}] removida antes de enviar`))) return;
    opcoes(SERVICOS.map((s) => (s.urgente ? 'Estou com dor' : s.nome)));
  }

  async function perguntarUnidade(prefixo) {
    est.etapa = 'unidade';
    const txt = `${prefixo ? prefixo + ' ' : ''}Qual unidade fica melhor pra você: Centro, Savassi ou Pampulha?`;
    if (!(await bot(txt))) return;
    opcoes(['Centro', 'Savassi', 'Pampulha', 'Tanto faz']);
  }

  async function perguntarHorario() {
    est.etapa = 'horario';
    const u = UNIDADES[est.unidade];
    if (!(await bot(`A unidade ${est.unidade} fica na ${u.end}. Qual o melhor horário pra equipe de lá te chamar?`, `[FILIAL:${u.n}] removida antes de enviar`))) return;
    opcoes(HORARIOS.map((h) => h.nome));
  }

  async function concluir() {
    est.etapa = 'fim';
    est.fim = true;
    opcoes([]);
    const hora = agora();
    escrever(recado, 'hora', hora);
    const partes = [`${est.servico}.`];
    if (est.urgente) partes.push('Está com dor, pediu prioridade.');
    if (est.humano) partes.push('Pediu para falar com uma pessoa.');
    partes.push(`Chamou pelo WhatsApp às ${hora}.`);
    escrever(recado, 'obs', partes.join(' '), 250);
    const ok = await bot(`Pronto, ${primeiroNome()}! Passei seu pedido para a unidade ${est.unidade}. A equipe de lá te chama por aqui ${est.horario === 'Sábado de manhã' ? 'até sábado' : 'ainda hoje'}. Se quiser falar direto com eles, mando o contato da unidade.`, '[LEAD_PRONTO] removida antes de enviar');
    if (!ok) return;
    setTimeout(() => recado.classList.add('is-entregue'), reduz ? 0 : 900);
    await espera(900);
    balao('sistema', `Recado entregue à unidade ${est.unidade}, com o resumo e um botão para assumir a conversa.`);
  }

  async function responder(texto) {
    // Pedido de atendente vale em qualquer etapa.
    if (/(pessoa|atendente|humano|algu[eé]m de verdade)/i.test(texto)) {
      est.humano = true;
      marcar(recado, 'humano');
      const quem = est.unidade ? `a equipe da unidade ${est.unidade}` : 'a equipe da clínica';
      if (!(await bot(`Claro! Já avisei ${quem} e alguém vai assumir por aqui. Enquanto isso, sigo te ajudando.`, '[HUMANO] removida antes de enviar'))) return;
      return reperguntar();
    }

    switch (est.etapa) {
      case 'inicio': {
        marcar(recado, 'msg');
        const s = achar(SERVICOS, texto);
        if (s) {
          est.servico = s.nome; est.urgente = !!s.urgente;
          escrever(recado, 'assunto', s.nome);
          if (s.urgente) marcar(recado, 'urgente');
        }
        est.etapa = 'nome';
        const abertura = s?.urgente
          ? 'Oi! Sinto muito pela dor, vou te ajudar a ser atendido rápido. Qual é o seu nome?'
          : 'Oi! Aqui é o atendimento da Clínica Sorriso Aberto. Pra eu te ajudar, qual é o seu nome?';
        if (!(await bot(abertura))) return;
        opcoes(['Ana Souza']);
        input.placeholder = 'Escreva seu nome';
        return;
      }
      case 'nome': {
        const nome = texto.replace(/^(meu nome [eé]|me chamo|eu sou|sou)\s+((o|a)\s+)?/i, '').replace(/[^\p{L}\s'-]/gu, '').trim();
        if (nome.length < 2) {
          if (await bot('Não peguei seu nome. Pode escrever de novo?')) opcoes(['Ana Souza']);
          return;
        }
        est.nome = nome.split(/\s+/).slice(0, 3).map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase()).join(' ');
        escrever(recado, 'de', est.nome);
        input.placeholder = 'Escreva uma mensagem';
        if (!est.servico) return perguntarServico();
        return perguntarUnidade(`Prazer, ${primeiroNome()}! ${est.urgente ? 'Vou marcar como urgente.' : `Anotei: ${est.servico.toLowerCase()}.`}`);
      }
      case 'servico': {
        const s = achar(SERVICOS, texto) || SERVICOS.find((x) => sem(x.nome) === sem(texto));
        if (!s) {
          if (await bot('Não entendi bem. Pode escolher uma das opções?')) opcoes(SERVICOS.map((x) => (x.urgente ? 'Estou com dor' : x.nome)));
          return;
        }
        est.servico = s.nome; est.urgente = !!s.urgente;
        escrever(recado, 'assunto', s.nome);
        if (s.urgente) marcar(recado, 'urgente');
        return perguntarUnidade(s.urgente ? 'Sinto muito! Vou marcar como urgente.' : 'Ótimo.');
      }
      case 'unidade':
      case 'bairro': {
        let u = Object.keys(UNIDADES).find((k) => sem(texto).includes(sem(k)));
        if (!u && est.etapa === 'bairro') u = Object.entries(BAIRROS).find(([k]) => sem(texto).includes(sem(k)))?.[1] || 'Centro';
        if (!u && /tanto faz|qualquer|n[aã]o sei|perto/i.test(texto)) {
          est.etapa = 'bairro';
          if (await bot('Me diz o bairro onde você está que eu indico a mais perto.')) opcoes(['Funcionários', 'Ouro Preto', 'Floresta']);
          return;
        }
        if (!u) {
          if (await bot('Temos unidades no Centro, na Savassi e na Pampulha. Qual prefere?')) opcoes(['Centro', 'Savassi', 'Pampulha', 'Tanto faz']);
          return;
        }
        est.unidade = u;
        escrever(recado, 'para', `Unidade ${u}`);
        return perguntarHorario();
      }
      case 'horario': {
        const h = achar(HORARIOS, texto) || HORARIOS.find((x) => sem(x.nome) === sem(texto));
        if (!h) {
          if (await bot('Pode escolher um horário? A unidade abre de segunda a sexta, das 8h às 19h, e sábado das 8h às 12h.')) opcoes(HORARIOS.map((x) => x.nome));
          return;
        }
        est.horario = h.nome;
        escrever(recado, 'horario', h.nome);
        return concluir();
      }
      default:
        await bot(`Já avisei a unidade ${est.unidade}, ${primeiroNome()}. Se precisar de mais alguma coisa, é só falar por aqui.`);
    }
  }

  async function reperguntar() {
    if (est.etapa === 'inicio' || est.etapa === 'nome') {
      if (est.etapa === 'nome') { opcoes(['Ana Souza']); }
      return;
    }
    if (est.etapa === 'servico') return opcoes(SERVICOS.map((x) => (x.urgente ? 'Estou com dor' : x.nome)));
    if (est.etapa === 'unidade') return opcoes(['Centro', 'Savassi', 'Pampulha', 'Tanto faz']);
    if (est.etapa === 'bairro') return opcoes(['Funcionários', 'Ouro Preto', 'Floresta']);
    if (est.etapa === 'horario') return opcoes(HORARIOS.map((x) => x.nome));
  }

  // Mensagens mandadas enquanto o bot ainda responde entram numa fila, em ordem,
  // como no bot de verdade. Antes elas eram descartadas sem aviso.
  let fila = Promise.resolve();
  function enviar(texto) {
    texto = texto.trim();
    if (!texto) return;
    opcoes([]);
    balao('eu', texto);
    input.value = '';
    const g = geracao;
    fila = fila.then(async () => {
      if (g !== geracao) return;
      if (chkFechado.checked && !est.fim) {
        marcar(recado, 'msg');
        await bot('Olá! A Clínica Sorriso Aberto está fechada agora. Atendemos de segunda a sexta, das 8h às 19h, e sábado das 8h às 12h. Deixe sua mensagem que a equipe responde assim que abrir.', 'resposta fixa, sem chamar o modelo');
        if (g === geracao) balao('sistema', 'Desligue “fora do horário” para continuar a conversa.');
      } else {
        await responder(texto);
      }
    }).catch(() => {});
  }

  function recomecar() {
    geracao++;
    fila = Promise.resolve();
    est = novoEstado();
    msgs.replaceChildren();
    recado.classList.remove('is-entregue');
    $$('[data-f]', recado).forEach((el) => { el.textContent = ''; el.classList.remove('escrevendo'); });
    $$('[data-m]', recado).forEach((el) => el.classList.remove('marcado'));
    input.placeholder = 'Escreva uma mensagem';
    status.textContent = 'online';
    balao('sistema', 'Hoje');
    opcoes(['Oi, queria marcar uma avaliação', 'Quanto custa clareamento?', 'Estou com dor de dente']);
  }

  if (msgs) {
    form.addEventListener('submit', (e) => { e.preventDefault(); enviar(input.value); });
    $('[data-recomecar]').addEventListener('click', recomecar);
    $('[data-humano]').addEventListener('click', () => enviar('Quero falar com uma pessoa'));
    recomecar();
  }

  /* ---------------- abas: modelo x cliente ---------------- */
  const blocoMarcas = $('[data-marcas]');
  if (blocoMarcas) {
    const abas = $$('[role="tab"]', blocoMarcas);
    const painel = $('#painel-marcas');
    const ativar = (aba) => {
      abas.forEach((a) => {
        const sel = a === aba;
        a.setAttribute('aria-selected', String(sel));
        a.tabIndex = sel ? 0 : -1;
      });
      painel.setAttribute('aria-labelledby', aba.id);
      blocoMarcas.classList.toggle('is-cliente', aba.dataset.aba === 'cliente');
    };
    abas.forEach((a) => a.addEventListener('click', () => ativar(a)));
    blocoMarcas.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const i = abas.indexOf(document.activeElement);
      const prox = abas[(i + (e.key === 'ArrowRight' ? 1 : -1) + abas.length) % abas.length];
      prox.focus();
      ativar(prox);
    });
  }

  /* ---------------- copiar comandos ---------------- */
  const btnCopiar = $('[data-copiar]');
  if (btnCopiar) {
    btnCopiar.addEventListener('click', async () => {
      const texto = $('.terminal code').textContent.split('\n').filter((l) => l && !l.startsWith('#')).join('\n');
      try {
        await navigator.clipboard.writeText(texto);
        btnCopiar.textContent = 'Copiado';
      } catch {
        btnCopiar.textContent = 'Não deu para copiar';
      }
      setTimeout(() => { btnCopiar.textContent = 'Copiar'; }, 1800);
    });
  }
})();

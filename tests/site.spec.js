import { test, expect } from '@playwright/test';

// Com movimento reduzido o bot responde quase na hora, o que deixa os testes rápidos.
test.use({ reducedMotion: 'reduce' });

function vigiarErros(page) {
  const erros = [];
  page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', (e) => erros.push(e.message));
  return erros;
}

const recado = (page) => page.locator('[data-recado="demo"]');
const campo = (page, nome) => recado(page).locator(`[data-f="${nome}"]`);
const ultimaDoBot = (page) => page.locator('.balao--bot:not(.digitando)').last();

test.describe('Balcão', () => {
  test('abre sem erros e sem rolagem lateral', async ({ page }) => {
    const erros = vigiarErros(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Recepcionista no WhatsApp');
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(sobra).toBeLessThanOrEqual(0);
    expect(erros).toEqual([]);
  });

  test('o recado do topo termina com o texto inteiro à mostra', async ({ page }) => {
    // Este teste roda com animação: o defeito só aparece quando a escrita à mão anima.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const horario = page.locator('[data-recado="hero"] [data-f="horario"]');
    await expect(page.locator('[data-recado="hero"]')).toHaveClass(/is-entregue/, { timeout: 15000 });
    await expect(horario).toHaveText('De manhã');
    await expect(horario).not.toHaveClass(/escrevendo/);
    expect(await horario.evaluate((e) => getComputedStyle(e).clipPath)).toBe('none');
  });

  test('conversa completa preenche e entrega o recado', async ({ page }) => {
    await page.goto('/#conversa');
    await page.getByRole('button', { name: 'Oi, queria marcar uma avaliação' }).click();
    await expect(ultimaDoBot(page)).toContainText('qual é o seu nome');

    await page.locator('#chat-texto').fill('meu nome é ana souza');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(ultimaDoBot(page)).toContainText('Qual unidade');

    await page.getByRole('button', { name: 'Savassi', exact: true }).click();
    await expect(ultimaDoBot(page)).toContainText('melhor horário');
    await expect(ultimaDoBot(page)).toContainText('[FILIAL:2] removida antes de enviar');

    await page.getByRole('button', { name: 'De manhã', exact: true }).click();
    await expect(recado(page)).toHaveClass(/is-entregue/);
    await expect(campo(page, 'para')).toHaveText('Unidade Savassi');
    await expect(campo(page, 'de')).toHaveText('Ana Souza');
    await expect(campo(page, 'assunto')).toHaveText('Avaliação');
    await expect(campo(page, 'horario')).toHaveText('De manhã');
    await expect(page.locator('.balao--sistema').last()).toContainText('Recado entregue à unidade Savassi');
  });

  test('bairro leva à unidade mais perto e pedido de atendente é marcado', async ({ page }) => {
    await page.goto('/#conversa');
    await page.getByRole('button', { name: 'Estou com dor de dente' }).click();
    await expect(recado(page).locator('[data-m="urgente"]')).toHaveClass(/marcado/);
    await page.locator('#chat-texto').fill('Bruno');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await page.getByRole('button', { name: 'Tanto faz', exact: true }).click();
    await expect(ultimaDoBot(page)).toContainText('bairro');

    await page.getByRole('button', { name: 'Pedir para falar com uma pessoa' }).click();
    await expect(recado(page).locator('[data-m="humano"]')).toHaveClass(/marcado/);

    await page.locator('#chat-texto').fill('moro no Ouro Preto');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(campo(page, 'para')).toHaveText('Unidade Pampulha');
  });

  test('fora do horário responde com texto fixo, sem modelo', async ({ page }) => {
    await page.goto('/#conversa');
    await page.getByText('Simular mensagem fora do horário').click();
    await page.getByRole('button', { name: 'Quanto custa clareamento?' }).click();
    await expect(ultimaDoBot(page)).toContainText('está fechada agora');
    await expect(ultimaDoBot(page)).toContainText('resposta fixa, sem chamar o modelo');
  });

  test('abas mostram o que o modelo respondeu e o que o cliente vê', async ({ page }) => {
    await page.goto('/#por-baixo');
    const cliente = page.getByRole('tab', { name: 'O que o cliente vê' });
    await cliente.click();
    await expect(cliente).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-marcas]')).toHaveClass(/is-cliente/);
    await cliente.press('ArrowLeft');
    await expect(page.getByRole('tab', { name: 'O que o modelo respondeu' })).toHaveAttribute('aria-selected', 'true');
  });
});

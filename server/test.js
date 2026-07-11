// Quick integration test script
const http = require('http');

async function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost', port: 3001, path, method,
      headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
    };
    const r = http.request(options, res => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(chunks) }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function authReq(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost', port: 3001, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const r = http.request(options, res => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(chunks) }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function main() {
  let passed = 0, failed = 0;

  function check(label, cond, detail) {
    if (cond) { console.log(`  ✅ ${label}`); passed++; }
    else { console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`); failed++; }
  }

  console.log('\n🧪 Trilhas Inova 3 — Testes de Integração\n');

  // 1. Health check
  console.log('1. Health check');
  const h = await req('GET', '/api/health');
  check('API respondendo', h.status === 200);

  // 2. Cadastro Conta A
  console.log('\n2. Cadastro de conta');
  const email = `test_${Date.now()}@trilhas.com`;
  const regA = await req('POST', '/api/auth/cadastro', { email, senha: 'senha12345' });
  check('Cadastro bem-sucedido', regA.status === 201, JSON.stringify(regA.body));
  const tokenA = regA.body.accessToken;

  // 3. Login
  console.log('\n3. Login');
  const logA = await req('POST', '/api/auth/login', { email, senha: 'senha12345' });
  check('Login bem-sucedido', logA.status === 200);
  check('Retorna accessToken', !!logA.body.accessToken);

  // 4. Login inválido
  const logInv = await req('POST', '/api/auth/login', { email, senha: 'errada' });
  check('Rejeita senha inválida (401)', logInv.status === 401);

  // 5. Criar Perfil 1 (titular)
  console.log('\n4. Perfis');
  const p1 = await authReq('POST', '/api/perfis', {
    nome: 'Maria Silva', cpf: '12345678901', data_nascimento: '2000-01-01',
  }, tokenA);
  check('Cria perfil titular', p1.status === 201, JSON.stringify(p1.body?.error));
  const perfilId = p1.body.perfil?.id;
  check('Perfil com papel titular', p1.body.perfil?.papel === 'titular');

  // 6. Listar perfis
  const lista = await authReq('GET', '/api/perfis', null, tokenA);
  check('Lista perfis da conta', lista.status === 200 && lista.body.perfis?.length === 1);

  // 7. Criar conta B e tentar acessar perfil de A → deve dar 403
  console.log('\n5. Isolamento de dados (segurança crítica)');
  const emailB = `testb_${Date.now()}@trilhas.com`;
  const regB = await req('POST', '/api/auth/cadastro', { email: emailB, senha: 'senha12345' });
  const tokenB = regB.body.accessToken;
  const isolTest = await authReq('GET', `/api/perfis/${perfilId}`, null, tokenB);
  check('403 ao acessar perfil de outra conta', isolTest.status === 403, `Status: ${isolTest.status}`);
  check('Código correto FORBIDDEN', isolTest.body?.error?.code === 'FORBIDDEN');

  // 8. Trilhas
  console.log('\n6. Trilhas');
  const trl = await authReq('GET', '/api/trilhas', null, tokenA);
  check('Lista trilhas', trl.status === 200);
  check('9 trilhas seedadas', trl.body.trilhas?.length === 9, `Got: ${trl.body.trilhas?.length}`);

  // 9. Escolher trilha
  const selTrilha = await authReq('PATCH', `/api/perfis/${perfilId}/trilha`, { trilha_slug: 'frontend' }, tokenA);
  check('Escolhe trilha frontend', selTrilha.status === 200, JSON.stringify(selTrilha.body?.error));

  // 10. Módulos da trilha
  const mods = await authReq('GET', `/api/perfis/${perfilId}/modulos`, null, tokenA);
  check('Lista módulos da trilha', mods.status === 200);
  check('Frontend tem 9 módulos', mods.body.modulos?.length === 9, `Got: ${mods.body.modulos?.length}`);

  // 11. Marcar módulo concluído
  const mod1 = mods.body.modulos?.[0];
  if (mod1) {
    const upMod = await authReq('PATCH', `/api/perfis/${perfilId}/modulos/${mod1.id}`, { status: 'concluido' }, tokenA);
    check('Atualiza módulo como concluído', upMod.status === 200);

    // Tentar atualizar módulo do perfil errado
    const isoMod = await authReq('PATCH', `/api/perfis/${perfilId}/modulos/${mod1.id}`, { status: 'concluido' }, tokenB);
    check('403 ao atualizar módulo de outro perfil', isoMod.status === 403);
  }

  // 12. Frequência
  console.log('\n7. Frequência');
  const freq = await authReq('GET', `/api/perfis/${perfilId}/frequencia`, null, tokenA);
  check('Lista frequência', freq.status === 200);
  check('Grade com 12 semanas', freq.body.semanas?.length === 12, `Got: ${freq.body.semanas?.length}`);

  const regFreq = await authReq('PUT', `/api/perfis/${perfilId}/frequencia/1`, { presente: true, horas_dedicadas: 10 }, tokenA);
  check('Registra semana de frequência', regFreq.status === 200);

  // 13. Limite de 15 perfis
  console.log('\n8. Limite de perfis');
  // Criar mais 14 perfis para atingir o limite
  for (let i = 2; i <= 15; i++) {
    await authReq('POST', '/api/perfis', { nome: `Perfil ${i}`, cpf: `0000000000${i < 10 ? '0'+i : i}`.slice(-11), data_nascimento: '2000-01-01' }, tokenA);
  }
  const p16 = await authReq('POST', '/api/perfis', { nome: 'Perfil 16', cpf: '99999999999', data_nascimento: '2000-01-01' }, tokenA);
  check('Rejeita criação do 16º perfil', p16.status === 400);
  check('Mensagem de erro correta', p16.body?.error?.message?.includes('15'), p16.body?.error?.message);

  // 14. Dashboard
  console.log('\n9. Dashboard');
  const dash = await authReq('GET', `/api/perfis/${perfilId}/dashboard`, null, tokenA);
  check('Dashboard retorna dados', dash.status === 200);
  check('Documentes progress retorna', !!dash.body.documentos);

  // Resultado
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Resultado: ${passed} passou, ${failed} falhou`);
  if (failed === 0) console.log('🎉 Todos os testes passaram!\n');
  else console.log('❌ Há falhas para investigar.\n');
}

main().catch(console.error);

# 🧪 Como Testar o Dashboard Localmente

Este guia explica como testar o dashboard localmente, incluindo todas as funcionalidades e correções de compatibilidade.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

1. **Node.js** (versão 14 ou superior)
   - Verifique: `node --version`
   - Download: https://nodejs.org/

2. **Python** (versão 3.7 ou superior)
   - Verifique: `python --version` ou `python3 --version`
   - Download: https://www.python.org/

3. **pip** (gerenciador de pacotes Python)
   - Verifique: `pip --version` ou `pip3 --version`

## 🚀 Método 1: Início Rápido (Recomendado)

### Windows

1. **Instale as dependências Python:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Abra 2 terminais:**

   **Terminal 1 - Backend Python:**
   ```bash
   python backend.py
   ```
   Ou use o script:
   ```bash
   start-backend.bat
   ```
   Você deve ver: `🚀 Starting Noetika Tracking Backend (DEVELOPMENT)...`

   **Terminal 2 - Servidor Node.js:**
   ```bash
   npm start
   ```
   Ou use o script:
   ```bash
   START.bat
   ```
   Você deve ver: `✅✅✅ SERVIDOR RODANDO! ✅✅✅`

3. **Acesse no navegador:**
   ```
   http://localhost:8000
   ```

### Mac/Linux

1. **Instale as dependências Python:**
   ```bash
   pip3 install -r requirements.txt
   ```

2. **Abra 2 terminais:**

   **Terminal 1 - Backend Python:**
   ```bash
   python3 backend.py
   ```

   **Terminal 2 - Servidor Node.js:**
   ```bash
   npm start
   ```

3. **Acesse no navegador:**
   ```
   http://localhost:8000
   ```

## 🔍 Método 2: Usando o Script Automático

O projeto tem um script que inicia ambos os servidores automaticamente:

```bash
node start.js
```

Este script:
- Inicia o backend Python na porta 5000
- Aguarda 5 segundos
- Inicia o servidor Node.js na porta 8000
- Faz proxy das requisições `/api/*` para o backend Python

## ✅ Verificação de Funcionamento

### 1. Verificar se os servidores estão rodando

**Backend Python (porta 5000):**
```bash
curl http://localhost:5000/api/health
```
Deve retornar: `{"status":"ok",...}`

**Servidor Node.js (porta 8000):**
Abra no navegador: `http://localhost:8000`
Deve carregar a página do dashboard.

### 2. Testar Funcionalidades Básicas

1. **Interação com o Triângulo:**
   - Clique no triângulo para definir prioridades
   - Ajuste os valores nos campos de entrada
   - Clique em "Confirma"

2. **Visualização do Pódio:**
   - Após confirmar, deve aparecer o pódio com as 3 melhores categorias
   - Clique em "Ranking completo" para ver a tabela completa

3. **Gráfico de Clusters:**
   - No ranking completo, deve aparecer um gráfico de clusters
   - Verifique se o gráfico está renderizado corretamente

4. **Árvore de Soluções:**
   - Clique em "Árvore de Soluções"
   - Verifique se a árvore é exibida corretamente

### 3. Testar Geração de PDF (Funcionalidade Crítica)

1. **Confirme as prioridades** no triângulo
2. **Clique em "Ranking completo"**
3. **Clique em "Gerar relatório"**
4. **Confirme o aviso de transparência**
5. **Verifique se o PDF é gerado e baixado**

**O que verificar no PDF:**
- ✅ Tabela de ranking está presente
- ✅ Gráfico de clusters está incluído (ou mensagem amigável se não disponível)
- ✅ Dados do pódio estão corretos
- ✅ Prioridades estão corretas
- ✅ Hash do relatório está presente

### 4. Testar Compatibilidade entre Navegadores

Teste em diferentes navegadores para verificar as correções de compatibilidade:

**Navegadores para testar:**
- ✅ Chrome/Edge (versões recentes)
- ✅ Firefox (versões recentes)
- ✅ Safari (Mac)
- ✅ Chrome Mobile / Safari Mobile

**O que verificar:**
- ✅ Layout renderiza corretamente
- ✅ Triângulo interativo funciona
- ✅ Gráficos são exibidos
- ✅ PDF é gerado corretamente
- ✅ Modais abrem e fecham corretamente

## 🐛 Solução de Problemas

### Problema: Erro de arquitetura incompatível (Mac Apple Silicon)

**Sintoma:**
```
ImportError: dlopen(.../PIL/_imaging.cpython-313-darwin.so, 0x0002): 
mach-o file, but is an incompatible architecture (have 'x86_64', need 'arm64'...)
```

**Solução para Mac ARM (M1/M2/M3):**

1. **Verifique a arquitetura do Python:**
   ```bash
   arch
   file $(which python3)
   ```

2. **Se o Python estiver rodando em modo x86_64 (Rosetta), instale Pillow para x86_64:**
   ```bash
   pip3 uninstall -y Pillow
   arch -x86_64 pip3 install --no-cache-dir Pillow
   ```

3. **Se o Python estiver rodando em modo ARM nativo, instale Pillow para ARM:**
   ```bash
   pip3 uninstall -y Pillow
   arch -arm64 pip3 install --no-cache-dir Pillow
   ```

4. **Ou reinstale todas as dependências:**
   ```bash
   pip3 uninstall -y Pillow reportlab
   pip3 install --upgrade --force-reinstall -r requirements.txt
   ```

### Problema: Porta 8000 já está em uso

**Solução:**
```bash
# Windows
npm run kill-port

# Mac/Linux
lsof -ti:8000 | xargs kill -9
```

### Problema: Backend Python não inicia

**Verifique:**
1. Python está instalado: `python --version`
2. Dependências instaladas: `pip install -r requirements.txt`
3. Porta 5000 está livre

**Logs esperados:**
```
🚀 Starting Noetika Tracking Backend (DEVELOPMENT)...
📊 Server running at http://localhost:5000
```

### Problema: Erro ao gerar PDF

**Possíveis causas:**
1. Backend Python não está rodando
2. Imagem do gráfico não foi capturada corretamente
3. Erro na decodificação base64

**Solução:**
- Verifique o console do navegador (F12) para erros
- Verifique os logs do backend Python
- O PDF deve ser gerado mesmo se o gráfico falhar (com mensagem amigável)

### Problema: CORS ou Canvas "tainted"

**Solução:**
- O código já tem fallbacks para esses problemas
- Se o gráfico não aparecer, o PDF ainda será gerado
- Verifique se a imagem `public/triangulo2.png` existe

### Problema: Polyfills não carregam

**Verifique:**
1. O arquivo `compatibility.js` existe
2. Está sendo carregado antes de `app.js` no `index.html`
3. Console do navegador não mostra erros de carregamento

## 📊 Testando Funcionalidades Específicas

### Teste de Tracking

1. Abra o console do navegador (F12)
2. Verifique se há logs de tracking:
   ```
   ✅ Tracking initialized. Session ID: session_...
   ```
3. Interaja com a página
4. Verifique se eventos são registrados

### Teste de Modal de Solução

1. Clique em uma solução no ranking ou pódio
2. Verifique se o modal abre
3. Verifique se as informações estão corretas
4. Teste fechar com X ou clicando fora

### Teste de Responsividade

1. Redimensione a janela do navegador
2. Teste em diferentes tamanhos de tela
3. Verifique se o layout se adapta corretamente
4. Teste em dispositivo móvel (ou modo responsivo do DevTools)

## 🔧 Comandos Úteis

```bash
# Instalar dependências Node.js (se necessário)
npm install

# Instalar dependências Python
pip install -r requirements.txt

# Iniciar apenas o servidor Node.js
npm run start:dev

# Iniciar servidor simples (sem proxy)
npm run start:simple

# Verificar se as portas estão livres
# Windows
netstat -ano | findstr :8000
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :8000
lsof -i :5000
```

## 📝 Checklist de Teste Completo

Antes de considerar o teste completo, verifique:

- [ ] Servidor Node.js inicia sem erros
- [ ] Backend Python inicia sem erros
- [ ] Página carrega em `http://localhost:8000`
- [ ] Triângulo interativo funciona
- [ ] Valores podem ser ajustados
- [ ] Botão "Confirma" funciona
- [ ] Pódio é exibido após confirmação
- [ ] Ranking completo é exibido
- [ ] Gráfico de clusters é renderizado
- [ ] Árvore de soluções funciona
- [ ] Modal de solução abre e fecha
- [ ] PDF é gerado corretamente
- [ ] PDF contém todos os dados esperados
- [ ] Funciona em Chrome
- [ ] Funciona em Firefox
- [ ] Funciona em Safari (se Mac)
- [ ] Layout responsivo funciona
- [ ] Console não mostra erros críticos

## 🎯 Próximos Passos

Após testar localmente:

1. **Teste em diferentes navegadores** para garantir compatibilidade
2. **Teste a geração de PDF** várias vezes para garantir estabilidade
3. **Verifique os logs** do backend para erros
4. **Teste em dispositivos móveis** se aplicável

## 💡 Dicas

- Use o **DevTools do navegador** (F12) para ver erros e logs
- Verifique a **aba Network** para ver requisições de API
- Use **Console** para ver mensagens de debug
- **Mantenha ambos os terminais abertos** enquanto testa

---

**Problemas?** Verifique os logs nos terminais e no console do navegador para mais detalhes sobre erros.


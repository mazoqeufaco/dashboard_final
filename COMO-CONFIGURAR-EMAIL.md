# 📧 Como Configurar Email para Receber Relatórios

## ⚠️ Problema Atual

Você não está recebendo os relatórios por email porque a senha de email não está configurada.

## ✅ Solução Rápida

### 1. Crie um arquivo `.env` na raiz do projeto

Crie um arquivo chamado `.env` (sem extensão) na mesma pasta onde está o `backend.py`.

### 2. Adicione as seguintes linhas no arquivo `.env`:

```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=noetikaai@gmail.com
EMAIL_PASSWORD=sua_senha_de_app_gmail_aqui
EMAIL_TO=noetikaai@gmail.com, gabriel.silva@ufabc.edu.br
```

### 3. Obtenha a Senha de App do Gmail

Se sua conta Gmail tem **verificação em 2 etapas ativada**, você precisa criar uma **Senha de App**:

1. Acesse: https://myaccount.google.com/apppasswords
2. Selecione:
   - **App:** Email
   - **Dispositivo:** Outro (Personalizado) → Digite "Tribussula"
3. Clique em **Gerar**
4. Copie a senha de 16 caracteres (você pode usar com ou sem espaços)
5. Cole no arquivo `.env` na linha `EMAIL_PASSWORD=`

**Exemplo:**
```env
EMAIL_PASSWORD=abcd efgh ijkl mnop
```
ou
```env
EMAIL_PASSWORD=abcdefghijklmnop
```

### 4. Reinicie o backend

Após criar o arquivo `.env`, você precisa reiniciar o backend para que as variáveis sejam carregadas:

1. Pare o backend (Ctrl+C no terminal onde está rodando)
2. Inicie novamente com `node start.js` ou `python backend.py`

### 5. Teste o envio de email

Execute o script de teste:
```bash
python test_email.py
```

Se tudo estiver correto, você verá:
```
✅ Login SMTP realizado com sucesso
✅ Email enviado!
```

## 🔍 Verificação

Após configurar, quando você gerar um relatório, você verá no terminal do backend:

```
📧 Tentando enviar email para: noetikaai@gmail.com, gabriel.silva@ufabc.edu.br
📧 Servidor SMTP: smtp.gmail.com:587
📧 De: noetikaai@gmail.com
✅ Login SMTP realizado com sucesso
✅ Email enviado com sucesso para: noetikaai@gmail.com, gabriel.silva@ufabc.edu.br
```

## ❌ Se ainda não funcionar

### Erro: "EMAIL_PASSWORD não configurado"
- Verifique se o arquivo `.env` está na raiz do projeto (mesma pasta do `backend.py`)
- Verifique se a linha `EMAIL_PASSWORD=...` está no arquivo
- Reinicie o backend após criar/editar o `.env`

### Erro: "SMTPAuthenticationError"
- Verifique se a senha de app está correta
- Tente gerar uma nova senha de app
- Certifique-se de que a verificação em 2 etapas está ativada no Gmail

### Erro: "SMTPConnectError"
- Verifique sua conexão com a internet
- Verifique se o firewall não está bloqueando a porta 587

## 📚 Mais Informações

Veja o arquivo `CONFIGURACAO-EMAIL.md` para mais detalhes e opções avançadas.


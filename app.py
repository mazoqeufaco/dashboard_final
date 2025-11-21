#!/usr/bin/env python3
"""
Entrypoint para Vercel Flask preset.
Importa a aplicação Flask definida em backend.py.
"""

# Importa a aplicação Flask principal do backend
from backend import app

# Garante que o objeto 'app' esteja disponível no nível do módulo
# Vercel espera um objeto chamado 'app' ou 'application'
__all__ = ['app']

# Se precisar de configurações específicas para Vercel, pode ajustar aqui
if __name__ == '__main__':
    # Este bloco não será usado em produção na Vercel,
    # mas é útil para testes locais.
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)

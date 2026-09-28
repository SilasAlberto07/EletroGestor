# Banco de dados

SQLite, arquivo `eletrogestor.db` na pasta de dados do usuário.

```
clientes (id, nome, documento, telefone, email, endereco, observacoes, criado_em)
    │
    │ 1:N
    ▼
orcamentos (id, cliente_id, servico_id, status, mao_obra, deslocamento, total, observacoes, criado_em, atualizado_em)
    ▲                    │
    │ N:1                │ 1:N (apagar orçamento apaga os itens)
    │                    ▼
servicos (id, nome,   orcamento_itens (id, orcamento_id, material_id, descricao, unidade, quantidade, unitario, total)
  descricao,                       │
  mao_obra_padrao)                 │ N:1 (opcional)
                                   ▼
                      materiais (id, descricao, unidade, preco)

configuracoes (chave, valor)
_migrations (nome, aplicada_em)     controle interno das migrations
```

## Regras

- **status** do orçamento: `aguardando`, `aprovado` ou `recusado`
- **total** do orçamento = soma dos itens + mão de obra + deslocamento (recalculado no servidor ao salvar)
- Os itens guardam uma **cópia** da descrição e do preço do material. Se o preço do material mudar depois, orçamentos antigos não mudam.
- Não é possível excluir cliente ou serviço que tenha orçamentos.
- O número exibido (`#001`) é o `id` do orçamento com 3 dígitos.

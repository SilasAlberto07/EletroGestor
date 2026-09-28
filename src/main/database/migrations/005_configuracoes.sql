CREATE TABLE configuracoes (
  chave TEXT PRIMARY KEY,
  valor TEXT
);

INSERT INTO configuracoes (chave, valor) VALUES
  ('empresa_nome', 'Minha Empresa Elétrica'),
  ('empresa_documento', ''),
  ('empresa_telefone', ''),
  ('empresa_email', ''),
  ('empresa_endereco', ''),
  ('responsavel', ''),
  ('deslocamento_padrao', '80'),
  ('validade_dias', '15'),
  ('condicoes', 'Pagamento: 50% na aprovação e 50% na conclusão do serviço.' || char(10) || 'Garantia de 90 dias sobre a mão de obra.');

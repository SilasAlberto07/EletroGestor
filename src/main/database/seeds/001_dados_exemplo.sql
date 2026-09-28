-- Dados de exemplo (aplicados só na primeira vez que o sistema abre).
-- Pode apagar tudo pelo próprio sistema depois.

INSERT INTO clientes (id, nome, telefone, endereco) VALUES
  (1, 'João Silva',   '(66) 99999-1001', 'Rua das Flores, 120 - Centro'),
  (2, 'Maria Souza',  '(66) 99999-1002', 'Av. Brasil, 845 - Jardim Primavera'),
  (3, 'Pedro Alves',  '(66) 99999-1003', 'Rua Ipê, 33 - Setor Industrial'),
  (4, 'Ana Costa',    '(66) 99999-1004', 'Rua Cedro, 77 - Jardim das Palmeiras'),
  (5, 'Roberto Dias', '(66) 99999-1005', 'Av. das Itaúbas, 1500 - Centro');

INSERT INTO servicos (id, nome, descricao, mao_obra_padrao) VALUES
  (1, 'Instalação elétrica residencial', 'Instalação completa de pontos elétricos em residência', 850),
  (2, 'Quadro elétrico', 'Montagem ou substituição de quadro de distribuição', 400),
  (3, 'Manutenção predial', 'Revisão e manutenção de instalações elétricas', 500),
  (4, 'Instalação de luminárias', 'Instalação de luminárias e pontos de luz', 200),
  (5, 'Troca de fiação', 'Substituição de fiação antiga ou danificada', 600);

INSERT INTO materiais (id, descricao, unidade, preco) VALUES
  (1, 'Cabo 2,5mm', 'm', 4.80),
  (2, 'Cabo 4mm', 'm', 7.50),
  (3, 'Tomada', 'un', 18.00),
  (4, 'Interruptor', 'un', 15.00),
  (5, 'Disjuntor', 'un', 32.00),
  (6, 'Luminária LED', 'un', 45.00),
  (7, 'Quadro de distribuição', 'un', 180.00),
  (8, 'Eletroduto corrugado', 'm', 3.20);

INSERT INTO orcamentos (id, cliente_id, servico_id, status, mao_obra, deslocamento, total) VALUES
  (1, 1, 1, 'aguardando', 950, 80, 2850),
  (2, 2, 2, 'aprovado',   776, 80, 1420),
  (3, 3, 3, 'aprovado',   720, 80, 950),
  (4, 4, 4, 'aguardando', 200, 60, 620),
  (5, 5, 5, 'aguardando', 390, 80, 1100);

INSERT INTO orcamento_itens (orcamento_id, material_id, descricao, unidade, quantidade, unitario, total) VALUES
  (1, 1, 'Cabo 2,5mm', 'm', 200, 4.80, 960),
  (1, 3, 'Tomada', 'un', 30, 18, 540),
  (1, 5, 'Disjuntor', 'un', 10, 32, 320),
  (2, 7, 'Quadro de distribuição', 'un', 1, 180, 180),
  (2, 5, 'Disjuntor', 'un', 12, 32, 384),
  (3, 3, 'Tomada', 'un', 5, 18, 90),
  (3, 4, 'Interruptor', 'un', 4, 15, 60),
  (4, 6, 'Luminária LED', 'un', 8, 45, 360),
  (5, 1, 'Cabo 2,5mm', 'm', 100, 4.80, 480),
  (5, 2, 'Cabo 4mm', 'm', 20, 7.50, 150);

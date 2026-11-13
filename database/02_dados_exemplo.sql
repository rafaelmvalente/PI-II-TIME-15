-- =============================================================================
-- Autor: Tiago Medeiros - RA: 25000845
-- Data: 06/11/2026
-- Descrição: Dados de exemplo para testar o banco. Espelham os dados em memória
--            do backend (backend/src/data/dados.ts), com os mesmos usuários,
--            projetos e demandas, mais alguns comentários e registros de histórico.
-- Execução:  mysql -u root -p < 02_dados_exemplo.sql   (depois do 01_schema.sql)
-- Atenção:   todos os usuários de exemplo usam a senha 123456, guardada como hash
--            bcrypt. Use apenas em ambiente de desenvolvimento.
-- =============================================================================

USE pi2_demandas;

-- Usuários (perfis resolvidos pelo nome, sem depender dos ids)
INSERT INTO usuario (id, nome, email, senha_hash, perfil_id)
SELECT u.id, u.nome, u.email, '$2b$10$yKv7kdvPnJgq6XbY/rR71OA/UuBcdRxSnrz4YMPwNGV6HMxNS7hgG', p.id
FROM (
  SELECT 1 AS id, 'Rafael Mendes Valente' AS nome, 'rafael.mv4@puccampinas.edu.br' AS email, 'Administrador'    AS perfil UNION ALL
  SELECT 2,       'Joao',                           'joao@puccampinas.edu.br',                'Líder de Projeto'           UNION ALL
  SELECT 3,       'Caio',                           'caio@puccampinas.edu.br',                'Membro da Equipe'
) u
JOIN perfil p ON p.nome = u.perfil;

-- Projetos
INSERT INTO projeto (id, nome) VALUES
  (1, 'Projeto Alfa'),
  (2, 'Projeto Beta');

-- Vínculos: Joao lidera o Projeto Alfa (liderIds: [2]); Caio é membro do Beta
INSERT INTO projeto_usuario (projeto_id, usuario_id, lider) VALUES
  (1, 2, 1),
  (2, 3, 0);

-- Demandas
INSERT INTO demanda
  (id, titulo, descricao, tipo_id, prioridade_id, status_id, projeto_id,
   responsavel_id, criador_id, criada_em, atualizada_em, prazo_finalizacao)
SELECT d.id, d.titulo, d.descricao, t.id, pr.id, s.id, d.projeto_id,
       d.responsavel_id, 1, d.criada_em, d.atualizada_em, d.prazo
FROM (
  SELECT 1 AS id, 'Corrigir falha no login' AS titulo, 'Erro ao autenticar com e-mail institucional' AS descricao,
         'Defeito' AS tipo, 'Crítica' AS prioridade, 'Em andamento' AS status, 1 AS projeto_id, 1 AS responsavel_id,
         '2026-10-10' AS criada_em, '2026-10-12' AS atualizada_em, '2026-10-22' AS prazo
  UNION ALL
  SELECT 2, 'Implementar tela de dashboard', 'Indicadores resumidos das demandas',
         'Tarefa', 'Alta', 'Aberta', 1, NULL, '2026-10-08', '2026-10-08', '2026-10-25'
  UNION ALL
  SELECT 3, 'Atualizar documentação da API', 'Documentar rotas GET e POST',
         'Documentação', 'Média', 'Concluída', 2, 2, '2026-09-28', '2026-10-05', '2026-10-05'
  UNION ALL
  SELECT 4, 'Ajustar layout responsivo', 'Problemas em telas pequenas',
         'Melhoria', 'Baixa', 'Cancelada', 2, 3, '2026-09-20', '2026-09-30', NULL
) d
JOIN tipo_demanda   t  ON t.nome  = d.tipo
JOIN prioridade     pr ON pr.nome = d.prioridade
JOIN status_demanda s  ON s.nome  = d.status;

-- Comentários
INSERT INTO comentario (demanda_id, usuario_id, texto, criado_em) VALUES
  (1, 1, 'Reproduzi o erro apenas com e-mails do domínio institucional.', '2026-10-11 14:30:00'),
  (1, 2, 'Vou revisar a validação do domínio no backend.',                '2026-10-12 09:10:00'),
  (4, 3, 'Cancelando: o layout será refeito junto com o novo tema.',      '2026-09-30 16:45:00');

-- Histórico de alterações
INSERT INTO historico_alteracao
  (demanda_id, usuario_id, tipo_alteracao_id, valor_anterior, valor_novo, alterado_em)
SELECT h.demanda_id, h.usuario_id, ta.id, h.anterior, h.novo, h.quando
FROM (
  SELECT 1 AS demanda_id, 1 AS usuario_id, 'Responsável' AS tipo, NULL AS anterior,
         'Rafael Mendes Valente' AS novo, '2026-10-10 10:00:00' AS quando
  UNION ALL
  SELECT 1, 1, 'Status', 'Aberta', 'Em andamento', '2026-10-12 11:20:00'
  UNION ALL
  SELECT 3, 2, 'Status', 'Em revisão', 'Concluída', '2026-10-05 17:00:00'
  UNION ALL
  SELECT 4, 1, 'Cancelamento', 'Aberta', 'Cancelada', '2026-09-30 16:50:00'
) h
JOIN tipo_alteracao ta ON ta.nome = h.tipo;

-- =============================================================================
-- Autor: Tiago Medeiros - RA: 25000845
-- Data: 06/11/2026
-- Descrição: Consultas de exemplo que o backend pode reaproveitar: listagem com
--            filtros/busca/ordenação, detalhe da demanda, dashboard e regras de
--            transição de status. Servem também para provar que a modelagem
--            atende às telas do sistema.
-- =============================================================================

USE pi2_demandas;

-- 1. LISTAGEM com todos os dados exibidos na tela (a tela de listagem)
--    Filtros opcionais: troque o "?" ou remova a linha do filtro que não usar.
SELECT d.id, d.titulo, t.nome AS tipo, pr.nome AS prioridade, s.nome AS status,
       p.nome AS projeto, u.nome AS responsavel, d.criada_em, d.prazo_finalizacao
FROM demanda d
JOIN tipo_demanda   t  ON t.id  = d.tipo_id
JOIN prioridade     pr ON pr.id = d.prioridade_id
JOIN status_demanda s  ON s.id  = d.status_id
JOIN projeto        p  ON p.id  = d.projeto_id
LEFT JOIN usuario   u  ON u.id  = d.responsavel_id      -- LEFT: pode não ter responsável
WHERE s.nome  = 'Em andamento'                           -- filtro por status
  AND pr.nome = 'Crítica'                                -- filtro por prioridade
  AND t.nome  = 'Defeito'                                -- filtro por tipo
  AND d.projeto_id = 1                                   -- filtro por projeto
  AND d.responsavel_id = 1                               -- filtro por responsável
ORDER BY pr.ordem;                                       -- ordenar por prioridade (Crítica primeiro)
-- Outras ordenações: d.criada_em | d.prazo_finalizacao | s.nome

-- 2. BUSCA TEXTUAL por título ou descrição
SELECT d.id, d.titulo
FROM demanda d
WHERE MATCH (d.titulo, d.descricao) AGAINST ('login' IN NATURAL LANGUAGE MODE);

-- 3. DETALHE DE UMA DEMANDA, com comentários e histórico
SELECT d.*, t.nome AS tipo, pr.nome AS prioridade, s.nome AS status, p.nome AS projeto,
       r.nome AS responsavel, c.nome AS criador
FROM demanda d
JOIN tipo_demanda   t  ON t.id  = d.tipo_id
JOIN prioridade     pr ON pr.id = d.prioridade_id
JOIN status_demanda s  ON s.id  = d.status_id
JOIN projeto        p  ON p.id  = d.projeto_id
JOIN usuario        c  ON c.id  = d.criador_id
LEFT JOIN usuario   r  ON r.id  = d.responsavel_id
WHERE d.id = 1;

SELECT u.nome AS autor, c.texto, c.criado_em
FROM comentario c
JOIN usuario u ON u.id = c.usuario_id
WHERE c.demanda_id = 1
ORDER BY c.criado_em;

SELECT u.nome AS alterado_por, ta.nome AS alteracao, h.valor_anterior, h.valor_novo, h.alterado_em
FROM historico_alteracao h
JOIN usuario        u  ON u.id  = h.usuario_id
JOIN tipo_alteracao ta ON ta.id = h.tipo_alteracao_id
WHERE h.demanda_id = 1
ORDER BY h.alterado_em;

-- 4. DASHBOARD
-- 4.1 Total de demandas
SELECT COUNT(*) AS total_demandas FROM demanda;

-- 4.2 Quantidade por status (LEFT JOIN para mostrar também os status com 0)
SELECT s.nome AS status, COUNT(d.id) AS quantidade
FROM status_demanda s
LEFT JOIN demanda d ON d.status_id = s.id
GROUP BY s.id, s.nome
ORDER BY s.id;

-- 4.3 Quantidade por prioridade
SELECT pr.nome AS prioridade, COUNT(d.id) AS quantidade
FROM prioridade pr
LEFT JOIN demanda d ON d.prioridade_id = pr.id
GROUP BY pr.id, pr.nome, pr.ordem
ORDER BY pr.ordem;

-- 4.4 Quantidade por tipo
SELECT t.nome AS tipo, COUNT(d.id) AS quantidade
FROM tipo_demanda t
LEFT JOIN demanda d ON d.tipo_id = t.id
GROUP BY t.id, t.nome
ORDER BY t.id;

-- 4.5 Demandas críticas em aberto (ainda não concluídas nem canceladas)
SELECT d.id, d.titulo, s.nome AS status
FROM demanda d
JOIN prioridade     pr ON pr.id = d.prioridade_id
JOIN status_demanda s  ON s.id  = d.status_id
WHERE pr.nome = 'Crítica'
  AND s.nome NOT IN ('Concluída', 'Cancelada');

-- 4.6 Demandas próximas do prazo (próximos 7 dias, ainda em andamento no fluxo)
SELECT d.id, d.titulo, d.prazo_finalizacao
FROM demanda d
JOIN status_demanda s ON s.id = d.status_id
WHERE d.prazo_finalizacao BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
  AND s.nome NOT IN ('Concluída', 'Cancelada')
ORDER BY d.prazo_finalizacao;

-- 5. REGRA DE TRANSIÇÃO: o perfil pode mudar de "Aberta" para "Concluída"?
--    Retorna 1 linha se for permitido e 0 linhas se não for.
SELECT 1
FROM transicao_status ts
JOIN status_demanda o ON o.id = ts.status_origem_id  AND o.nome = 'Aberta'
JOIN status_demanda d ON d.id = ts.status_destino_id AND d.nome = 'Concluída'
JOIN perfil         p ON p.id = ts.perfil_id         AND p.nome = 'Líder de Projeto';

-- =============================================================================
-- Autor: Tiago Medeiros - RA: 25000845
-- Data: 06/11/2026
-- Descrição: Script de criação do banco de dados do Sistema de Acompanhamento
--            de Demandas de Desenvolvimento (PI2) - MySQL 8 / MariaDB 10.5+.
--            Cria as tabelas, chaves, índices, as regras de ciclo de vida do
--            status e as proteções contra exclusão (demanda e histórico).
-- Execução:  mysql -u root -p < 01_schema.sql
-- =============================================================================

DROP DATABASE IF EXISTS pi2_demandas;
CREATE DATABASE pi2_demandas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE pi2_demandas;

-- =============================================================================
-- 1. TABELAS DE DOMÍNIO (valores fixos previstos no escopo do sistema)
--    Ficam em tabelas, e não em ENUM, para manter integridade por chave
--    estrangeira e permitir a mesma modelagem em MySQL e Oracle.
-- =============================================================================

-- Perfis de acesso: Administrador, Líder de Projeto e Membro da Equipe
CREATE TABLE perfil (
  id    TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome  VARCHAR(30)      NOT NULL,
  CONSTRAINT pk_perfil      PRIMARY KEY (id),
  CONSTRAINT uq_perfil_nome UNIQUE (nome)
) ENGINE=InnoDB;

-- Tipos de demanda: Tarefa, Defeito, Melhoria e Documentação
CREATE TABLE tipo_demanda (
  id    TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome  VARCHAR(30)      NOT NULL,
  CONSTRAINT pk_tipo_demanda      PRIMARY KEY (id),
  CONSTRAINT uq_tipo_demanda_nome UNIQUE (nome)
) ENGINE=InnoDB;

-- Prioridades: Crítica, Alta, Média e Baixa.
-- "ordem" permite ordenar por prioridade (1 = mais urgente) sem depender do
-- nome, que em ordem alfabética não representa a gravidade.
CREATE TABLE prioridade (
  id     TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome   VARCHAR(30)      NOT NULL,
  ordem  TINYINT UNSIGNED NOT NULL,
  CONSTRAINT pk_prioridade       PRIMARY KEY (id),
  CONSTRAINT uq_prioridade_nome  UNIQUE (nome),
  CONSTRAINT uq_prioridade_ordem UNIQUE (ordem)
) ENGINE=InnoDB;

-- Status: Aberta, Em andamento, Em revisão, Concluída e Cancelada
CREATE TABLE status_demanda (
  id         TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome       VARCHAR(30)      NOT NULL,
  descricao  VARCHAR(100)     NOT NULL,
  CONSTRAINT pk_status_demanda      PRIMARY KEY (id),
  CONSTRAINT uq_status_demanda_nome UNIQUE (nome)
) ENGINE=InnoDB;

-- Tipos de alteração registradas no histórico da demanda
CREATE TABLE tipo_alteracao (
  id    TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome  VARCHAR(30)      NOT NULL,
  CONSTRAINT pk_tipo_alteracao      PRIMARY KEY (id),
  CONSTRAINT uq_tipo_alteracao_nome UNIQUE (nome)
) ENGINE=InnoDB;

-- Máquina de estados: cada linha é uma transição de status permitida para um
-- perfil. A API consulta esta tabela em vez de repetir as regras no código.
CREATE TABLE transicao_status (
  status_origem_id   TINYINT UNSIGNED NOT NULL,
  status_destino_id  TINYINT UNSIGNED NOT NULL,
  perfil_id          TINYINT UNSIGNED NOT NULL,
  CONSTRAINT pk_transicao_status PRIMARY KEY (status_origem_id, status_destino_id, perfil_id),
  CONSTRAINT fk_transicao_origem  FOREIGN KEY (status_origem_id)  REFERENCES status_demanda (id),
  CONSTRAINT fk_transicao_destino FOREIGN KEY (status_destino_id) REFERENCES status_demanda (id),
  CONSTRAINT fk_transicao_perfil  FOREIGN KEY (perfil_id)         REFERENCES perfil (id),
  CONSTRAINT ck_transicao_diferente CHECK (status_origem_id <> status_destino_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 2. USUÁRIOS E PROJETOS
-- =============================================================================

CREATE TABLE usuario (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(120)     NOT NULL,
  email       VARCHAR(150)     NOT NULL,
  senha_hash  VARCHAR(255)     NOT NULL,  -- nunca gravar a senha em texto puro
  perfil_id   TINYINT UNSIGNED NOT NULL,
  ativo       TINYINT(1)       NOT NULL DEFAULT 1,
  criado_em   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuario       PRIMARY KEY (id),
  CONSTRAINT uq_usuario_email UNIQUE (email),
  CONSTRAINT fk_usuario_perfil FOREIGN KEY (perfil_id) REFERENCES perfil (id)
) ENGINE=InnoDB;

CREATE TABLE projeto (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome       VARCHAR(100) NOT NULL,
  descricao  VARCHAR(500) NULL,
  criado_em  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_projeto      PRIMARY KEY (id),
  CONSTRAINT uq_projeto_nome UNIQUE (nome)
) ENGINE=InnoDB;

-- Vínculo N:N entre projeto e usuário. "lider" = 1 indica que o usuário gerencia
-- o projeto (equivale ao campo liderIds do backend). Regra de aplicação: só
-- usuários com perfil "Líder de Projeto" podem ter lider = 1.
CREATE TABLE projeto_usuario (
  projeto_id  INT UNSIGNED NOT NULL,
  usuario_id  INT UNSIGNED NOT NULL,
  lider       TINYINT(1)   NOT NULL DEFAULT 0,
  CONSTRAINT pk_projeto_usuario PRIMARY KEY (projeto_id, usuario_id),
  CONSTRAINT fk_pu_projeto FOREIGN KEY (projeto_id) REFERENCES projeto (id),
  CONSTRAINT fk_pu_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
  INDEX ix_pu_usuario (usuario_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 3. DEMANDAS, COMENTÁRIOS E HISTÓRICO
-- =============================================================================

CREATE TABLE demanda (
  id                 INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  titulo             VARCHAR(120)     NOT NULL,
  descricao          TEXT             NOT NULL,
  tipo_id            TINYINT UNSIGNED NOT NULL,
  prioridade_id      TINYINT UNSIGNED NOT NULL,
  status_id          TINYINT UNSIGNED NOT NULL,
  projeto_id         INT UNSIGNED     NOT NULL,
  responsavel_id     INT UNSIGNED     NULL,      -- demanda pode estar sem responsável
  criador_id         INT UNSIGNED     NOT NULL,
  criada_em          DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizada_em      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                      ON UPDATE CURRENT_TIMESTAMP,
  prazo_finalizacao  DATE             NULL,      -- opcional; validado contra feriados pela API
  CONSTRAINT pk_demanda PRIMARY KEY (id),
  CONSTRAINT fk_demanda_tipo        FOREIGN KEY (tipo_id)        REFERENCES tipo_demanda (id),
  CONSTRAINT fk_demanda_prioridade  FOREIGN KEY (prioridade_id)  REFERENCES prioridade (id),
  CONSTRAINT fk_demanda_status      FOREIGN KEY (status_id)      REFERENCES status_demanda (id),
  CONSTRAINT fk_demanda_projeto     FOREIGN KEY (projeto_id)     REFERENCES projeto (id),
  CONSTRAINT fk_demanda_responsavel FOREIGN KEY (responsavel_id) REFERENCES usuario (id),
  CONSTRAINT fk_demanda_criador     FOREIGN KEY (criador_id)     REFERENCES usuario (id),
  CONSTRAINT ck_demanda_titulo      CHECK (CHAR_LENGTH(TRIM(titulo)) >= 5),
  -- Índices para os filtros e ordenações da listagem e do dashboard
  INDEX ix_demanda_projeto     (projeto_id),
  INDEX ix_demanda_responsavel (responsavel_id),
  INDEX ix_demanda_status      (status_id),
  INDEX ix_demanda_prioridade  (prioridade_id),
  INDEX ix_demanda_tipo        (tipo_id),
  INDEX ix_demanda_prazo       (prazo_finalizacao),
  -- Busca textual por título ou descrição
  FULLTEXT INDEX ft_demanda_busca (titulo, descricao)
) ENGINE=InnoDB;

CREATE TABLE comentario (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  demanda_id  INT UNSIGNED NOT NULL,
  usuario_id  INT UNSIGNED NOT NULL,
  texto       TEXT         NOT NULL,
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- data e horário
  CONSTRAINT pk_comentario PRIMARY KEY (id),
  CONSTRAINT fk_comentario_demanda FOREIGN KEY (demanda_id) REFERENCES demanda (id),
  CONSTRAINT fk_comentario_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
  INDEX ix_comentario_demanda (demanda_id, criado_em)
) ENGINE=InnoDB;

-- Histórico de alterações (status, responsável, prioridade, prazo, cancelamento).
-- Os valores anterior/novo são guardados como texto (a "foto" do momento), para
-- que o histórico continue legível mesmo que um nome seja alterado depois.
CREATE TABLE historico_alteracao (
  id                  BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  demanda_id          INT UNSIGNED     NOT NULL,
  usuario_id          INT UNSIGNED     NOT NULL,  -- quem fez a alteração
  tipo_alteracao_id   TINYINT UNSIGNED NOT NULL,
  valor_anterior      VARCHAR(255)     NULL,
  valor_novo          VARCHAR(255)     NULL,
  alterado_em         DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_historico PRIMARY KEY (id),
  CONSTRAINT fk_historico_demanda FOREIGN KEY (demanda_id)        REFERENCES demanda (id),
  CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id)        REFERENCES usuario (id),
  CONSTRAINT fk_historico_tipo    FOREIGN KEY (tipo_alteracao_id) REFERENCES tipo_alteracao (id),
  INDEX ix_historico_demanda (demanda_id, alterado_em)
) ENGINE=InnoDB;

-- =============================================================================
-- 4. DADOS DE DOMÍNIO
-- =============================================================================

INSERT INTO perfil (nome) VALUES
  ('Administrador'), ('Líder de Projeto'), ('Membro da Equipe');

INSERT INTO tipo_demanda (nome) VALUES
  ('Tarefa'), ('Defeito'), ('Melhoria'), ('Documentação');

INSERT INTO prioridade (nome, ordem) VALUES
  ('Crítica', 1), ('Alta', 2), ('Média', 3), ('Baixa', 4);

INSERT INTO status_demanda (nome, descricao) VALUES
  ('Aberta',       'Demanda criada e ainda não iniciada'),
  ('Em andamento', 'Demanda em desenvolvimento'),
  ('Em revisão',   'Demanda aguardando revisão'),
  ('Concluída',    'Demanda finalizada'),
  ('Cancelada',    'Demanda cancelada');

INSERT INTO tipo_alteracao (nome) VALUES
  ('Status'), ('Responsável'), ('Prioridade'), ('Prazo'), ('Cancelamento');

-- Transições permitidas (ciclo de vida do README):
--   Aberta -> Em andamento -> Em revisão -> Concluída
--   Em revisão -> Em andamento
--   Qualquer status -> Cancelada, exceto demandas já concluídas
-- Administrador e Líder de Projeto fazem todas; o Membro da Equipe só faz
-- Aberta -> Em andamento e Em andamento -> Em revisão.
INSERT INTO transicao_status (status_origem_id, status_destino_id, perfil_id)
SELECT o.id, d.id, p.id
FROM (
  SELECT 'Aberta' AS origem, 'Em andamento' AS destino UNION ALL
  SELECT 'Em andamento', 'Em revisão'                  UNION ALL
  SELECT 'Em revisão',   'Concluída'                   UNION ALL
  SELECT 'Em revisão',   'Em andamento'                UNION ALL
  SELECT 'Aberta',       'Cancelada'                   UNION ALL
  SELECT 'Em andamento', 'Cancelada'                   UNION ALL
  SELECT 'Em revisão',   'Cancelada'
) t
JOIN status_demanda o ON o.nome = t.origem
JOIN status_demanda d ON d.nome = t.destino
JOIN perfil p ON p.nome IN ('Administrador', 'Líder de Projeto');

INSERT INTO transicao_status (status_origem_id, status_destino_id, perfil_id)
SELECT o.id, d.id, p.id
FROM (
  SELECT 'Aberta' AS origem, 'Em andamento' AS destino UNION ALL
  SELECT 'Em andamento', 'Em revisão'
) t
JOIN status_demanda o ON o.nome = t.origem
JOIN status_demanda d ON d.nome = t.destino
JOIN perfil p ON p.nome = 'Membro da Equipe';

-- =============================================================================
-- 5. PROTEÇÕES: não existe exclusão física de demandas e o histórico nunca é
--    apagado nem alterado (cancelar = mudar o status para "Cancelada").
-- =============================================================================

DELIMITER $$

CREATE TRIGGER trg_demanda_bloqueia_exclusao
BEFORE DELETE ON demanda
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Demandas não podem ser excluídas; altere o status para Cancelada.';
END$$

CREATE TRIGGER trg_historico_bloqueia_alteracao
BEFORE UPDATE ON historico_alteracao
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'O histórico de alterações é imutável.';
END$$

CREATE TRIGGER trg_historico_bloqueia_exclusao
BEFORE DELETE ON historico_alteracao
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'O histórico de alterações nunca pode ser apagado.';
END$$

DELIMITER ;

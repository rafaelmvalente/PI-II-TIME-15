# Sistema de Acompanhamento de Demandas de Desenvolvimento

> Projeto desenvolvido para o componente curricular **Projeto Integrador 2**, do curso de Engenharia de Software da **Pontifícia Universidade Católica de Campinas (PUC-Campinas)** — 2026.

---

## Sobre o projeto

O **Sistema de Acompanhamento de Demandas de Desenvolvimento** é uma aplicação inspirada em ferramentas utilizadas por equipes de tecnologia para organizar **tarefas, defeitos (bugs) e melhorias de software**.

O sistema permite o cadastro de projetos, cada um com suas próprias demandas, usuários e histórico de acompanhamento.

Cada demanda representa uma tarefa, defeito, melhoria ou atividade de documentação, contendo:

* Título
* Descrição
* Tipo
* Prioridade
* Responsável
* Status
* Prazo de finalização
* Histórico de alterações
* Comentários

O objetivo é facilitar o acompanhamento das demandas ao longo do ciclo de desenvolvimento de software.

---

## Equipe

| Nome         | RA |
| ------------ | ---- |
| Mateus Oliveira Rafael | 25001369 |
| Rafael Mendes Valente | 25002875 |
| Rodrigo Gabi | 25001714 |
| Tiago Medeiros | 25000845 |
| Vinicius Santucci | 25000294 |

### Orientação

**Prof. José Guilherme Picolo**
**Profa. Dra. Renata Arantes**
**Prof. Dr. Luã Muriana**
**Profa. Dra. Silvia Cristina de Matos Soares**

---

## Funcionalidades

#### Administrador

Possui acesso total ao sistema:

* Visualiza todos os projetos, usuários e demandas
* Cria e edita demandas
* Atribui responsáveis
* Altera prioridade e status
* Cancela demandas
* Consulta histórico e comentários

#### Líder de Projeto

Gerencia as demandas dos projetos aos quais está vinculado:

* Cria e edita demandas
* Atribui responsáveis
* Altera prioridades
* Realiza todas as transições de status
* Cancela demandas

#### Membro da Equipe

Acompanha as demandas atribuídas a ele:

* Registra comentários
* Altera o status de **Aberta → Em andamento**
* Altera o status de **Em andamento → Em revisão**

Não pode:

* Concluir demandas
* Cancelar demandas
* Alterar prioridade
* Reatribuir responsáveis

---

## Gerenciamento de demandas

O sistema oferece:

* Cadastro, listagem, visualização e edição de demandas
* Classificação por **tipo**:

  * Tarefa
  * Defeito
  * Melhoria
  * Documentação
* Classificação por **prioridade**:

  * Baixa
  * Média
  * Alta
  * Crítica
* Controle de **status**:

  * Aberta
  * Em andamento
  * Em revisão
  * Concluída
  * Cancelada

### Ciclo de vida da demanda

```text
Aberta
   ↓
Em andamento
   ↓
Em revisão
   ↓
Concluída
```

Também são permitidas as seguintes transições:

```text
Em revisão → Em andamento

Qualquer status → Cancelada
(exceto demandas já concluídas)
```

Não existe exclusão física de demandas. O cancelamento é realizado por meio da alteração do status, preservando todo o histórico da demanda.

### Validação de feriados

O sistema realiza a validação automática do prazo de finalização utilizando uma **API externa de feriados nacionais**.

Caso a data informada coincida com um feriado nacional, o cadastro ou atualização da demanda é bloqueado.

---

## Comentários e histórico

### Comentários

* Registro de comentários vinculados a uma demanda
* Cada comentário é associado ao usuário responsável
* Armazenamento de data e horário

### Histórico

O sistema registra automaticamente alterações relevantes, incluindo:

* Status
* Responsável
* Prioridade
* Prazo
* Cancelamento

O histórico **nunca é apagado**, mesmo após o cancelamento de uma demanda.

---

## Filtros, busca e ordenação

As demandas podem ser filtradas por:

* Status
* Prioridade
* Tipo
* Responsável
* Projeto

Também é possível realizar:

*  Busca textual por título ou descrição
*  Ordenação por prioridade
*  Ordenação por data de criação
*  Ordenação por prazo de finalização
*  Ordenação por status

---

## Dashboard

A tela inicial apresenta indicadores resumidos do sistema, incluindo:

* Total de demandas
* Quantidade de demandas por status
* Quantidade por prioridade
* Quantidade por tipo
* Demandas críticas em aberto
* Demandas próximas do prazo de finalização

### Status acompanhados

| Status          | Descrição                           |
| --------------- | ----------------------------------- |
| Aberta       | Demanda criada e ainda não iniciada |
| Em andamento | Demanda em desenvolvimento          |
| Em revisão   | Demanda aguardando revisão          |
| Concluída     | Demanda finalizada                  |
| Cancelada    | Demanda cancelada                   |

---

## Tecnologias utilizadas

### Frontend

* HTML5
* CSS3
* JavaScript
* Bootstrap

### Backend

* Node.js (LTS)
* TypeScript
* Express

### Banco de dados

* MySQL / Oracle

### Controle de versão

* Git
* GitHub
* GitHub Projects

---



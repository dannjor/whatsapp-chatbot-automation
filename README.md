# Chatbot de Automação no WhatsApp

## 📌 Contexto
Este projeto consiste em um chatbot desenvolvido para automatizar o envio de mensagens no WhatsApp, aplicando regras de negócio para evitar envios duplicados e garantir uma comunicação controlada com os contatos.

A solução foi criada para resolver problemas comuns de automação, como múltiplos disparos para o mesmo usuário e falta de controle sobre a frequência de respostas.

## 🎯 Objetivo
- Automatizar respostas no WhatsApp
- Garantir que cada contato receba apenas **uma resposta por dia**
- Reduzir retrabalho manual
- Criar uma lógica de controle simples, confiável e escalável

## ⚙️ Funcionalidades
- Envio automático de mensagens
- Controle de respostas por contato e por data
- Regra de **1 resposta por dia**
- Agendamento de execuções
- Registro e validação de contatos já respondidos
- Lógica preparada para expansão de regras de negócio

## 🛠️ Tecnologias Utilizadas
- **Node.js**
- **JavaScript**
- Biblioteca de automação para WhatsApp
- Agendamento de tarefas (cron)
- Estrutura de controle em memória / arquivo

## 🧠 Regras de Negócio
- Um mesmo contato não pode receber mais de uma resposta no mesmo dia
- O controle é feito por identificador do contato + data
- Caso o contato já tenha sido respondido, a mensagem é ignorada
- Logs são gerados para monitoramento da execução

## 📂 Estrutura do Projeto

## ✅ Resultados
- Redução de mensagens duplicadas
- Maior controle sobre a comunicação automatizada
- Base lógica reutilizável para outros fluxos de automação
- Projeto simples, mas com regras claras e aplicáveis ao mundo real

## 🚀 Próximos Passos
- Persistência em banco de dados
- Dashboard de monitoramento
- Integração com APIs externas
- Criação de múltiplos fluxos de atendimento
- Escalonamento para outros canais de comunicação

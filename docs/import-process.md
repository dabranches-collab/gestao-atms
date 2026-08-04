# Processo de importação

1. O browser verifica extensão e interpreta o nome.
2. O workbook é lido localmente; `INFO_REPORT` e a folha principal são localizadas.
3. Cabeçalhos são normalizados removendo acentos, pontuação, variação de caixa e espaços.
4. Cada linha é validada: terminal, números, negativos, downtime, cliente e duplicados.
5. Erros bloqueantes, avisos e informações são mostrados antes da confirmação.
6. A fase seguinte calculará SHA-256 e enviará uma única operação transaccional autenticada.

Actualmente são mostradas as cinco primeiras linhas no contrato de pré-visualização. Os ficheiros reais de Julho de 2026 foram validados apenas na pasta temporária local e não foram copiados para o repositório. O importador reconhece também sufixos de cópia do Windows como ` (1)` e os códigos Banco/Entidade 5 (BCI) e 47 (BKEVE).

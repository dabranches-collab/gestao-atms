# Processo de importação

1. O browser verifica extensão e interpreta o nome.
2. O workbook é lido localmente; `INFO_REPORT` e a folha principal são localizadas.
3. Cabeçalhos são normalizados removendo acentos, pontuação, variação de caixa e espaços.
4. Cada linha é validada: terminal, números, negativos, downtime, cliente e duplicados.
5. Erros bloqueantes, avisos e informações são mostrados antes da confirmação.
6. A fase seguinte calculará SHA-256 e enviará uma única operação transaccional autenticada.

Actualmente são mostradas as cinco primeiras linhas no contrato de pré-visualização. Ficheiros reais não foram encontrados nem usados nesta fase; os testes geram workbooks sintéticos com os cabeçalhos especificados.

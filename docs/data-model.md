# Modelo de dados

`clients` possui muitos `equipment`. Um terminal é único apenas dentro do cliente. `report_imports` representa o ficheiro e conserva hash, estado, contagens e autor. `equipment_monthly_metrics` liga importação, cliente, equipamento e mês, com unicidade mensal. Montantes usam `numeric(20,2)` e downtime usa decimal limitado a 0–1. `import_row_errors` conserva problemas auditáveis; `import_audit_log` regista mudanças de ciclo de vida sem criar um motor excessivo.

RLS permite leitura a autenticados e escrita inicial a `admin`/`analyst`. O perfil `viewer` é apenas de consulta.

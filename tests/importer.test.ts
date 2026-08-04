import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { normalizeText, mapHeaders } from '../src/lib/excel/columns'
import { parseReportFilename } from '../src/lib/excel/filename'
import { parseWorkbook } from '../src/lib/excel/importer'
import { calculateVariation } from '../src/lib/metrics/variation'

const headers = ['TERMINAL','BAT','NÚMERO DE TRANSACÇÕES','MONTANTE DE TRANSACÇÕES','NÚMERO DE DIAS COM TRANSACÇÕES','NÚMERO ABASTECIMENTOS','MONTANTE ABASTECIMENTOS','MONTANTE DISPENSADO','MONTANTE RECOLHIDO','DOWN-TIME (FALTA NOTAS)']
function workbook(rows: unknown[][]) { const book=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([headers,...rows]),'CA-BCI-202607'); XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([['Nome do Report','LISTAGEM CA'],['Banco/Entidade','BCI'],['Classificação','Reservada']]),'INFO_REPORT'); return XLSX.write(book,{type:'array',bookType:'xlsx'}) as ArrayBuffer }
describe('importação Excel',()=>{
  it('interpreta referência, período e cliente',()=>expect(parseReportFilename('L00046010-202607-LISTAGEM_CA_BAT-BKEVE.xlsx')).toEqual({reference:'L00046010',period:'2026-07-01',reportType:'LISTAGEM_CA',client:'BKEVE'}))
  it('normaliza acentos e espaços',()=>expect(normalizeText('  Número  de Transacções ')).toBe('NUMERO DE TRANSACCOES'))
  it('mapeia as dez colunas',()=>expect(Object.keys(mapHeaders(headers))).toHaveLength(10))
  it('lê downtime decimal válido',()=>{const result=parseWorkbook(workbook([['001','BCI',10,200,5,1,500,400,80,0.125]]),'L00046010-202607-LISTAGEM_CA_BAT-BCI.xlsx'); expect(result.rows[0].cashShortageDowntime).toBe(0.125); expect(result.issues.some(i=>i.code==='DOWNTIME_OUT_OF_RANGE')).toBe(false)})
  it('detecta downtime fora do intervalo',()=>expect(parseWorkbook(workbook([['001','BCI',10,200,5,1,500,400,80,1.2]]),'L00046010-202607-LISTAGEM_CA_BAT-BCI.xlsx').issues.some(i=>i.code==='DOWNTIME_OUT_OF_RANGE')).toBe(true))
  it('detecta terminais duplicados',()=>expect(parseWorkbook(workbook([['001','BCI',10,200,5,1,500,400,80,.1],['001','BCI',12,220,6,1,500,410,70,.1]]),'L00046010-202607-LISTAGEM_CA_BAT-BCI.xlsx').issues.some(i=>i.code==='DUPLICATE_TERMINAL')).toBe(true))
  it('calcula variação absoluta e percentual',()=>expect(calculateVariation(120,100)).toEqual({absolute:20,percentage:20,trend:'up'}))
  it('não cria percentagem infinita com base zero',()=>expect(calculateVariation(20,0)).toEqual({absolute:20,percentage:null,trend:'no_comparison_base'}))
})

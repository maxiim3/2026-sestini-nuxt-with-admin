import readXlsxFile from 'read-excel-file/universal'
import writeXlsxFile from 'write-excel-file/universal'
import type { Cell, Sheet } from '../services/backup-sheets'

/**
 * Lecture et écriture de classeurs .xlsx, en mémoire et en JavaScript pur
 * (versions « universal » : ni fichier temporaire, ni worker).
 */

const HEADER = { fontWeight: 'bold', backgroundColor: '#F5F5F4' } as const

export async function writeWorkbook(sheets: Sheet[]): Promise<Buffer> {
  const file = writeXlsxFile(sheets.map(sheet => ({
    sheet: sheet.name,
    columns: sheet.columns.map(c => ({ width: c.width })),
    stickyRowsCount: 1,
    data: [
      sheet.columns.map(c => ({ ...HEADER, value: c.header, type: String })),
      ...sheet.rows.map(row => row.map((value, i) => {
        if (value === null || value === undefined) return null
        if (typeof value === 'number') return { value, type: Number, format: sheet.columns[i]?.euros ? '0.00' : undefined }
        if (typeof value === 'boolean') return { value, type: Boolean }
        // Texte forcé : Excel ne transforme ni les dates, ni les heures, ni les codes postaux
        return { value: value instanceof Date ? value.toISOString() : value, type: String }
      })),
    ],
  })))
  return Buffer.from(await (await file.toBlob()).arrayBuffer())
}

export async function readWorkbook(data: Buffer): Promise<{ name: string, rows: Cell[][] }[]> {
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
  const sheets = await readXlsxFile(buffer)
  return sheets.map(sheet => ({ name: sheet.sheet, rows: sheet.data as Cell[][] }))
}

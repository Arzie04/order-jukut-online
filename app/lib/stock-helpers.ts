export interface StockLikeItem {
  nama_item: string;
  stok: number;
  status?: string;
}

function parseOrderCode(code: string) {
  const parts = code.trim().split(/\s+/);
  const prefix = parts[0] || '';
  const hasSbVariant = (prefix === 'PKT' || prefix === 'NP') && parts[parts.length - 1] === 'SB';
  const baseParts = hasSbVariant ? parts.slice(0, -1) : parts;

  return {
    prefix,
    itemCode: baseParts[1] || '',
    isNdj: baseParts.includes('NDJ'),
    variant: hasSbVariant ? 'SB' : 'SI',
  };
}

function normalizeStockName(name: string) {
  return name.trim().toUpperCase();
}

export function getRequiredStockNamesForMenuCode(code: string): string[] {
  const parsed = parseOrderCode(code);
  const required: string[] = [];

  const itemCodeMap: Record<string, string> = {
    PA: 'PAHA ATAS',
    PB: 'PAHA BAWAH',
    DD: 'DADA',
    SY: 'SAYAP',
    TD: 'TELUR DADAR',
    ATI: 'ATI AMPELA',
    KL: 'KULIT',
    TP: 'TEMPE',
    TH: 'TAHU',
    JK: 'JUKUT',
    TG: 'TERONG',
    KG: 'KOL',
    NDJ: 'NASI DAUN JERUK',
    NSP: 'NASI PUTIH',
    SI: 'SAMBAL IJO',
    SB: 'SAMBAL BAWANG',
  };

  const { prefix, itemCode, isNdj, variant } = parsed;

  if (itemCode === 'TT') {
    required.push('TAHU', 'TEMPE');
  } else if (itemCodeMap[itemCode]) {
    required.push(itemCodeMap[itemCode]);
  }

  if (prefix === 'PKT') {
    required.push(isNdj ? 'NASI DAUN JERUK' : 'NASI PUTIH');
    required.push('JUKUT');
    required.push(variant === 'SB' ? 'SAMBAL BAWANG' : 'SAMBAL IJO');
  }

  if (prefix === 'NP') {
    required.push('JUKUT');
    required.push(variant === 'SB' ? 'SAMBAL BAWANG' : 'SAMBAL IJO');
  }

  return Array.from(new Set(required.map(normalizeStockName)));
}

export function isMenuDisabledByStock(code: string, stock: StockLikeItem[]) {
  const requirements = getRequiredStockNamesForMenuCode(code);
  if (requirements.length === 0) return false;

  const stockMap = new Map(stock.map((item) => [normalizeStockName(item.nama_item), Number(item.stok || 0)]));
  return requirements.some((ingredient) => (stockMap.get(ingredient) || 0) <= 0);
}

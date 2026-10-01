import { NumberingConfig } from "../types";

export function toRomanNumeral(num: number): string {
  const romanMap: [number, string][] = [
    [12, "XII"],
    [11, "XI"],
    [10, "X"],
    [9, "IX"],
    [8, "VIII"],
    [7, "VII"],
    [6, "VI"],
    [5, "V"],
    [4, "IV"],
    [3, "III"],
    [2, "II"],
    [1, "I"],
  ];

  for (const [val, roman] of romanMap) {
    if (num === val) return roman;
  }
  return "I";
}

export function generateNextSKNumber(
  config: NumberingConfig,
  currentDate: Date = new Date()
): { formattedNumber: string; nextNumber: number } {
  const nextNum = (config.lastNumber || 0) + 1;
  const paddedNum = String(nextNum).padStart(3, "0");
  const monthRoman = toRomanNumeral(currentDate.getMonth() + 1);
  const yearStr = String(currentDate.getFullYear());

  let formatted = config.pattern || "[NOMOR]/[KODE_SEKOLAH]/[BULAN_ROMAWI]/[TAHUN]";
  formatted = formatted
    .replace("[NOMOR]", paddedNum)
    .replace("[KODE_SEKOLAH]", config.schoolCode || "SD.01")
    .replace("[BULAN_ROMAWI]", monthRoman)
    .replace("[TAHUN]", yearStr);

  return {
    formattedNumber: formatted,
    nextNumber: nextNum,
  };
}

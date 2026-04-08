import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanHistoryItem, ScannedProduct } from '../types/foodRating';

const HISTORY_KEY = 'noma_scan_history';

export async function saveToHistory(product: ScannedProduct): Promise<void> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  const history: ScanHistoryItem[] = raw ? JSON.parse(raw) : [];
  const filtered = history.filter((h) => h.product.barcode !== product.barcode);
  const updated = [{ product, scanned_at: new Date().toISOString() }, ...filtered].slice(0, 20);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export async function loadHistory(): Promise<ScanHistoryItem[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function formatScanTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

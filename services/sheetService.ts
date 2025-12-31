
// 此服務預設透過 Google Apps Script 作為中繼站與 Google Sheets 溝通
// 您需要先建立一個 Google Apps Script 並發布為 Web App

export interface SheetData {
  userName: string;
  totalHours: number;
  completionRate: number;
  lastUpdate: string;
  status: string;
}

export const syncToSheets = async (scriptUrl: string, data: SheetData) => {
  if (!scriptUrl) return;
  try {
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', // 使用 no-cors 模式處理簡單的 GAS POST
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    console.log('Successfully synced to Sheets');
  } catch (error) {
    console.error('Sheets Sync Error:', error);
  }
};

export const fetchGroupData = async (scriptUrl: string): Promise<SheetData[]> => {
  if (!scriptUrl) return [];
  try {
    const response = await fetch(scriptUrl);
    const data = await response.json();
    return data as SheetData[];
  } catch (error) {
    console.error('Fetch Group Error:', error);
    return [];
  }
};

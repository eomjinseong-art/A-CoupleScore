/*
  Google Apps Script for A-CoupleScore
  1) Google Sheets에서 새 스프레드시트 생성
  2) 시트 이름을 'Ads'로 설정
  3) A1:G1 칼럼명 아래와 같이 입력
      slot,product,hook,desc,url,order,active
  4) Apps Script 열기 -> 새 프로젝트 생성 -> 이 파일 전체 붙여넣기
  5) 배포 > 새 배포 > 웹 앱으로 배포
  6) '실행자: 본인 계정', '액세스: 누구나' 설정
  7) 생성된 URL을 app.html의 ADS_SHEET_CSV_URL 로 넣기

  예시 행:
  couple,데이트 코스 추천,오늘의 분위기에 어울리는 데이트,둘만의 리듬에 맞는 데이트 코스를 추천해드려요,https://example.com/date,1,TRUE
  male,활력 보충제,바쁜 일상 속 컨디션 회복,하루 피로를 줄이고 체력 유지에 도움을 줍니다,https://example.com/male-boost,2,TRUE
  female,여성용 컨디션 케어,기분과 컨디션을 함께 관리해요,몸과 마음의 균형을 챙기는 데일리 루틴,https://example.com/female-care,3,TRUE
  bottom,커플 다이어리,서로를 기록하는 작은 습관,하루 한 줄로 관계를 더 가깝게 만들어요,https://example.com/diary,4,TRUE
*/

const SPREADSHEET_ID = '17XfJg8JtFxOylUJOIJ1R21NWSK4H_DZ0qG2YaM3-Yig';
const ADS_SHEET_NAME = 'Ads';

function doGet(e) {
  const format = (e && e.parameter && e.parameter.format) ? String(e.parameter.format).toLowerCase() : 'csv';
  const rows = getAdsRows();

  if (format === 'json') {
    return ContentService
      .createTextOutput(JSON.stringify(rows, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const csv = toCsv(rows);
  return ContentService
    .createTextOutput(csv)
    .setMimeType(ContentService.MimeType.CSV);
}

function getAdsRows() {
  let spreadsheet;
  try {
    spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (error) {
    return [];
  }

  const sheet = spreadsheet.getSheetByName(ADS_SHEET_NAME) || spreadsheet.getSheets()[0];
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return [];

  const headers = values[0].map((cell) => String(cell).trim().toLowerCase());
  const headerIndex = {};
  headers.forEach((header, index) => {
    headerIndex[header] = index;
  });

  const required = ['slot', 'product', 'hook', 'desc', 'url'];
  const missing = required.filter((key) => headerIndex[key] === undefined);
  if (missing.length > 0) {
    throw new Error('필수 컬럼이 없습니다: ' + missing.join(', '));
  }

  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const slot = String(row[headerIndex.slot] ?? '').trim();
    const product = String(row[headerIndex.product] ?? '').trim();
    const hook = String(row[headerIndex.hook] ?? '').trim();
    const desc = String(row[headerIndex.desc] ?? '').trim();
    const url = String(row[headerIndex.url] ?? '').trim();
    const orderRaw = row[headerIndex.order] ?? '999';
    const activeRaw = row[headerIndex.active] ?? 'TRUE';

    if (!slot || !product || !url) continue;

    const order = Number(orderRaw);
    const active = String(activeRaw).toUpperCase() !== 'FALSE' && String(activeRaw).toUpperCase() !== 'N' && String(activeRaw).toUpperCase() !== 'NO';

    if (!active) continue;

    rows.push({
      slot,
      product,
      hook,
      desc,
      url,
      order: Number.isFinite(order) ? order : 999
    });
  }

  rows.sort((a, b) => a.order - b.order);
  return rows;
}

function toCsv(rows) {
  const headers = ['slot', 'product', 'hook', 'desc', 'url', 'order'];
  const csvRows = [headers.join(',')];

  rows.forEach((row) => {
    const values = headers.map((header) => {
      let value = row[header];
      if (typeof value === 'undefined' || value === null) value = '';
      value = String(value);
      value = value.replace(/"/g, '""');
      return '"' + value + '"';
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

function doPost(e) {
  return doGet(e);
}

function testAdsExport() {
  const rows = getAdsRows();
  console.log('rows', rows.length);
  console.log(toCsv(rows).slice(0, 500));
}

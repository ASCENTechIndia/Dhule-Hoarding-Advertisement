const path = require('path');
const fs = require('fs').promises;
const { repoGetNoticeById, repoSaveNotice, repoGetCorporationInfo } = require('./notice.repo');

const TEMPLATE_PATH = path.join(__dirname, 'notice.template.html');

async function getSidebarLogoBase64() {
  const logoPaths = [
    path.join(__dirname, 'dhule-logo.png'),
    path.join(__dirname, '..', '..', '..', '..', 'Dhule-Hoarding-Advertisement GUI', 'public', 'assets', 'images', 'dhule-logo.png'),
  ];
  for (const p of logoPaths) {
    try {
      const buf = await fs.readFile(p);
      if (buf && buf.length > 0) {
        return `data:image/png;base64,${buf.toString('base64')}`;
      }
    } catch (e) {}
  }
  return '';
}

async function renderNoticeHtmlService(data = {}) {
  let templateContent = await fs.readFile(TEMPLATE_PATH, 'utf-8');

  const corpId = data.corporationId || data.corpId || data.ulbId || data.num_illegalhoard_ulbid || data.NUM_ILLEGALHOARD_ULBID || 4;
  let corpInfo = null;
  if (corpId) {
    try {
      corpInfo = await repoGetCorporationInfo(corpId);
    } catch (err) {
      console.error('Error fetching corporation info:', err.message);
    }
  }

  const sidebarLogoBase64 = await getSidebarLogoBase64();

  const logoValue = data.corporationLogo || data.logo || corpInfo?.corporationLogo || sidebarLogoBase64;
  const corpNameValue = data.corporationName || data.corporation_name || corpInfo?.corporationName || 'धुळे महानगरपालिका';

  const sizeValue = data.SIZE || data.size || (
    (data.NUM_SIZE_LENGTH || data.num_size_length) && (data.NUM_SIZE_WIDTH || data.num_size_width)
      ? `${data.NUM_SIZE_LENGTH || data.num_size_length} x ${data.NUM_SIZE_WIDTH || data.num_size_width}`
      : ''
  );

  const replacements = {
    corporationLogo: logoValue,
    corporationName: corpNameValue,
    REGIONAL_OFFICE_NO: data.REGIONAL_OFFICE_NO || data.regional_office_no || data.regionalOfficeNo || data.NUM_ILLEGALHOARD_ULBID || data.num_illegalhoard_ulbid || '',
    ADVERTISER_NAME: data.ADVERTISER_NAME || data.advertiser_name || data.advertiserName || data.VAR_ADVERTISER_NAME || data.var_advertiser_name || '',
    ADDRESS: data.ADDRESS || data.address || data.VAR_ILLEGALHOARD_ADD || data.var_illegalhoard_add || '',
    LATITUDE: data.LATITUDE || data.latitude || '',
    LONGITUDE: data.LONGITUDE || data.longitude || '',
    SIZE: sizeValue,
    FROM_DATE: data.FROM_DATE || data.from_date || data.fromDate || data.DAT_FROM_DT || data.dat_from_dt || '',
    TO_DATE: data.TO_DATE || data.to_date || data.toDate || data.DAT_TO_DT || data.dat_to_dt || '',
    AMOUNT: data.AMOUNT || data.amount || data.NUM_HOARD_AMOUNT || data.num_hoard_amount || '',
    OFFICER_NAME: data.OFFICER_NAME || data.officer_name || data.officerName || data.VAR_USER1 || data.var_user1 || '',
    OFFICER_DESIGNATION: data.OFFICER_DESIGNATION || data.officer_designation || data.officerDesignation || data.VAR_USER1_POST || data.var_user1_post || '',
    REGIONAL_OFFICE: data.REGIONAL_OFFICE || data.regional_office || data.regionalOffice || data.VAR_ILLEGALHOARD_WARD || data.var_illegalhoard_ward || '',
  };

  Object.entries(replacements).forEach(([key, val]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    templateContent = templateContent.replace(regex, val !== null && val !== undefined ? String(val) : '');
  });

  return templateContent;
}

async function getNoticeByIdService(id) {
  const dbData = await repoGetNoticeById(id);
  const data = dbData || {};
  const html = await renderNoticeHtmlService(data);
  return { data, html };
}

async function generateNoticeService(payload) {
  let dbData = null;
  const noticeId = payload.id || payload.NUM_ILLEGALHOARD_ID || payload.num_illegalhoard_id;
  if (noticeId) {
    dbData = await repoGetNoticeById(noticeId);
  }
  const mergedData = { ...(dbData || {}), ...payload };

  const procResult = await repoSaveNotice(mergedData);
  const html = await renderNoticeHtmlService(mergedData);
  return { procResult, payload: mergedData, html };
}

module.exports = {
  renderNoticeHtmlService,
  getNoticeByIdService,
  generateNoticeService,
};

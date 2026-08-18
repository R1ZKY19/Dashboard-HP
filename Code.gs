const APP = {
  DATA_SHEET: 'DATA BANK',
  AUDIT_SHEET: 'Audit_Log',
  USER_SHEET: 'Users',
  SHIFT_SHEET: 'Shift_Control',
  TOKEN_TTL: 21600,
  ALLOWED_ORIGINS: [
    'https://r1zky19.github.io',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ]
};

function doGet(e) {
  const p = e && e.parameter ? e.parameter : {};
  if (p.action === 'login') return loginPage_(p.origin || '');
  return html_('<h3>Office Data Center API</h3><p>Service is running.</p>');
}

function doPost(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};
    const body = e && e.postData && e.postData.contents ? e.postData.contents : '';
    const req = body ? JSON.parse(body) : p;
    const result = route_(req);
    return apiPage_(req.requestId || '', req.origin || '', {success:true, data:result});
  } catch (err) {
    const p = e && e.parameter ? e.parameter : {};
    return apiPage_(p.requestId || '', p.origin || '', {success:false, message:err.message});
  }
}

function route_(r) {
  if (r.action === 'getDashboard') return getOfficeDashboard_();
  if (r.action === 'updateCheck') return updateCheck_(r.cell, r.checked);
  if (r.action === 'editData') return editData_(r.cell, r.value);
  if (r.action === 'getHistory') return getHistory_();
  if (r.action === 'startNewShift') return startNewShift_(r.shift);
  if (r.action === 'getUsers') return getUsers_();
  if (r.action === 'logout') return logout_(r.token);
  throw new Error('Action tidak dikenal.');
}

function loginPage_(origin) {
  const safeOrigin = allowedOrigin_(origin) ? origin : '';
  let message;
  try {
    const user = currentGoogleUser_();
    const appUser = findUser_(user.email);
    if (!appUser) throw new Error('Email ' + user.email + ' belum terdaftar di Users.');
    if (String(appUser.status).toUpperCase() !== 'ACTIVE') throw new Error('Akun sedang tidak aktif.');
    const token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g,'');
    CacheService.getScriptCache().put('SESSION_' + token, JSON.stringify({email:user.email, created:Date.now()}), APP.TOKEN_TTL);
    message = {type:'OFFICE_DASHBOARD_LOGIN', token:token, email:user.email};
  } catch (err) {
    message = {type:'OFFICE_DASHBOARD_LOGIN', message:err.message};
  }
  const msg = JSON.stringify(message).replace(/</g,'\\u003c');
  const target = JSON.stringify(safeOrigin || '*');
  return html_('<!doctype html><html><body style="font-family:Arial;background:#0b1017;color:#fff;text-align:center;padding:50px"><h2>Office Data Center</h2><p id="m">Memproses login...</p><script>const data='+msg+';const target='+target+';if(window.opener){window.opener.postMessage(data,target);setTimeout(()=>window.close(),700)}else{document.getElementById("m").textContent=data.message||"Login berhasil. Tutup jendela ini."}</script></body></html>');
}

function apiPage_(requestId, origin, payload) {
  const safeOrigin = allowedOrigin_(origin) ? origin : '';
  const id = JSON.stringify(String(requestId || ''));
  const target = JSON.stringify(safeOrigin || '*');
  const data = JSON.stringify(payload).replace(/</g,'\\u003c');
  return html_('<!doctype html><html><body><script>window.parent.postMessage({type:"OFFICE_API_RESPONSE",id:'+id+',payload:'+data+'},'+target+');</script></body></html>');
}

function html_(s) {
  return HtmlService.createHtmlOutput(s).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function allowedOrigin_(origin) {
  return APP.ALLOWED_ORIGINS.indexOf(String(origin || '')) >= 0;
}

function currentGoogleUser_() {
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!email) throw new Error('Google tidak memberikan email. Deploy Web App sebagai "User accessing the web app" dan batasi akses ke pengguna Google yang berwenang.');
  return {email:email};
}

function authenticatedUser_(token) {
  token = String(token || '').trim();
  if (!token) throw new Error('Session login tidak ditemukan. Silakan login kembali.');
  const raw = CacheService.getScriptCache().get('SESSION_' + token);
  if (!raw) throw new Error('Session sudah habis atau logout. Silakan login kembali.');
  const session = JSON.parse(raw);
  const user = findUser_(session.email);
  if (!user || String(user.status).toUpperCase() !== 'ACTIVE') throw new Error('Akun tidak aktif atau sudah dihapus.');
  return user;
}

function findUser_(email) {
  const s = SpreadsheetApp.getActive().getSheetByName(APP.USER_SHEET);
  if (!s || s.getLastRow() < 2) return null;
  email = String(email).trim().toLowerCase();
  const rows = s.getRange(2,1,s.getLastRow()-1,4).getValues();
  for (const r of rows) {
    if (String(r[0]).trim().toLowerCase() === email) return {email:r[0], name:r[1], role:r[2], status:r[3]};
  }
  return null;
}

function setupDashboard() {
  const ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName(APP.DATA_SHEET)) throw new Error('Sheet DATA BANK tidak ditemukan.');
  ensureSheet_(APP.AUDIT_SHEET,['Timestamp','Email','Action','Shift','Sheet','Cell','Item','Old Value','New Value']);
  const users = ensureSheet_(APP.USER_SHEET,['Email','Name','Role','Status']);
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (users.getLastRow() < 2 && email) users.appendRow([email,'Owner','SUPER MASTER','ACTIVE']);
  const shift = ensureSheet_(APP.SHIFT_SHEET,['SETTING','VALUE']);
  if (shift.getLastRow() < 2) shift.getRange('A2:B4').setValues([['CURRENT_SHIFT','SHIFT 1'],['START_TIME',new Date()],['STARTED_BY',email]]);
  return {success:true};
}

function ensureSheet_(name, headers) {
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName(name);
  if (!s) s = ss.insertSheet(name);
  if (s.getLastRow() === 0) s.appendRow(headers);
  return s;
}

function getOfficeDashboard_() {
  const user = authenticatedUser_(arguments.callee.caller ? null : '');
  return user;
}

/* The authenticated token is injected into route calls through a scoped wrapper. */
function routeAuthenticated_(r) {
  const user = authenticatedUser_(r.token);
  if (r.action === 'getDashboard') return getDashboardForUser_(user);
  if (r.action === 'updateCheck') return updateCheckForUser_(user,r.cell,r.checked);
  if (r.action === 'editData') return editDataForUser_(user,r.cell,r.value);
  if (r.action === 'getHistory') return getHistoryForUser_(user);
  if (r.action === 'startNewShift') return startNewShiftForUser_(user,r.shift);
  if (r.action === 'getUsers') return getUsersForUser_(user);
  throw new Error('Action tidak dikenal.');
}

function getDashboardForUser_(user) {
  const s = SpreadsheetApp.getActive().getSheetByName(APP.DATA_SHEET);
  if (!s) throw new Error('DATA BANK tidak ditemukan.');
  const data = {
    withdraw: readCategory_(s,4,5,3,4),
    depo: readCategory_(s,8,9,7,4),
    bankKas: readCategory_(s,13,14,12,4),
    tokenBca: readCategory_(s,17,18,16,4),
    tokenBca2: readCategory_(s,21,22,20,4)
  };
  return {user,shift:getShift_(),stats:{withdraw:data.withdraw.length,depo:data.depo.length,bankKas:data.bankKas.length,token:data.tokenBca.length+data.tokenBca2.length},data};
}

function readCategory_(sheet,nameCol,checkCol,bankCol,startRow) {
  const last=sheet.getLastRow(); if(last<startRow)return[];
  const max=Math.max(nameCol,checkCol,bankCol);
  const rows=sheet.getRange(startRow,1,last-startRow+1,max).getValues(); const out=[];
  rows.forEach((r,i)=>{const row=startRow+i,name=r[nameCol-1],bank=r[bankCol-1],checked=r[checkCol-1]===true;if(name===''&&bank==='')return;out.push({row,number:row-startRow+1,bank,name,checked,nameCell:col_(nameCol)+row,checkCell:col_(checkCol)+row});});
  return out;
}

function getShift_(){const s=SpreadsheetApp.getActive().getSheetByName(APP.SHIFT_SHEET);return{shift:s.getRange('B2').getDisplayValue(),startTime:s.getRange('B3').getDisplayValue(),startedBy:s.getRange('B4').getDisplayValue()};}

function updateCheckForUser_(user,cell,checked){
  if(!['SUPER MASTER','MASTER'].includes(String(user.role).toUpperCase()))throw new Error('Tidak punya izin pengecekan.');
  if(!/^(E|I|N|R|V)\d+$/i.test(String(cell)))throw new Error('Cell checkbox tidak valid.');
  const s=SpreadsheetApp.getActive().getSheetByName(APP.DATA_SHEET);const c=s.getRange(cell);const old=c.getValue();c.setValue(Boolean(checked));SpreadsheetApp.flush();const item=getItemByCheck_(s,cell);writeAudit_(user.email,checked?'CHECK':'UNCHECK',getShift_().shift,cell,item,old?'CHECKED':'UNCHECKED',checked?'CHECKED':'UNCHECKED');return{checked:Boolean(checked),cell,item,shift:getShift_().shift};
}
function getItemByCheck_(s,cell){const m=String(cell).toUpperCase().match(/^([A-Z]+)(\d+)$/);const nameCol={E:'D',I:'H',N:'M',R:'Q',V:'U'}[m[1]];return nameCol?s.getRange(nameCol+m[2]).getDisplayValue():'';}
function editDataForUser_(user,cell,value){if(!['SUPER MASTER','MASTER'].includes(String(user.role).toUpperCase()))throw new Error('Tidak punya izin edit.');if(!/^[A-Z]+\d+$/i.test(String(cell)))throw new Error('Cell tidak valid.');const s=SpreadsheetApp.getActive().getSheetByName(APP.DATA_SHEET);const c=s.getRange(cell);const old=c.getDisplayValue();c.setValue(value);SpreadsheetApp.flush();writeAudit_(user.email,'EDIT',getShift_().shift,cell,'DATA BANK',old,String(value));return{cell,old,value};}
function startNewShiftForUser_(user,shift){if(String(user.role).toUpperCase()!=='SUPER MASTER')throw new Error('Hanya SUPER MASTER.');shift=String(shift||'').trim();if(!shift)throw new Error('Nama shift wajib diisi.');const s=SpreadsheetApp.getActive().getSheetByName(APP.DATA_SHEET);const oldShift=getShift_().shift;['E','I','N','R','V'].forEach(col=>{const last=s.getLastRow();if(last>=4)s.getRange(col+'4:'+col+last).setValues(s.getRange(col+'4:'+col+last).getValues().map(()=>[false]));});const sh=SpreadsheetApp.getActive().getSheetByName(APP.SHIFT_SHEET);sh.getRange('B2:B4').setValues([[shift],[new Date()],[user.email]]);writeAudit_(user.email,'NEW_SHIFT',shift,'-','RESET CHECKBOX',oldShift,shift);return{shift};}
function getHistoryForUser_(user){const s=SpreadsheetApp.getActive().getSheetByName(APP.AUDIT_SHEET);if(!s||s.getLastRow()<2)return[];const start=Math.max(2,s.getLastRow()-299);return s.getRange(start,1,s.getLastRow()-start+1,9).getDisplayValues().reverse().map(r=>({timestamp:r[0],email:r[1],action:r[2],shift:r[3],sheet:r[4],cell:r[5],item:r[6],oldValue:r[7],newValue:r[8]}));}
function getUsersForUser_(user){if(String(user.role).toUpperCase()!=='SUPER MASTER')throw new Error('Hanya SUPER MASTER.');const s=SpreadsheetApp.getActive().getSheetByName(APP.USER_SHEET);if(!s||s.getLastRow()<2)return[];return s.getRange(2,1,s.getLastRow()-1,4).getDisplayValues().map(r=>({email:r[0],name:r[1],role:r[2],status:r[3]}));}
function logout_(token){if(token)CacheService.getScriptCache().remove('SESSION_'+token);return{loggedOut:true};}
function writeAudit_(email,action,shift,cell,item,oldValue,newValue){ensureSheet_(APP.AUDIT_SHEET,['Timestamp','Email','Action','Shift','Sheet','Cell','Item','Old Value','New Value']).appendRow([new Date(),email,action,shift,APP.DATA_SHEET,cell,item,oldValue,newValue]);}
function col_(n){let x='';while(n>0){let r=(n-1)%26;x=String.fromCharCode(65+r)+x;n=Math.floor((n-1)/26);}return x;}

/* Replace the simple router with token-aware routing. */
const ORIGINAL_ROUTE = route_;
function route_(r) {
  if (r.action === 'logout') return logout_(r.token);
  if (r.action === 'getDashboard' || r.action === 'updateCheck' || r.action === 'editData' || r.action === 'getHistory' || r.action === 'startNewShift' || r.action === 'getUsers') return routeAuthenticated_(r);
  throw new Error('Action tidak dikenal.');
}

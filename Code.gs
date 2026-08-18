const APP = {
  DATA_SHEET: 'DATA BANK',
  AUDIT_SHEET: 'Audit_Log',
  USER_SHEET: 'Users',
  SHIFT_SHEET: 'Shift_Control',
  TOKEN_TTL: 21600,
  ALLOWED_ORIGINS: ['https://r1zky19.github.io','http://localhost:5500','http://127.0.0.1:5500']
};

function doGet() {
  return html_('<!doctype html><html><body style="font-family:Arial;background:#080c12;color:#fff;text-align:center;padding:60px"><h2>Office Data Center API</h2><p>API aktif. Buka dashboard melalui GitHub Pages.</p></body></html>');
}

function doPost(e) {
  const p = e && e.parameter ? e.parameter : {};
  try {
    const result = route_(p);
    return apiPage_(p.requestId || '', p.origin || '', {success:true, data:result});
  } catch (err) {
    return apiPage_(p.requestId || '', p.origin || '', {success:false, message:err.message});
  }
}

function route_(r) {
  const action = String(r.action || '').trim();
  if (action === 'login') return login_(r.email);
  if (action === 'logout') return logout_(r.token);
  if (['getDashboard','updateCheck','editData','getHistory','startNewShift','getUsers'].indexOf(action) >= 0) return routeAuthenticated_(r);
  throw new Error('Action tidak dikenal: ' + action);
}

function login_(email) {
  email = String(email || '').trim().toLowerCase();
  if (!email) throw new Error('Email wajib diisi.');
  const user = findUser_(email);
  if (!user) throw new Error('Email belum terdaftar di Users.');
  if (String(user.status).trim().toUpperCase() !== 'ACTIVE') throw new Error('Akun sedang tidak aktif.');
  const token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g,'');
  CacheService.getScriptCache().put('SESSION_' + token, JSON.stringify({email:user.email,created:Date.now()}), APP.TOKEN_TTL);
  writeAudit_(user.email,'LOGIN',getShift_().shift,'-','LOGIN','','SUCCESS');
  return {token:token,user:{email:user.email,name:user.name,role:user.role}};
}

function logout_(token) {
  token = String(token || '').trim();
  if (token) CacheService.getScriptCache().remove('SESSION_' + token);
  return {loggedOut:true};
}

function routeAuthenticated_(r) {
  const user = authenticatedUser_(r.token);
  switch (r.action) {
    case 'getDashboard': return getDashboardForUser_(user);
    case 'updateCheck': return updateCheckForUser_(user,r.cell,r.checked);
    case 'editData': return editDataForUser_(user,r.cell,r.value);
    case 'getHistory': return getHistoryForUser_(user);
    case 'startNewShift': return startNewShiftForUser_(user,r.shift);
    case 'getUsers': return getUsersForUser_(user);
  }
  throw new Error('Action tidak dikenal.');
}

function authenticatedUser_(token) {
  token = String(token || '').trim();
  if (!token) throw new Error('Session login tidak ditemukan. Silakan login kembali.');
  const raw = CacheService.getScriptCache().get('SESSION_' + token);
  if (!raw) throw new Error('Session sudah habis atau logout. Silakan login kembali.');
  const session = JSON.parse(raw);
  const user = findUser_(session.email);
  if (!user || String(user.status).trim().toUpperCase() !== 'ACTIVE') throw new Error('Akun tidak aktif atau sudah dihapus.');
  return user;
}

function findUser_(email) {
  const s = SpreadsheetApp.getActive().getSheetByName(APP.USER_SHEET);
  if (!s || s.getLastRow() < 2) return null;
  email = String(email || '').trim().toLowerCase();
  const rows = s.getRange(2,1,s.getLastRow()-1,4).getValues();
  for (const r of rows) {
    if (String(r[0] || '').trim().toLowerCase() === email) return {email:r[0],name:r[1],role:r[2],status:r[3]};
  }
  return null;
}

function getDashboardForUser_(user) {
  const s = SpreadsheetApp.getActive().getSheetByName(APP.DATA_SHEET);
  if (!s) throw new Error('DATA BANK tidak ditemukan.');
  const data = {
    withdraw:readCategory_(s,4,5,3,4),
    depo:readCategory_(s,8,9,7,4),
    bankKas:readCategory_(s,13,14,12,4),
    tokenBca:readCategory_(s,17,18,16,4),
    tokenBca2:readCategory_(s,21,22,20,4)
  };
  return {user:{email:user.email,name:user.name,role:user.role},shift:getShift_(),stats:{withdraw:data.withdraw.length,depo:data.depo.length,bankKas:data.bankKas.length,token:data.tokenBca.length+data.tokenBca2.length},data:data};
}

function readCategory_(sheet,nameCol,checkCol,bankCol,startRow) {
  const last=sheet.getLastRow();
  if(last<startRow)return[];
  const max=Math.max(nameCol,checkCol,bankCol);
  const rows=sheet.getRange(startRow,1,last-startRow+1,max).getValues();
  const out=[];
  rows.forEach(function(r,i){
    const row=startRow+i,name=r[nameCol-1],bank=r[bankCol-1],checked=r[checkCol-1]===true;
    if(name===''&&bank==='')return;
    out.push({row:row,number:row-startRow+1,bank:bank,name:name,checked:checked,nameCell:col_(nameCol)+row,checkCell:col_(checkCol)+row});
  });
  return out;
}

function getShift_() {
  const s=SpreadsheetApp.getActive().getSheetByName(APP.SHIFT_SHEET);
  if(!s)throw new Error('Shift_Control belum dibuat. Jalankan setupDashboard().');
  return {shift:s.getRange('B2').getDisplayValue(),startTime:s.getRange('B3').getDisplayValue(),startedBy:s.getRange('B4').getDisplayValue()};
}

function updateCheckForUser_(user,cell,checked) {
  if(!['SUPER MASTER','MASTER'].includes(String(user.role).toUpperCase()))throw new Error('Tidak punya izin pengecekan.');
  if(!/^(E|I|N|R|V)\d+$/i.test(String(cell)))throw new Error('Cell checkbox tidak valid.');
  const s=SpreadsheetApp.getActive().getSheetByName(APP.DATA_SHEET),c=s.getRange(cell),old=c.getValue();
  const value=String(checked).toLowerCase()==='true'||checked===true;
  c.setValue(value);SpreadsheetApp.flush();
  const item=getItemByCheck_(s,cell);
  writeAudit_(user.email,value?'CHECK':'UNCHECK',getShift_().shift,cell,item,old?'CHECKED':'UNCHECKED',value?'CHECKED':'UNCHECKED');
  return {checked:value,cell:cell,item:item,shift:getShift_().shift};
}

function getItemByCheck_(s,cell) {
  const m=String(cell).toUpperCase().match(/^([A-Z]+)(\d+)$/);if(!m)return'';
  const nameCol={E:'D',I:'H',N:'M',R:'Q',V:'U'}[m[1]];
  return nameCol?s.getRange(nameCol+m[2]).getDisplayValue():'';
}

function editDataForUser_(user,cell,value) {
  if(!['SUPER MASTER','MASTER'].includes(String(user.role).toUpperCase()))throw new Error('Tidak punya izin edit.');
  if(!/^[A-Z]+\d+$/i.test(String(cell)))throw new Error('Cell tidak valid.');
  const s=SpreadsheetApp.getActive().getSheetByName(APP.DATA_SHEET),c=s.getRange(cell),old=c.getDisplayValue();
  c.setValue(value);SpreadsheetApp.flush();
  writeAudit_(user.email,'EDIT',getShift_().shift,cell,'DATA BANK',old,String(value));
  return {cell:cell,oldValue:old,newValue:String(value)};
}

function startNewShiftForUser_(user,shift) {
  if(String(user.role).toUpperCase()!=='SUPER MASTER')throw new Error('Hanya SUPER MASTER.');
  shift=String(shift||'').trim();if(!shift)throw new Error('Nama shift wajib diisi.');
  const s=SpreadsheetApp.getActive().getSheetByName(APP.DATA_SHEET),oldShift=getShift_().shift;
  ['E','I','N','R','V'].forEach(function(col){const last=s.getLastRow();if(last>=4)s.getRange(col+'4:'+col+last).setValues(s.getRange(col+'4:'+col+last).getValues().map(function(){return[false]}));});
  const sh=SpreadsheetApp.getActive().getSheetByName(APP.SHIFT_SHEET);sh.getRange('B2:B4').setValues([[shift],[new Date()],[user.email]]);
  writeAudit_(user.email,'NEW_SHIFT',shift,'-','RESET CHECKBOX',oldShift,shift);return{shift:shift};
}

function getHistoryForUser_() {
  const s=SpreadsheetApp.getActive().getSheetByName(APP.AUDIT_SHEET);if(!s||s.getLastRow()<2)return[];
  const start=Math.max(2,s.getLastRow()-299);
  return s.getRange(start,1,s.getLastRow()-start+1,9).getDisplayValues().reverse().map(function(r){return{timestamp:r[0],email:r[1],action:r[2],shift:r[3],sheet:r[4],cell:r[5],item:r[6],oldValue:r[7],newValue:r[8]};});
}

function getUsersForUser_(user) {
  if(String(user.role).toUpperCase()!=='SUPER MASTER')throw new Error('Hanya SUPER MASTER.');
  const s=SpreadsheetApp.getActive().getSheetByName(APP.USER_SHEET);if(!s||s.getLastRow()<2)return[];
  return s.getRange(2,1,s.getLastRow()-1,4).getDisplayValues().map(function(r){return{email:r[0],name:r[1],role:r[2],status:r[3]};});
}

function writeAudit_(email,action,shift,cell,item,oldValue,newValue) {
  ensureSheet_(APP.AUDIT_SHEET,['Timestamp','Email','Action','Shift','Sheet','Cell','Item','Old Value','New Value']).appendRow([new Date(),email,action,shift,APP.DATA_SHEET,cell,item,oldValue,newValue]);
}

function setupDashboard() {
  const ss=SpreadsheetApp.getActive();
  if(!ss.getSheetByName(APP.DATA_SHEET))throw new Error('Sheet DATA BANK tidak ditemukan.');
  ensureSheet_(APP.AUDIT_SHEET,['Timestamp','Email','Action','Shift','Sheet','Cell','Item','Old Value','New Value']);
  const users=ensureSheet_(APP.USER_SHEET,['Email','Name','Role','Status']);
  if(users.getLastRow()<2)users.appendRow(['email-kamu@gmail.com','Nama','SUPER MASTER','ACTIVE']);
  const shift=ensureSheet_(APP.SHIFT_SHEET,['SETTING','VALUE']);
  if(shift.getLastRow()<2)shift.getRange('A2:B4').setValues([['CURRENT_SHIFT','SHIFT 1'],['START_TIME',new Date()],['STARTED_BY','SYSTEM']]);
  return{success:true,message:'Setup selesai.'};
}

function ensureSheet_(name,headers) {
  const ss=SpreadsheetApp.getActive();let s=ss.getSheetByName(name);if(!s)s=ss.insertSheet(name);if(s.getLastRow()===0)s.appendRow(headers);return s;
}

function col_(n) {let x='';while(n>0){const r=(n-1)%26;x=String.fromCharCode(65+r)+x;n=Math.floor((n-1)/26);}return x;}

function apiPage_(requestId,origin,payload) {
  const safe=allowedOrigin_(origin)?origin:'*';
  const id=JSON.stringify(String(requestId||''));
  const target=JSON.stringify(safe);
  const data=JSON.stringify(payload).replace(/</g,'\\u003c');
  const html='<!doctype html><html><body><script>window.parent.postMessage({type:"OFFICE_API_RESPONSE",id:'+id+',payload:'+data+'},'+target+');</script></body></html>';
  return html_(html);
}

function allowedOrigin_(origin){return APP.ALLOWED_ORIGINS.indexOf(String(origin||''))>=0;}
function html_(s){return HtmlService.createHtmlOutput(s).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);}

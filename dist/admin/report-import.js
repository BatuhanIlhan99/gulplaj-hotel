(function(root){
  'use strict';
  const columns=['reservation_id','hr_number','completed_at','updated_at','checkin_date','checkout_date','state','channel','channel_display','currency','total','paid_amount','total_rooms','total_guests'];
  function parse(text){
    if(typeof text!=='string'||text.length>250000)throw Error('Dosya en fazla 250 KB olabilir.');
    text=text.replace(/^\ufeff/,'');const first=text.split(/\r?\n/)[0],separator=first.includes(';')?';':',';
    const rows=[];let row=[],field='',quoted=false;
    for(let i=0;i<text.length;i++){
      const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
      else if(c===separator&&!quoted){row.push(field);field='';}
      else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);field='';if(row.some(v=>v.trim()))rows.push(row);row=[];if(rows.length>501)throw Error('Bir aktarımda en fazla 500 kayıt olabilir.');}
      else field+=c;
    }
    if(quoted)throw Error('CSV tırnakları tamamlanmamış.');if(field||row.length){row.push(field);if(row.some(v=>v.trim()))rows.push(row);}
    const headers=(rows.shift()||[]).map(v=>v.trim().toLowerCase());if(new Set(headers).size!==headers.length)throw Error('Yinelenen sütun başlığı.');
    for(const key of columns.filter(k=>!['paid_amount','channel_display'].includes(k)))if(!headers.includes(key))throw Error('Dosya şablonuyla eşleşmiyor. Eksik sütun: '+key);
    if(!rows.length||rows.length>500)throw Error('Dosyada 1–500 rezervasyon bulunmalıdır.');
    return rows.map(values=>{if(values.length!==headers.length)throw Error('Sütun sayıları eşleşmiyor.');const record={};for(const key of columns){const index=headers.indexOf(key),value=index<0?'':values[index].trim();record[key]=['total_rooms','total_guests'].includes(key)?Number(value):key==='paid_amount'&&!value?null:value;}return record;});
  }
  const api={columns,parse,template:()=>columns.join(';')+'\r\n'};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.GulplajReportImport=Object.freeze(api);
})(typeof window==='undefined'?globalThis:window);

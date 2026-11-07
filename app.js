/* 花朵庫存統計站 · Zero-build frontend · local demo + optional Supabase */
(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY='flower-station-shared-demo-v1', CONFIG='flower-station-shared-config'; const SESSION='flower-station-shared-session'; const DEFAULT_URL='https://uvdijjktingslobyxodu.supabase.co';
const defaults=['玩家1','玩家2','玩家3','玩家4'];
const common={'精華':'普白','白色精華':'普白','黃色精華':'普黃','紅色精華':'普紅','藍色精華':'普藍','白精華':'普白','黃精華':'普黃','紅精華':'普紅','藍精華':'普藍'};
const flowerSeeds=['天竺葵','鼠尾草','銀蓮花','風鈴草','九重葛','海芋','山茶花','美人蕉','油菜花','康乃馨','嘉德麗雅蘭','鐵線蓮','彼岸花','鈴蘭','大波斯菊','兔耳花','大理花','石竹','曇花','風鈴草','小蒼蘭','龍膽','玫瑰','鬱金香','風信子','百合','向日葵','蘭花','水仙','雛菊','繡球花','櫻花','梅花','牡丹','薰衣草','仙客來','丁香','波斯菊','三色菫','睡蓮','洋桔梗','百日草','秋海棠','茶花'];
let state={players:[...defaults],items:{},history:[]}, sb=null, user=null, token=localStorage.getItem(SESSION)||'', page='dashboard', activeTab='text', preview=[], fileSelection=[], busy=false, editContext=null, toastTimer=null;
function toast(msg,error=false){const el=$('#toast');el.textContent=msg;el.className='toast show'+(error?' error':'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.className='toast',4400)}
function nfmt(n){return n===null||n===undefined?'—':Number(n).toLocaleString('en-US')}
function parseNum(v){if(v===null||v===undefined||String(v).trim()==='')return null;let s=String(v).replace(/[,，\s]/g,'');if(!/^\d+$/.test(s)||Number(s)>9999999)return undefined;return Number(s)}
function canonical(raw){let s=String(raw||'').replace(/[\s\u200b\u3000]/g,'').replace(/[：:]/g,'').trim();if(!s)return '';if(common[s])return common[s];s=s.replace(/^白(?=[^色])/,'白色').replace(/^黃(?=[^色])/,'黃色').replace(/^紅(?=[^色])/,'紅色').replace(/^藍(?=[^色])/,'藍色');if(common[s])return common[s];if(/^([白黃紅藍])色精華$/.test(s))return common[s];return s}
function colorOf(name){if(name.startsWith('普'))return({'普白':'白','普黃':'黃','普紅':'紅','普藍':'藍'})[name]||'白';return /^([白黃紅藍])色/.exec(name)?.[1]||''}
function saveLocal(){localStorage.setItem(KEY,JSON.stringify(state))}
function loadLocal(){try{const data=JSON.parse(localStorage.getItem(KEY));if(data&&data.items&&Array.isArray(data.players)){state={players:data.players.length?data.players:[...defaults],items:data.items,history:Array.isArray(data.history)?data.history:[]}}}catch(e){console.warn(e)}}
function getItem(player,name){return state.items[`${player}::${name}`]||null}
function allNames(){return [...new Set(Object.values(state.items).map(i=>i.flower))].sort((a,b)=>a.localeCompare(b,'zh-Hant'))}
function timeText(v){if(!v)return '尚無資料';const d=new Date(v);return isNaN(d)?'—':d.toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}
function dateStamp(){return new Date().toISOString()}
function getPlayerName(i){return state.players[Number(i)]||`玩家${Number(i)+1}`}
function selectedImportPlayer(){return Number($('#importPlayer').value||0)}
function canEdit(){return !!sb&&!!token}
function requireEdit(){if(canEdit())return true;toast('目前是公開唯讀模式，請先輸入共用密碼才可以編輯',true);nav('settings');return false}
function setStatus(){
 const viewing=!!sb, editing=canEdit();
 $('#statusDot').classList.toggle('connected',viewing);
 $('#modeLabel').textContent=editing?'已登入（可編輯）':viewing?'公開瀏覽（唯讀）':'尚未連線';
 $('#cloudDescription').textContent=editing?'已登入：可以修改所有玩家的庫存。下次開啟會自動恢復登入（最多七天）。':viewing?'不用密碼也能看所有人的最新庫存；需要修改時才輸入共用密碼。':'雲端連線尚未成功，請確認設定與 flower-gateway。';
 $('#syncStamp').textContent=editing?'✏️ 可編輯':viewing?'☁ 公開唯讀':'尚未連線';
 $('#authBtn').textContent=editing?'登出／帳號設定':'登入以編輯';
 const editControls=['quickImport','savePlayers','addPlayer','parseText','parseSheet','savePreview','addPreviewRow','csvFile'];
 for(const id of editControls){const el=$('#'+id);if(el)el.disabled=!editing}
 $$('#playerNames input').forEach(el=>el.disabled=!editing);
 $('#newPlayerName').disabled=!editing;
 // Keep the AI button clickable in read-only mode, so it can explain that login is required.
 $('#scanImages').disabled=busy;
 $('#scanImages').textContent=editing?'🤖 開始 AI 辨識（會計費）→':'🔒 登入後開始 AI 辨識 →';
 $('#signIn').hidden=editing;$('#signOut').hidden=!editing;
 $('#password').closest('.field').hidden=editing;
 $('#disconnectCloud').hidden=true;
}

function nav(next){page=next;$$('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${next}`));$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===next));if(next==='dashboard')renderTable();if(next==='history')renderHistory();if(next==='settings')renderSettings();if(next==='import')renderPlayerSelects();window.scrollTo({top:0,behavior:'instant'})}
function renderPlayerSelects(){const oldImp=$('#importPlayer').value,oldFilt=$('#playerFilter').value;$('#importPlayer').replaceChildren();$('#playerFilter').replaceChildren(new Option('👥 全部玩家比較','all'));state.players.forEach((name,i)=>{$('#importPlayer').add(new Option(`🌱 ${name}`,String(i)));$('#playerFilter').add(new Option(name,String(i)))});$('#importPlayer').value=oldImp!==''&&+oldImp<state.players.length?oldImp:'0';$('#playerFilter').value=oldFilt==='all'||(oldFilt!==''&&+oldFilt<state.players.length)?oldFilt:'all'}
function renderTable(){const query=canonical($('#searchInput').value).toLowerCase(),color=$('#colorFilter').value,who=$('#playerFilter').value;const names=allNames().filter(n=>(!query||n.toLowerCase().includes(query)||n.toLowerCase().includes($('#searchInput').value.trim().toLowerCase()))&&(color==='all'||colorOf(n)===color));$('#statFlowers').textContent=allNames().length;$('#statPlayer').textContent=who==='all'?`${state.players.length} 位玩家`:getPlayerName(who);const dates=Object.values(state.items).map(i=>i.updated_at).filter(Boolean).sort();$('#statUpdated').textContent=dates.length?timeText(dates.at(-1)):'尚無資料';const t=$('#inventoryTable'),thead=t.querySelector('thead'),tbody=t.querySelector('tbody');thead.replaceChildren();tbody.replaceChildren();const hr=document.createElement('tr');['花朵名稱',...(who==='all'?state.players:[getPlayerName(who)])].forEach(s=>{const th=document.createElement('th');th.textContent=s;hr.append(th)});thead.append(hr);for(const name of names){const tr=document.createElement('tr'),td=document.createElement('td'),dot=document.createElement('i');dot.className='flower-color '+colorOf(name);const title=document.createElement('span');title.className='flower-name';title.textContent=name;td.append(dot,title);tr.append(td);const indexes=who==='all'?state.players.map((_,i)=>i):[Number(who)];for(const idx of indexes){const cell=document.createElement('td'),item=getItem(idx,name),wrap=document.createElement('div');wrap.className='num-pair';for(const [field,icon] of [['petals','🌸'],['nectar','🍯']]){const label=document.createElement('div');label.className='pair-pill';const prefix=document.createElement('span');prefix.textContent=icon+' '+(field==='petals'?'花瓣':'精華')+' ';prefix.className='pair-name';const b=document.createElement('button');b.className='cell-edit';b.textContent=nfmt(item?.[field]);b.title=`編輯 ${getPlayerName(idx)} · ${name}`;b.disabled=!canEdit();b.title=canEdit()?b.title:'唯讀：登入後可修改';b.addEventListener('click',()=>openEdit(idx,name));label.append(prefix,b);wrap.append(label)}cell.append(wrap);tr.append(cell)}tbody.append(tr)}$('#rowCount').textContent=`顯示 ${names.length} 種花朵`;$('#emptyState').hidden=names.length>0;t.hidden=names.length===0}
function openEdit(player,flower){editContext={player,flower};const i=getItem(player,flower);$('#editTitle').textContent=flower;$('#editSubtitle').textContent=`編輯 ${getPlayerName(player)} 的庫存`;$('#editPetals').value=i?.petals??'';$('#editNectar').value=i?.nectar??'';$('#editDialog').showModal()}
async function batchSave(rows,player){if(!requireEdit())throw Error('請先登入以編輯');if(!rows.length)throw Error('沒有可儲存的資料');if(sb){await gateway('save',{player_id:Number(player),rows:rows.map(r=>({flower:canonical(r.flower),petals:r.petals,nectar:r.nectar}))});await fetchCloud();return}
 const now=dateStamp();for(const r of rows){const key=`${player}::${canonical(r.flower)}`,old=state.items[key]||{player_id:player,flower:canonical(r.flower),petals:null,nectar:null};const next={...old,petals:r.petals===null?old.petals:r.petals,nectar:r.nectar===null?old.nectar:r.nectar,updated_at:now};state.items[key]=next;state.history.unshift({player_id:player,flower:next.flower,old_petals:old.petals,old_nectar:old.nectar,new_petals:next.petals,new_nectar:next.nectar,changed_at:now})}state.history=state.history.slice(0,500);saveLocal();renderTable()}
/* For manual edit, blank means explicitly unknown. Bulk import blank means keep unchanged. */
async function saveEdit(){if(!requireEdit())return;if(!editContext)return;const p=parseNum($('#editPetals').value),n=parseNum($('#editNectar').value);if(p===undefined||n===undefined){toast('請輸入 0 以上的整數',true);return}const {player,flower}=editContext;try{if(sb){await gateway('save',{player_id:player,rows:[{flower,petals:p,nectar:n,replace:true}]});await fetchCloud()}else{const key=`${player}::${flower}`,old=state.items[key]||{petals:null,nectar:null};state.items[key]={player_id:player,flower,petals:p,nectar:n,updated_at:dateStamp()};state.history.unshift({player_id:player,flower,old_petals:old.petals,old_nectar:old.nectar,new_petals:p,new_nectar:n,changed_at:dateStamp()});saveLocal();renderTable()}toast(`已更新 ${getPlayerName(player)} 的 ${flower}`)}catch(e){toast('儲存失敗：'+e.message,true)}}
function parseText(raw){let type='both',rows=[],warnings=[];raw.replace(/\r/g,'').split('\n').forEach((line,j)=>{line=line.trim();if(!line)return;if(/^(花瓣|精華|花瓣數量|精華數量)$/.test(line)){type=line.startsWith('花瓣')?'petals':'nectar';return}let m=line.match(/^(.+?)\s*[,，\t ]+\s*([\d,，]+)\s*[,，\t ]+\s*([\d,，]+)\s*$/);if(m){rows.push({flower:canonical(m[1]),petals:parseNum(m[2]),nectar:parseNum(m[3]),source:`第 ${j+1} 行`});return}m=line.match(/^(.+?)\s*[:：=]?\s*([\d,，]+)\s*$/);if(m){const v=parseNum(m[2]);rows.push({flower:canonical(m[1]),petals:type==='nectar'?null:v,nectar:type==='nectar'?v:null,source:`第 ${j+1} 行`});return}warnings.push(`第 ${j+1} 行無法解析：「${line.slice(0,40)}」`)});return {rows,warnings}}
function parseSheet(raw){const warnings=[],rows=[];const lines=raw.replace(/\r/g,'').split('\n').filter(Boolean);lines.forEach((line,i)=>{let cells=line.includes('\t')?line.split('\t'):line.split(/[,，](?=\s*[^\d])/);cells=cells.map(x=>x.trim().replace(/^"|"$/g,''));if(i===0&&/花[朵名種]|名稱/.test(cells[0]||''))return;const flower=canonical(cells[0]);if(!flower)return;const p=parseNum(cells[1]||''),n=parseNum(cells[2]||'');if(p===undefined||n===undefined||(!flower)||p===null&&n===null){warnings.push(`第 ${i+1} 行數量格式不正確或沒有數字`);return}rows.push({flower,petals:p,nectar:n,source:`第 ${i+1} 行`})});return{rows,warnings}}
function dedupe(rows){const map=new Map(),conflicts=[];for(const r of rows){if(!r.flower)continue;r.flower=canonical(r.flower);const prev=map.get(r.flower);if(prev){let different=(r.petals!==null&&prev.petals!==null&&r.petals!==prev.petals)||(r.nectar!==null&&prev.nectar!==null&&r.nectar!==prev.nectar);if(different)conflicts.push(`「${r.flower}」出現不同數字，暫用後一筆（${r.source}），請核對。`);map.set(r.flower,{...prev,...r,petals:r.petals??prev.petals,nectar:r.nectar??prev.nectar,source:`重複｜${r.source}`})}else map.set(r.flower,{...r})}return{rows:[...map.values()],warnings:conflicts}}
function setPreview(result){let merged=dedupe(result.rows);preview=merged.rows;$('#previewWarnings').replaceChildren();[...result.warnings,...merged.warnings].forEach(msg=>{const div=document.createElement('div');div.textContent='⚠ '+msg;$('#previewWarnings').append(div)});$('#previewPanel').hidden=false;renderPreview();$('#previewPanel').scrollIntoView({behavior:'smooth',block:'start'})}
function renderPreview(){const body=$('#previewBody');body.replaceChildren();preview.forEach((r,index)=>{const tr=document.createElement('tr');for(const [key,cls] of [['flower','name-input'],['petals',''],['nectar','']]){const td=document.createElement('td'),input=document.createElement('input');input.className=cls;input.setAttribute('aria-label',key==='flower'?'花朵名稱':key==='petals'?'花瓣':'精華');input.value=r[key]??'';if(key!=='flower')input.inputMode='numeric';input.addEventListener('input',()=>{r[key]=key==='flower'?input.value:input.value.trim()===''?null:input.value});td.append(input);tr.append(td)}const td=document.createElement('td');td.className='muted';td.textContent=r.source||'手動新增';tr.append(td);const last=document.createElement('td'),del=document.createElement('button');del.className='remove-row';del.textContent='×';del.title='移除此列';del.addEventListener('click',()=>{preview.splice(index,1);renderPreview()});last.append(del);tr.append(last);body.append(tr)});$('#previewStats').textContent=`共 ${preview.length} 筆`}
async function commitPreview(){if(!requireEdit())return;if(busy)return;const rows=preview.map(r=>({flower:canonical(r.flower),petals:parseNum(r.petals),nectar:parseNum(r.nectar)}));if(!rows.length){toast('沒有資料可以儲存',true);return}if(rows.some(r=>!r.flower||r.flower.includes('待確認花名')||r.petals===undefined||r.nectar===undefined||r.petals===null&&r.nectar===null)){toast('有空白花名或錯誤數量，請檢查後再存檔',true);return}const duplicates=dedupe(rows);if(duplicates.warnings.length&&!confirm(duplicates.warnings.join('\n')+'\n仍要繼續儲存？'))return;busy=true;$('#savePreview').disabled=true;try{await batchSave(duplicates.rows,selectedImportPlayer());toast(`成功儲存 ${duplicates.rows.length} 種花朵 🌸`);$('#previewPanel').hidden=true;nav('dashboard')}catch(e){toast('儲存失敗：'+e.message,true)}finally{busy=false;$('#savePreview').disabled=false}}
function readImage(file){return new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('無法讀取圖片'))};img.src=url})}
/* AI Vision: each image is sent only to authenticated Supabase Edge Function. */
function fileAsDataUrl(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('無法開啟圖片'));reader.readAsDataURL(file)})}
async function prepareImage(file){
 if(!/^image\/(png|jpeg|webp)$/.test(file.type))throw Error('圖片格式不支援：'+file.name);
 // A jpeg already small enough is transmitted without any lossy recompression.
 if(file.type==='image/jpeg' && file.size < 3_500_000) return await fileAsDataUrl(file);
 const url=URL.createObjectURL(file);
 try{
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('圖片無法讀取'));i.src=url});
  // Unlike the previous 2048px / quality .88 conversion, preserve native resolution
  // as far as practical, particularly the tiny nectar labels.
  for(const maxSide of [3600,3000,2600,2300,2048]){
   const ratio=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
   const canvas=document.createElement('canvas');canvas.width=Math.round(img.naturalWidth*ratio);canvas.height=Math.round(img.naturalHeight*ratio);
   canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
   for(const quality of [0.97,0.93,0.88]){
    const data=canvas.toDataURL('image/jpeg',quality);
    if(data.length<4_700_000)return data;
   }
  }
  throw Error('圖片過大，請先裁掉不需要的畫面後再上傳');
 }finally{URL.revokeObjectURL(url)}
}
// Add TWO overlapping, unscaled vertical crops so small gray petal labels and
// lower-right nectar labels are visible in the vision request. Keep the whole
// image for positioning. Crops are only reading aids, not extra inventory rows.
async function makeReadingCrops(file){
 const objectUrl=URL.createObjectURL(file);
 try{
  const img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('截圖無法讀取'));im.src=objectUrl});
  const w=img.naturalWidth,h=img.naturalHeight;
  const cuts=[[0.17,0.65],[0.57,1]];
  return cuts.map(([start,end])=>{
   const top=Math.floor(h*start),height=Math.ceil(h*end)-top;
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=height;
   canvas.getContext('2d').drawImage(img,0,top,w,height,0,0,w,height);
   return canvas.toDataURL('image/jpeg',0.96);
  });
 }finally{URL.revokeObjectURL(objectUrl)}
}
async function scanScreenshots(){
 if(!canEdit()){toast('圖片已選擇，但需先「登入以編輯」才能呼叫付費 AI。登入後請再選擇圖片。',true);nav('settings');return;}
 if(busy)return;
 if(!fileSelection.length){toast('請先選擇截圖',true);return}
 if(fileSelection.length>3){toast('為控制費用與準確度，每批最多 3 張',true);return}
 const localAI = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
 if(!localAI && (!sb||!token)){toast('請先到設定頁輸入共用密碼並登入',true);nav('settings');return}
 if(!confirm(`即將透過 OpenAI API 辨識 ${fileSelection.length} 張截圖。新版會附上原圖與局部放大圖進行辨識，必要時會再次核對數字，因此 API 費用可能比舊版高。要繼續嗎？`))return;
 busy=true;$('#scanImages').disabled=true;
 try{
  $('#ocrProgress').textContent='正在準備圖片…';
  const images=[],readingCrops=[];for(let i=0;i<fileSelection.length;i++){images.push(await prepareImage(fileSelection[i]));readingCrops.push(await makeReadingCrops(fileSelection[i]));}
  // Each screenshot is scanned separately. Three screenshots in a single model
  // response can cause tile alignment mistakes and missed / mixed numbers.
  const allRows=[], allWarnings=[];
  for(let i=0;i<images.length;i++){
   $('#ocrProgress').textContent=`AI 正在辨識第 ${i+1} / ${images.length} 張（逐張辨識）…`;
   try{
    let part;
    if(localAI){
     const response=await fetch('/api/scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({images:[{data:images[i]}]})});
     part=await response.json();
     if(!response.ok)throw Error(part.error||'本機 AI 辨識失敗');
     part.rows=(part.items||[]).map(it=>({flower:it.name,petals:it.petals,nectar:it.nectar,image_index:1,name_status:it.name_status,original_name:it.original_name,suggestions:it.suggestions}));
     part.warnings=[];
    }else{
     part=await gateway('scan',{images:[images[i]],reading_crops:readingCrops[i]});
    }
    if(part?.error)throw Error(part.error);
    allRows.push(...(part.rows||[]).map(row=>({...row,image_index:i+1})));
    allWarnings.push(...(part.warnings||[]).map(w=>`第 ${i+1} 張：${w}`));
   }catch(error){
    allWarnings.push(`第 ${i+1} 張辨識失敗：${error.message}。`);
   }
  }
  const data={rows:allRows,warnings:allWarnings};
  if(data?.error)throw Error(data.error);
  const rows=[],warnings=[],seen=new Map();
  for(const item of data.rows||[]){
   const flower=canonical(item.flower);
   const petals=parseNum(item.petals),nectar=parseNum(item.nectar);
   const which=Number(item.image_index);
   const source=`AI 截圖 ${Number.isInteger(which)&&which>=1&&which<=fileSelection.length?which:'?'}：${fileSelection[which-1]?.name||'圖片'}`;
   if(!flower){warnings.push(`${source}：有一筆花名不確定，未自動匯入。`);continue}
   if(item.name_status==='review')warnings.push(`${source}：「${flower}」不在確認花種清單，請先人工修改花名。${(item.suggestions||[]).length?'可能是：'+item.suggestions.join('、'):''}`);
   if(item.name_status==='corrected')warnings.push(`${source}：花名已自動修正「${item.original_name}」→「${flower}」，請核對。`);
   if(petals===undefined||nectar===undefined){warnings.push(`${source}：${flower} 數量格式不正確，已略過。`);continue}
   if(petals===null&&nectar===null){warnings.push(`${source}：${flower} 兩個數量均無法辨識，已略過。`);continue}
   if(seen.has(flower)){const older=seen.get(flower);if(older.petals!==petals||older.nectar!==nectar)warnings.push(`${flower} 在多張截圖的數值不同，請在預覽確認；不會加總。`);else warnings.push(`${flower} 在多張截圖重複出現，已去重。`);continue}
   const row={flower,petals,nectar,source};seen.set(flower,row);rows.push(row);
   if(petals===null||nectar===null)warnings.push(`${source}：${flower} 有數值看不清楚，請補填。`);
  }
  warnings.push(...(data.warnings||[]).map(String));
  $('#ocrProgress').textContent=`AI 回傳 ${rows.length} 種花，請逐筆核對原圖後再儲存。`;
  setPreview({rows,warnings});
  if(!rows.length)toast('AI 沒有可靠的候選資料，請換清晰截圖或手動輸入',true);
 }catch(err){console.error(err);toast('AI 辨識失敗：'+err.message,true);$('#ocrProgress').textContent='發生錯誤：'+err.message}
 finally{busy=false;$('#scanImages').disabled=false}
}
function renderHistory(){const root=$('#historyList');root.replaceChildren();if(!state.history.length){const p=document.createElement('p');p.className='empty';p.textContent='尚無更新紀錄 🌱';root.append(p);return}for(const h of state.history.slice(0,100)){const row=document.createElement('div');row.className='history-entry';const left=document.createElement('div'),strong=document.createElement('strong'),p=document.createElement('p'),tm=document.createElement('time');strong.textContent=`${getPlayerName(h.player_id)} · ${h.flower}`;p.textContent=`🌸 ${nfmt(h.old_petals)} → ${nfmt(h.new_petals)}　🍯 ${nfmt(h.old_nectar)} → ${nfmt(h.new_nectar)}`;tm.textContent=timeText(h.changed_at);left.append(strong,p);row.append(left,tm);root.append(row)}}
function renderSettings(){const container=$('#playerNames');container.replaceChildren();state.players.forEach((name,i)=>{const label=document.createElement('label');label.textContent=`玩家 ${i+1}`;const input=document.createElement('input');input.value=name;input.dataset.playerIndex=i;input.maxLength=28;label.append(input);container.append(label)});const cfg=getConfig();$('#sbUrl').value=cfg.url||'';$('#sbKey').value=cfg.key||'';setStatus()}
async function savePlayerNames(){if(!requireEdit())return;const players=$$('#playerNames input').map(el=>el.value.trim());if(players.some(n=>!n)){toast('玩家名稱不能空白',true);return}try{if(sb){await gateway('rename',{players});await fetchCloud()}else{state.players=players;saveLocal();renderPlayerSelects();renderTable()}toast('玩家名稱已更新')}catch(e){toast(e.message,true)}}
async function addPlayer(){if(!requireEdit())return;const name=$('#newPlayerName').value.trim();if(!name||name.length>28){toast('請輸入 1～28 個字的玩家名稱',true);return}try{if(sb){await gateway('add_player',{name});await fetchCloud()}else{state.players.push(name);saveLocal();renderPlayerSelects();renderTable();renderSettings()}$('#newPlayerName').value='';toast('已新增玩家 '+name)}catch(e){toast('新增失敗：'+e.message,true)}}
function csvCell(v){let s=String(v??'');return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function exportCsv(){const rows=[['玩家編號','玩家名稱','花朵','花瓣','精華','最後更新'],...Object.values(state.items).sort((a,b)=>a.player_id-b.player_id||a.flower.localeCompare(b.flower,'zh-Hant')).map(i=>[i.player_id+1,getPlayerName(i.player_id),i.flower,i.petals??'',i.nectar??'',i.updated_at||''])];const csv='\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n');const a=document.createElement('a'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.href=url;a.download=`pikmin-inventory-${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('已下載 CSV 備份')}
function parseCsv(csv){let rows=[],record=[],field='',quoted=false;for(let i=0;i<csv.length;i++){const c=csv[i];if(quoted){if(c==='"'&&csv[i+1]==='"'){field+='"';i++}else if(c==='"')quoted=false;else field+=c}else if(c==='"')quoted=true;else if(c===','){record.push(field);field=''}else if(c==='\n'){record.push(field.replace(/\r$/,''));rows.push(record);record=[];field=''}else field+=c}if(field||record.length){record.push(field);rows.push(record)}return rows}
async function importCsv(file){if(!requireEdit())return;const content=(await file.text()).replace(/^\ufeff/,'');let rows=parseCsv(content).slice(1);if(!rows.length){toast('CSV 檔案沒有資料',true);return}const groups=new Map();for(const cells of rows){const p=Number(cells[0])-1,flower=canonical(cells[2]);if(!Number.isInteger(p)||p<0||p>=state.players.length||!flower)continue;const petals=parseNum(cells[3]),nectar=parseNum(cells[4]);if(petals===undefined||nectar===undefined)continue;if(!groups.has(p))groups.set(p,[]);groups.get(p).push({flower,petals,nectar})}if(!groups.size){toast('CSV 格式不符合備份格式',true);return}if(!confirm(`將從 CSV 匯入 ${[...groups.values()].reduce((s,v)=>s+v.length,0)} 筆資料（共 ${groups.size} 位玩家）。會覆蓋有提供數字的欄位，確定嗎？`))return;try{for(const [p,items] of groups)await batchSave(items,p);toast('CSV 已匯入');nav('dashboard')}catch(e){toast('匯入失敗：'+e.message,true)}}
function getConfig(){try{const saved=JSON.parse(localStorage.getItem(CONFIG))||{};return {url:saved.url||DEFAULT_URL,key:saved.key||''}}catch{return {url:DEFAULT_URL,key:''}}}
function initializeClient(){const cfg=getConfig();sb=cfg.url?cfg:null;setStatus()}
async function gateway(action,body={}){const cfg=getConfig();if(!cfg.url)throw Error('缺少 Supabase 網址');const url=cfg.url.replace(/\/$/,'')+'/functions/v1/flower-gateway';const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(cfg.key?{'apikey':cfg.key}:{}),...(token?{'Authorization':'Bearer '+token}:{})},body:JSON.stringify({action,...body})});let data;try{data=await response.json()}catch{throw Error(`伺服器回傳格式錯誤 (${response.status})，請確認已部署 flower-gateway 並關閉 Verify JWT`)}if(!response.ok){if(response.status===401&&action!=='login'){token='';localStorage.removeItem(SESSION);setStatus()}throw Error(data?.error||`連線錯誤 ${response.status}`)}return data}
function assignSnapshot(result,publicMode=false){
 state.players=(result.players||[]).map(p=>p.name);
 state.items={};for(const x of result.inventory||[])state.items[`${x.player_id}::${x.flower}`]=x;
 state.history=publicMode?[]:(result.history||[]);
 renderPlayerSelects();renderTable();if(page==='history')renderHistory();if(page==='settings')renderSettings();
 setStatus();
}
async function fetchPublic(){if(!sb)return;const result=await gateway('public_bootstrap');assignSnapshot(result,true)}
async function fetchCloud(){if(!sb||!token)return;const result=await gateway('bootstrap');assignSnapshot(result,false)}
async function connect(){
 initializeClient();if(!sb)return;
 if(token){try{await fetchCloud();return}catch(e){console.warn('登入憑證已過期，切換唯讀',e);token='';localStorage.removeItem(SESSION)}}
 try{await fetchPublic()}catch(e){toast('公開資料讀取失敗：'+e.message,true)}setStatus();
}
async function signIn(){
 initializeClient();if(!sb){toast('尚未設定雲端網址',true);return}
 const password=$('#password').value;if(!password){toast('請輸入共用密碼',true);return}
 try{const result=await gateway('login',{password});token=result.token;localStorage.setItem(SESSION,token);$('#password').value='';await fetchCloud();setStatus();toast('登入成功！下次開啟會自動登入')}catch(e){token='';localStorage.removeItem(SESSION);toast('登入失敗：'+e.message,true)}
}
async function signOut(){token='';localStorage.removeItem(SESSION);await fetchPublic();setStatus();toast('已登出，仍可公開查看資料')}
async function setConfig(){
 const url=$('#sbUrl').value.trim(),key=$('#sbKey').value.trim();
 if(!/^https:\/\/[^/]+\.supabase\.co\/?$/.test(url)){toast('請輸入正確的 Supabase Project URL',true);return}
 if(/service_role|sb_secret_/i.test(key)){toast('不要使用 secret / service_role 金鑰',true);return}
 localStorage.setItem(CONFIG,JSON.stringify({url,key}));token='';localStorage.removeItem(SESSION);initializeClient();await fetchPublic();toast('設定已儲存，可直接公開查看庫存');
}

function setTab(next){activeTab=next;$$('.tab').forEach(el=>el.classList.toggle('active',el.dataset.tab===next));$$('.tab-body').forEach(el=>el.classList.toggle('active',el.id===`tab-${next}`))}
function bind(){ $$('.nav-item').forEach(el=>el.addEventListener('click',()=>nav(el.dataset.page)));$$('.tab').forEach(el=>el.addEventListener('click',()=>setTab(el.dataset.tab)));$('#quickImport').addEventListener('click',()=>nav('import'));$('#authBtn').addEventListener('click',()=>nav('settings'));$('#searchInput').addEventListener('input',renderTable);$('#colorFilter').addEventListener('change',renderTable);$('#playerFilter').addEventListener('change',renderTable);$('#parseText').addEventListener('click',()=>setPreview(parseText($('#textInput').value)));$('#parseSheet').addEventListener('click',()=>setPreview(parseSheet($('#sheetInput').value)));$('#imageInput').addEventListener('change',e=>{fileSelection=[...e.target.files];$('#imageFileList').textContent=fileSelection.length?`✅ 已選擇 ${fileSelection.length} 張：${fileSelection.map(f=>f.name).join('、')}${fileSelection.length>3?' ⚠️ 每次最多 3 張，請重新選擇。':''}${!canEdit()?' ｜請先按右上角「登入以編輯」':''}`:'';});$('#scanImages').addEventListener('click',scanScreenshots);$('#addPreviewRow').addEventListener('click',()=>{preview.push({flower:'',petals:null,nectar:null,source:'手動新增'});renderPreview()});$('#savePreview').addEventListener('click',commitPreview);$('#editForm').addEventListener('submit',async e=>{if(e.submitter?.value!=='save')return;e.preventDefault();await saveEdit();$('#editDialog').close()});$('#savePlayers').addEventListener('click',savePlayerNames);$('#addPlayer').addEventListener('click',addPlayer);$('#saveCloud').addEventListener('click',setConfig);$('#disconnectCloud').addEventListener('click',async()=>{await signOut()});$('#signIn').addEventListener('click',signIn);$('#signOut').addEventListener('click',signOut);$('#exportCsv').addEventListener('click',exportCsv);$('#csvFile').addEventListener('change',async e=>{if(e.target.files[0])await importCsv(e.target.files[0]);e.target.value=''});$('#reloadHistory').addEventListener('click',async()=>{if(sb)try{if(token)await fetchCloud();else await fetchPublic()}catch(e){toast(e.message,true)}renderHistory()})}
async function init(){bind();renderPlayerSelects();renderTable();renderHistory();renderSettings();await connect()}
window.addEventListener('load',init);
})();

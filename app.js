/* 花朵庫存統計站 · Zero-build frontend · local demo + optional Supabase */
(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY='flower-station-shared-demo-v1', CONFIG='flower-station-shared-config'; const SESSION='flower-station-shared-session'; const DEFAULT_URL='https://uvdijjktingslobyxodu.supabase.co';
const defaults=['玩家1','玩家2','玩家3','玩家4'];
const PUBLIC_CACHE='flower-station-last-public-v12';
const common={'精華':'普白','白色精華':'普白','黃色精華':'普黃','紅色精華':'普紅','藍色精華':'普藍','白精華':'普白','黃精華':'普黃','紅精華':'普紅','藍精華':'普藍','愛心精華':'特殊精華','愛心型精華':'特殊精華','心型精華':'特殊精華','心形精華':'特殊精華','特殊花瓣精華':'特殊精華','愛心':'特殊精華','紅心精華':'特殊精華','特殊愛心精華':'特殊精華','（愛心）精華':'特殊精華','(愛心)精華':'特殊精華','特殊':'特殊精華','（愛心）':'特殊精華','(愛心)':'特殊精華','特殊精華（愛心）':'特殊精華','藍色粉蝶花':'粉蝶花'};
const FLOWER_CATALOG={"銀蓮花":"白黃紅藍","九重葛":"白黃紅藍","海芋":"白黃紅藍","山茶花":"白黃紅藍","油菜花":"白黃藍","康乃馨":"白黃紅藍","嘉德麗雅蘭":"白黃紅藍","雞冠花":"白黃紅藍","櫻花":"白","菊花":"白黃紅藍","鐵線蓮":"白黃紅藍","彼岸花":"白黃紅","鈴蘭":"白紅","大波斯菊":"白黃紅","兔耳花":"白紅藍","大理花":"白黃紅藍","石竹":"白紅藍","小蒼蘭":"白黃紅藍","龍膽":"白紅藍","聖誕玫瑰":"白黃紅藍","扶桑花":"白黃紅藍","風信子":"白黃紅藍","繡球花":"白紅藍","鳶尾花":"白黃紅藍","百合":"白黃紅","萬壽菊":"白黃紅","牽牛花":"白黃紅藍","蝴蝶蘭":"白黃紅藍","水仙花":"白黃","粉蝶花":"藍","睡蓮":"白黃紅藍","三色菫":"白黃紅藍","牡丹":"白黃紅藍","矮牽牛":"白黃紅藍","梅花":"白黃紅","雞蛋花":"白黃紅","聖誕紅":"白黃紅藍","櫻草花":"白黃紅藍","玫瑰":"白黃紅藍","週年紀念玫瑰":"白黃紅藍","鼠尾草":"白黃紅藍","金魚草":"白黃紅藍","雪花蓮":"白黃紅","天堂鳥":"白黃紅","向日葵":"黃","豌豆花":"白黃紅藍","鬱金香":"白黃紅藍","鸚鵡鬱金香":"白黃紅藍","勿忘草":"白黃紅藍","曇花":"白黃紅藍","美人蕉":"白黃紅","洋桔梗":"白黃紅藍","薊花":"白黃紅藍","天竺葵":"白黃紅藍","風鈴草":"白紅藍"};
const flowerSeeds=Object.keys(FLOWER_CATALOG);
const VALID_FLOWERS=new Set(['普白','普黃','普紅','普藍','特殊精華',...Object.entries(FLOWER_CATALOG).flatMap(([family,colors])=>[...colors].map(c=>['櫻花','粉蝶花','向日葵'].includes(family)?family:`${({'白':'白色','黃':'黃色','紅':'紅色','藍':'藍色'})[c]}${family}`))]);
let state={players:[...defaults],items:{},history:[]}, sb=null, user=null, token=localStorage.getItem(SESSION)||'', page='dashboard', activeTab='text', preview=[], fileSelection=[], busy=false, editContext=null, toastTimer=null, latestSync=null, syncError='', syncInFlight=null;
function toast(msg,error=false){const el=$('#toast');el.textContent=msg;el.className='toast show'+(error?' error':'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.className='toast',4400)}
function nfmt(n){return n===null||n===undefined?'—':Number(n).toLocaleString('en-US')}
function parseNum(v){if(v===null||v===undefined||String(v).trim()==='')return null;let s=String(v).replace(/[,，\s]/g,'');if(!/^\d+$/.test(s)||Number(s)>9999999)return undefined;return Number(s)}
function canonical(raw){let s=String(raw||'').replace(/[\s\u200b\u3000]/g,'').replace(/[：:]/g,'').trim();if(!s)return '';if(common[s])return common[s];s=s.replace(/^([白黃])色水仙$/,'$1色水仙花').replace(/三色堇/g,'三色菫').replace(/墨花/g,'曇花');if(s==='白色櫻花')return '櫻花';if(s==='藍色粉蝶花')return '粉蝶花';if(s==='黃色向日葵')return '向日葵';if(/^特殊精華$/.test(s))return '特殊精華';s=s.replace(/^白(?=[^色])/,'白色').replace(/^黃(?=[^色])/,'黃色').replace(/^紅(?=[^色])/,'紅色').replace(/^藍(?=[^色])/,'藍色');if(common[s])return common[s];if(/^([白黃紅藍])色精華$/.test(s))return common[s];return s}
// The catalog above is authoritative for all manual writes. Near matches are only suggestions, never silently accepted.
const NAME_ALIASES={'白色水仙':'白色水仙花','黃色水仙':'黃色水仙花','白色彼岸':'白色彼岸花','黃色彼岸':'黃色彼岸花','紅色彼岸':'紅色彼岸花','三色堇':'三色菫','白色櫻花':'櫻花','黃色向日葵':'黃色向日葵','藍色粉蝶花':'粉蝶花'};
const COLOR_NAME={'白':'白色','黃':'黃色','紅':'紅色','藍':'藍色'};
const COLOR_KEYS=['白','黃','紅','藍'];
const CANONICAL_NAMES=[...VALID_FLOWERS];
function nameSuggestion(raw){const s=String(raw||'').replace(/\s/g,'').trim();if(!s)return '';if(VALID_FLOWERS.has(s))return s;if(NAME_ALIASES[s])return NAME_ALIASES[s];const simplified=s.replace(/^([白黃紅藍])(?=[^色])/,'$1色');if(VALID_FLOWERS.has(simplified))return simplified;
 const pref=/^([白黃紅藍])色/.exec(simplified)?.[1]||'';
 let candidates=CANONICAL_NAMES.filter(n=>!pref||colorOf(n)===pref);let score=0,best='';for(const name of candidates){const a=[...simplified],b=[...name],mat=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));for(let i=0;i<=a.length;i++)mat[i][0]=i;for(let j=0;j<=b.length;j++)mat[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)mat[i][j]=Math.min(mat[i-1][j]+1,mat[i][j-1]+1,mat[i-1][j-1]+(a[i-1]===b[j-1]?0:1));const diff=mat[a.length][b.length];if(diff<=2&&(!best||diff<score)){best=name;score=diff}}return best;
}
function manualName(raw){const s=canonical(raw);return VALID_FLOWERS.has(s)?s:''}
function normalizePreviewRows(result){let notes=[...(result.warnings||[])];const rows=(result.rows||[]).map(r=>{const raw=String(r.flower||'').trim();const exact=manualName(raw);const suggestion=exact?'':nameSuggestion(raw);if(!exact)notes.push(`「${raw||'空白花名'}」不是正式名稱${suggestion?'，建議選擇「'+suggestion+'」':''}；請在預覽中選擇正確花名。`);return {...r,flower:exact||'',rawFlower:exact?'':raw,suggestedFlower:suggestion};});return{rows,warnings:notes};}
const COLOR_RANK={'白':0,'黃':1,'紅':2,'藍':3};
function flowerFamily(name){if(name.startsWith('普'))return '!!普通精華';return name.replace(/^[白黃紅藍]色/,'')}
function compareFlowers(a,b,mode='flower'){const ca=COLOR_RANK[colorOf(a)]??9,cb=COLOR_RANK[colorOf(b)]??9;if(mode==='color')return ca-cb||flowerFamily(a).localeCompare(flowerFamily(b),'zh-Hant')||a.localeCompare(b,'zh-Hant');if(mode==='name')return a.localeCompare(b,'zh-Hant');return flowerFamily(a).localeCompare(flowerFamily(b),'zh-Hant')||ca-cb||a.localeCompare(b,'zh-Hant')}
function colorOf(name){if(name.startsWith('普'))return({'普白':'白','普黃':'黃','普紅':'紅','普藍':'藍'})[name]||'白';if(name==='黃色向日葵'||name==='向日葵')return '黃';if(name==='藍色粉蝶花'||name==='粉蝶花')return '藍';if(name==='櫻花'||name==='白色櫻花')return '白';return /^([白黃紅藍])色/.exec(name)?.[1]||''}
function flowerDisplayName(name){const n=String(name||'');return ({'黃色向日葵':'向日葵','藍色粉蝶花':'粉蝶花','白色櫻花':'櫻花'})[n]||n}
function flowerDisplayIcon(name){return name==='特殊精華'?'♥':''}
function saveLocal(){localStorage.setItem(KEY,JSON.stringify(state))}
function loadLocal(){try{const data=JSON.parse(localStorage.getItem(KEY));if(data&&data.items&&Array.isArray(data.players)){state={players:data.players.length?data.players:[...defaults],items:data.items,history:Array.isArray(data.history)?data.history:[]}}}catch(e){console.warn(e)}}
function getItem(player,name){return state.items[`${player}::${name}`]||null}
function allNames(){return [...new Set(Object.values(state.items).map(i=>i.flower))].sort((a,b)=>compareFlowers(a,b,'flower'))}
function timeText(v){if(!v)return '尚無資料';const d=new Date(v);return isNaN(d)?'—':d.toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}
function dateStamp(){return new Date().toISOString()}
function getPlayerName(i){return state.players[Number(i)]||`玩家${Number(i)+1}`}
function selectedImportPlayer(){return Number($('#importPlayer').value||0)}
function canEdit(){return !!sb&&!!token}
function requireEdit(){if(canEdit())return true;toast('目前是公開唯讀模式，請先輸入共用密碼才可以編輯',true);nav('settings');return false}
function setStatus(){
 const viewing=!!sb, editing=canEdit();
 $('#statusDot').classList.toggle('connected',viewing);
 $('#modeLabel').textContent=syncError?'雲端暫時無法更新':editing?'已登入（可編輯）':latestSync?'公開瀏覽（唯讀）':viewing?'正在連線':'尚未連線';
 $('#cloudDescription').textContent=editing?'已登入：可以修改所有玩家的庫存。下次開啟會自動恢復登入（最多七天）。':viewing?'不用密碼也能看所有人的最新庫存；需要修改時才輸入共用密碼。':'雲端連線尚未成功，請確認設定與 flower-gateway。';
 $('#syncStamp').textContent=syncError?'⚠️ 雲端同步失敗':latestSync?'☁ 已同步 '+timeText(latestSync):viewing?'☁ 連線中…':'尚未連線';
 const notice=$('#syncNotice');if(notice){notice.hidden=!syncError;notice.textContent=syncError?'⚠️ '+syncError+'（畫面可能是上次成功載入的資料，請稍後按「重新讀取」）':'';}
 $('#authBtn').textContent=editing?'登出／帳號設定':'登入以編輯';
 const editControls=['quickImport','generateQuick','quickPreview','savePlayers','addPlayer','parseText','parseSheet','savePreview','addPreviewRow','csvFile'];
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

function nav(next){page=next;$$('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${next}`));$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===next));if(next==='dashboard')renderTable();if(next==='analytics')renderAnalytics();if(next==='history')renderHistory();if(next==='settings')renderSettings();if(next==='import')renderPlayerSelects();window.scrollTo({top:0,behavior:'instant'})}
function renderPlayerSelects(){const oldImp=$('#importPlayer').value,oldFilt=$('#playerFilter').value;$('#importPlayer').replaceChildren();$('#playerFilter').replaceChildren(new Option('👥 全部玩家比較','all'));state.players.forEach((name,i)=>{$('#importPlayer').add(new Option(`🌱 ${name}`,String(i)));$('#playerFilter').add(new Option(name,String(i)))});$('#importPlayer').value=oldImp!==''&&+oldImp<state.players.length?oldImp:'0';$('#playerFilter').value=oldFilt==='all'||(oldFilt!==''&&+oldFilt<state.players.length)?oldFilt:'all'}
function renderTable(){const query=canonical($('#searchInput').value).toLowerCase(),color=$('#colorFilter').value,who=$('#playerFilter').value;const names=allNames().filter(n=>(!query||n.toLowerCase().includes(query)||flowerDisplayName(n).toLowerCase().includes($('#searchInput').value.trim().toLowerCase()))&&(color==='all'||colorOf(n)===color)).sort((a,b)=>compareFlowers(a,b,$('#sortMode').value));$('#statFlowers').textContent=allNames().length;$('#statPlayer').textContent=who==='all'?`${state.players.length} 位玩家`:getPlayerName(who);const dates=Object.values(state.items).map(i=>i.updated_at).filter(Boolean).sort();$('#statUpdated').textContent=dates.length?timeText(dates.at(-1)):'尚無資料';const t=$('#inventoryTable'),thead=t.querySelector('thead'),tbody=t.querySelector('tbody');thead.replaceChildren();tbody.replaceChildren();const hr=document.createElement('tr');['花朵名稱',...(who==='all'?state.players:[getPlayerName(who)])].forEach(s=>{const th=document.createElement('th');th.textContent=s;hr.append(th)});thead.append(hr);for(const name of names){const tr=document.createElement('tr'),td=document.createElement('td'),dot=document.createElement('i');dot.className='flower-color '+colorOf(name);const displayIcon=flowerDisplayIcon(name);if(displayIcon){dot.classList.add('flower-special-icon');dot.textContent=displayIcon;dot.setAttribute('aria-label',name==='特殊精華'?'愛心特殊精華':name+'的顏色');}const title=document.createElement('span');title.className='flower-name';title.textContent=flowerDisplayName(name);td.append(dot,title);tr.append(td);const indexes=who==='all'?state.players.map((_,i)=>i):[Number(who)];for(const idx of indexes){const cell=document.createElement('td'),item=getItem(idx,name),wrap=document.createElement('div');wrap.className='num-pair';for(const [field,icon] of (name==='特殊精華'?[['nectar','🍯']]:[['petals','🌸'],['nectar','🍯']])){const label=document.createElement('div');label.className='pair-pill';const prefix=document.createElement('span');prefix.textContent=icon+' '+(field==='petals'?'花瓣':'精華')+' ';prefix.className='pair-name';const b=document.createElement('button');b.className='cell-edit';b.textContent=nfmt(item?.[field]);b.title=`編輯 ${getPlayerName(idx)} · ${name}`;b.disabled=!canEdit();b.title=canEdit()?b.title:'唯讀：登入後可修改';b.addEventListener('click',()=>openEdit(idx,name));label.append(prefix,b);wrap.append(label)}cell.append(wrap);tr.append(cell)}tbody.append(tr)}$('#rowCount').textContent=`顯示 ${names.length} 種花朵`;$('#emptyState').hidden=names.length>0;t.hidden=names.length===0}
function openEdit(player,flower){editContext={player,flower};const i=getItem(player,flower);$('#editTitle').textContent=flowerDisplayName(flower);$('#editSubtitle').textContent=`編輯 ${getPlayerName(player)} 的庫存`;$('#editPetals').value=i?.petals??'';$('#editPetals').disabled=flower==='特殊精華';$('#editPetals').placeholder=flower==='特殊精華'?'特殊精華沒有花瓣':'留白代表尚未登記';$('#editNectar').value=i?.nectar??'';$('#editDialog').showModal()}
async function batchSave(rows,player){if(!requireEdit())throw Error('請先登入以編輯');if(!rows.length)throw Error('沒有可儲存的資料');if(rows.some(r=>!manualName(r.flower)))throw Error('花名不符合正式清單，請使用選單選擇');if(sb){await gateway('save',{player_id:Number(player),rows:rows.map(r=>({flower:canonical(r.flower),petals:r.petals,nectar:r.nectar}))});await fetchCloud();return}
 const now=dateStamp();for(const r of rows){const key=`${player}::${canonical(r.flower)}`,old=state.items[key]||{player_id:player,flower:canonical(r.flower),petals:null,nectar:null};const next={...old,petals:r.petals===null?old.petals:r.petals,nectar:r.nectar===null?old.nectar:r.nectar,updated_at:now};state.items[key]=next;state.history.unshift({player_id:player,flower:next.flower,old_petals:old.petals,old_nectar:old.nectar,new_petals:next.petals,new_nectar:next.nectar,changed_at:now})}state.history=state.history.slice(0,500);saveLocal();renderTable()}
/* For manual edit, blank means explicitly unknown. Bulk import blank means keep unchanged. */
async function saveEdit(){if(!requireEdit())return;if(!editContext)return;const p=editContext.flower==='特殊精華'?null:parseNum($('#editPetals').value),n=parseNum($('#editNectar').value);if(p===undefined||n===undefined){toast('請輸入 0 以上的整數',true);return}const {player}=editContext,flower=canonical(editContext.flower);try{if(sb){await gateway('save',{player_id:player,rows:[{flower,petals:p,nectar:n,replace:true}]});await fetchCloud()}else{const key=`${player}::${flower}`,old=state.items[key]||{petals:null,nectar:null};state.items[key]={player_id:player,flower,petals:p,nectar:n,updated_at:dateStamp()};state.history.unshift({player_id:player,flower,old_petals:old.petals,old_nectar:old.nectar,new_petals:p,new_nectar:n,changed_at:dateStamp()});saveLocal();renderTable()}toast(`已更新 ${getPlayerName(player)} 的 ${flower}`)}catch(e){toast('儲存失敗：'+e.message,true)}}
function parseText(raw){let type='both',rows=[],warnings=[];raw.replace(/\r/g,'').split('\n').forEach((line,j)=>{line=line.trim();if(!line)return;if(/^(花瓣|精華|花瓣數量|精華數量)$/.test(line)){type=line.startsWith('花瓣')?'petals':'nectar';return}let m=line.match(/^(.+?)\s*[,，\t ]+\s*([\d,，]+)\s*[,，\t ]+\s*([\d,，]+)\s*$/);if(m){rows.push({flower:m[1].trim(),petals:parseNum(m[2]),nectar:parseNum(m[3]),source:`第 ${j+1} 行`});return}m=line.match(/^(.+?)\s*[:：=]?\s*([\d,，]+)\s*$/);if(m){const v=parseNum(m[2]);rows.push({flower:m[1].trim(),petals:type==='nectar'?null:v,nectar:type==='nectar'?v:null,source:`第 ${j+1} 行`});return}warnings.push(`第 ${j+1} 行無法解析：「${line.slice(0,40)}」`)});return {rows,warnings}}
function parseSheet(raw){const warnings=[],rows=[];const lines=raw.replace(/\r/g,'').split('\n').filter(Boolean);lines.forEach((line,i)=>{let cells=line.includes('\t')?line.split('\t'):line.split(/[,，](?=\s*[^\d])/);cells=cells.map(x=>x.trim().replace(/^"|"$/g,''));if(i===0&&/花[朵名種]|名稱/.test(cells[0]||''))return;const flower=cells[0]?.trim();if(!flower)return;const p=parseNum(cells[1]||''),n=parseNum(cells[2]||'');if(p===undefined||n===undefined||(!flower)||p===null&&n===null){warnings.push(`第 ${i+1} 行數量格式不正確或沒有數字`);return}rows.push({flower,petals:p,nectar:n,source:`第 ${i+1} 行`})});return{rows,warnings}}
function dedupe(rows){const map=new Map(),conflicts=[];for(const [rowIndex,r] of rows.entries()){if(!r.flower){map.set('__unresolved__'+rowIndex,{...r});continue}r.flower=canonical(r.flower);const prev=map.get(r.flower);if(prev){let different=(r.petals!==null&&prev.petals!==null&&r.petals!==prev.petals)||(r.nectar!==null&&prev.nectar!==null&&r.nectar!==prev.nectar);if(different)conflicts.push(`「${r.flower}」出現不同數字，暫用後一筆（${r.source}），請核對。`);map.set(r.flower,{...prev,...r,petals:r.petals??prev.petals,nectar:r.nectar??prev.nectar,source:`重複｜${r.source}`})}else map.set(r.flower,{...r})}return{rows:[...map.values()],warnings:conflicts}}
function setPreview(result){const checked=normalizePreviewRows(result);const merged=dedupe(checked.rows);preview=merged.rows;$('#previewWarnings').replaceChildren();[...checked.warnings,...merged.warnings].forEach(msg=>{const div=document.createElement('div');div.textContent='⚠ '+msg;$('#previewWarnings').append(div)});$('#previewPanel').hidden=false;renderPreview();$('#previewPanel').scrollIntoView({behavior:'smooth',block:'start'})}
function renderPreview(){const body=$('#previewBody');body.replaceChildren();preview.forEach((r,index)=>{const tr=document.createElement('tr');const tdName=document.createElement('td');const select=document.createElement('select');select.className='name-input';select.setAttribute('aria-label','正式花名');select.append(new Option(r.rawFlower?`⚠ ${r.rawFlower}：請選擇正確名稱`:'請選擇正式花名',''));for(const name of CANONICAL_NAMES){const option=new Option(flowerDisplayIcon(name)+' '+flowerDisplayName(name),name);select.add(option)}select.value=VALID_FLOWERS.has(r.flower)?r.flower:'';select.addEventListener('change',()=>{r.flower=select.value;r.rawFlower='';r.suggestedFlower='';});tdName.append(select);if(!r.flower&&r.suggestedFlower){const b=document.createElement('button');b.type='button';b.className='suggestion-btn';b.textContent='建議：'+flowerDisplayName(r.suggestedFlower)+'（點擊採用）';b.onclick=()=>{r.flower=r.suggestedFlower;r.rawFlower='';r.suggestedFlower='';renderPreview()};tdName.append(b)}tr.append(tdName);
 for(const key of ['petals','nectar']){const td=document.createElement('td'),input=document.createElement('input');input.type='number';input.min='0';input.max='9999999';input.setAttribute('aria-label',key==='petals'?'花瓣':'精華');input.value=r[key]??'';input.inputMode='numeric';input.addEventListener('input',()=>{r[key]=input.value.trim()===''?null:input.value});td.append(input);tr.append(td)}const td=document.createElement('td');td.className='muted';td.textContent=r.source||'手動新增';tr.append(td);const last=document.createElement('td'),del=document.createElement('button');del.className='remove-row';del.textContent='×';del.title='移除此列';del.addEventListener('click',()=>{preview.splice(index,1);renderPreview()});last.append(del);tr.append(last);body.append(tr)});$('#previewStats').textContent=`共 ${preview.length} 筆`}
async function commitPreview(){if(!requireEdit())return;if(busy)return;const rows=preview.map(r=>({flower:manualName(r.flower),petals:r.flower==='特殊精華'?null:parseNum(r.petals),nectar:parseNum(r.nectar)}));if(!rows.length){toast('沒有資料可以儲存',true);return}if(rows.some(r=>!r.flower||!VALID_FLOWERS.has(r.flower)||r.petals===undefined||r.nectar===undefined||(r.petals===null&&r.nectar===null))){toast('有尚未選擇的正式花名、無效數量或空白列；請修正後再儲存',true);return}const duplicates=dedupe(rows);if(duplicates.warnings.length&&!confirm(duplicates.warnings.join('\n')+'\n仍要繼續儲存？'))return;busy=true;$('#savePreview').disabled=true;try{await batchSave(duplicates.rows,selectedImportPlayer());toast(`成功儲存 ${duplicates.rows.length} 種花朵 🌸`);$('#previewPanel').hidden=true;nav('dashboard')}catch(e){toast('儲存失敗：'+e.message,true)}finally{busy=false;$('#savePreview').disabled=false}}
// Create a bulk grid from catalog choices; no free-form flower names needed.
function renderQuickCatalog(){const families=$('#quickFamilies');if(!families)return;families.replaceChildren();for(const f of Object.keys(FLOWER_CATALOG))families.add(new Option(f,f));families.size=9;const selected=$('#quickFamilySelect');selected.replaceChildren(new Option('請選花種',''));for(const f of Object.keys(FLOWER_CATALOG))selected.add(new Option(f,f));selected.add(new Option('普通精華','普'));selected.add(new Option('特殊精華','特殊精華'));families.add(new Option('普通精華','普'));families.add(new Option('特殊精華','特殊精華'));}
function quickFlowers(family){if(family==='普')return ['普白','普黃','普紅','普藍'];if(family==='特殊精華')return ['特殊精華'];if(!FLOWER_CATALOG[family])return [];return [...FLOWER_CATALOG[family]].map(c=>['櫻花','粉蝶花','向日葵'].includes(family)?family:COLOR_NAME[c]+family)}
function generateQuickRows(){if(!requireEdit())return;const families=[...$('#quickFamilies').selectedOptions].map(o=>o.value);if(!families.length){toast('請先選取至少一種花種；Windows 可按住 Ctrl 多選',true);return}const names=[...new Set(families.flatMap(quickFlowers))];const body=$('#quickGridBody');body.replaceChildren();for(const name of names){const tr=document.createElement('tr');tr.dataset.flower=name;const td=document.createElement('td');td.textContent=flowerDisplayIcon(name)+' '+flowerDisplayName(name);tr.append(td);for(const field of ['petals','nectar']){const tdN=document.createElement('td'),i=document.createElement('input');i.type='number';i.min='0';i.max='9999999';i.placeholder=name==='特殊精華'&&field==='petals'?'不適用':'留白不更新';i.disabled=name==='特殊精華'&&field==='petals';i.dataset.field=field;tdN.append(i);tr.append(tdN)}body.append(tr)}$('#quickGridPanel').hidden=false;}
function quickToPreview(){const rows=[];for(const tr of $$('#quickGridBody tr')){const flower=tr.dataset.flower;const petals=parseNum(tr.querySelector('[data-field="petals"]').value),nectar=parseNum(tr.querySelector('[data-field="nectar"]').value);if(petals===undefined||nectar===undefined){toast('只能填 0 以上的整數',true);return}if(petals!==null||nectar!==null)rows.push({flower,petals,nectar,source:'快速表格'})}if(!rows.length){toast('至少填一個數字再預覽',true);return}setPreview({rows,warnings:[]})}
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
 const accuracy=$('#scanQuality').value==='accurate';
 if(!confirm(`即將辨識 ${fileSelection.length} 張截圖。${accuracy?'精細模式：原圖＋兩張裁切圖，必要時額外呼叫模型。':'省額模式：每張只傳原圖、只呼叫一次 AI；不確定的格子請自行核對。'} 將產生 OpenAI API 費用。是否繼續？`))return;
 busy=true;$('#scanImages').disabled=true;
 try{
  $('#ocrProgress').textContent='正在準備圖片…';
  const images=[],readingCrops=[];for(let i=0;i<fileSelection.length;i++){images.push(await prepareImage(fileSelection[i]));readingCrops.push(accuracy?await makeReadingCrops(fileSelection[i]):null);}
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
     part=await gateway('scan',{images:[images[i]],mode:accuracy?'accurate':'economy',...(accuracy?{reading_crops:readingCrops[i]}:{})});
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
   if(!VALID_FLOWERS.has(flower))warnings.push(`${source}：「${flower}」不在正式花種／顏色清單，請修改為正確名稱再儲存。`);
   if(item.name_status==='review')warnings.push(`${source}：「${flower}」不在確認花種清單，請先人工修改花名。${(item.suggestions||[]).length?'可能是：'+item.suggestions.join('、'):''}`);
   if(item.name_status==='corrected')warnings.push(`${source}：花名已自動修正「${item.original_name}」→「${flower}」，請核對。`);
   if(petals===undefined||nectar===undefined){warnings.push(`${source}：${flower} 數量格式不正確，已略過。`);continue}
   if(petals===null&&nectar===null){warnings.push(`${source}：${flower} 兩個數量均無法辨識，已略過。`);continue}
   if(seen.has(flower)){const older=seen.get(flower);if(older.petals!==petals||older.nectar!==nectar)warnings.push(`${flower} 在多張截圖的數值不同，請在預覽確認；不會加總。`);else warnings.push(`${flower} 在多張截圖重複出現，已去重。`);continue}
   const row={flower,petals:flower==='特殊精華'?null:petals,nectar,source};seen.set(flower,row);rows.push(row);
   if((flower!=='特殊精華'&&petals===null)||nectar===null)warnings.push(`${source}：${flower} 有數值看不清楚，請補填。`);
  }
  warnings.push(...(data.warnings||[]).map(String));
  $('#ocrProgress').textContent=`AI 回傳 ${rows.length} 種花，請逐筆核對原圖後再儲存。`;
  setPreview({rows,warnings});
  if(!rows.length)toast('AI 沒有可靠的候選資料，請換清晰截圖或手動輸入',true);
 }catch(err){console.error(err);toast('AI 辨識失敗：'+err.message,true);$('#ocrProgress').textContent='發生錯誤：'+err.message}
 finally{busy=false;$('#scanImages').disabled=false}
}

// Analytics are calculated from the loaded cloud snapshot; no additional API permissions required.
function validQuantity(item,kind){const value=item?.[kind];return value===null||value===undefined||value===''||!Number.isFinite(Number(value))?null:Number(value)}
function fmtFullTime(value){if(!value)return '尚未更新';const dt=new Date(value);return Number.isNaN(dt.getTime())?'時間未知':dt.toLocaleString('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}
function makeEmpty(message){const p=document.createElement('p');p.className='analytics-empty';p.textContent=message;return p}
function makeRow(label,value,extra=''){label=flowerDisplayName(label);const row=document.createElement('div');row.className='analytics-row';const text=document.createElement('span');text.textContent=label;const val=document.createElement('strong');val.textContent=value;row.append(text,val);if(extra){const small=document.createElement('small');small.textContent=extra;row.append(small)}return row}
function analyticsSelections(){
 const ps=$('#analysisPlayer'),fs=$('#analysisFlower');const pOld=ps.value,fOld=fs.value;
 ps.replaceChildren();state.players.forEach((name,i)=>ps.add(new Option(name,String(i))));
 const flowers=allNames();fs.replaceChildren();flowers.forEach(name=>fs.add(new Option(flowerDisplayName(name),name)));
 ps.value=pOld&&Number(pOld)<state.players.length?pOld:'0';fs.value=flowers.includes(fOld)?fOld:(flowers[0]||'');
}
/* V20 联合低庫存：all selected players must have a registered value below threshold. */
const jointSelectedPlayers=new Set();
function renderJointPlayers(){
 const root=$('#jointPlayerOptions');if(!root)return;
 const previous=new Set(jointSelectedPlayers);
 jointSelectedPlayers.clear();
 const candidates=previous.size ? [...previous].filter(id=>id<state.players.length) : state.players.map((_,i)=>i).slice(0,Math.min(4,state.players.length));
 candidates.forEach(id=>jointSelectedPlayers.add(id));
 root.replaceChildren();
 state.players.forEach((name,id)=>{
  const label=document.createElement('label'),input=document.createElement('input');
  input.type='checkbox';input.value=String(id);input.checked=jointSelectedPlayers.has(id);
  input.addEventListener('change',()=>{if(input.checked)jointSelectedPlayers.add(id);else jointSelectedPlayers.delete(id);renderJointStatistics()});
  label.append(input,document.createTextNode(name));root.append(label);
 });
}
function renderJointStatistics(){
 const summary=$('#jointSummary'),count=$('#jointCount'),empty=$('#jointEmpty'),head=$('#jointHead'),body=$('#jointBody');
 if(!summary)return;
 const chosen=[...jointSelectedPlayers].filter(id=>id>=0&&id<state.players.length).sort((a,b)=>a-b);
 const kind=$('#jointKind').value, label=kind==='petals'?'花瓣':'精華';
 const raw=Number($('#jointThreshold').value),threshold=Number.isFinite(raw)?Math.max(0,Math.floor(raw)):0;
 head.replaceChildren();body.replaceChildren();empty.hidden=true;const topFive=$('#jointTopFive');topFive.replaceChildren();
 if(chosen.length<2){count.textContent='0 種';summary.textContent='請至少勾選 2 位玩家。';empty.textContent='需要至少 2 位玩家才可以進行聯合比較。';empty.hidden=false;return;}
 const names=allNames().filter(f=>!(kind==='petals'&&f==='特殊精華'));
 const matching=names.map(f=>({flower:f,values:chosen.map(id=>validQuantity(getItem(id,f),kind))}))
   .filter(row=>row.values.every(v=>v!==null&&v<threshold))
   .sort((a,b)=>Math.max(...a.values)-Math.max(...b.values)||compareFlowers(a.flower,b.flower,'flower'));
 count.textContent=`${matching.length} 種`;
 summary.textContent=`${chosen.map(id=>getPlayerName(id)).join('、')} · ${label}皆 < ${nfmt(threshold)} · 找到 ${matching.length} 種（由各玩家中的最高數量由低到高排列）`;
 if(!matching.length){empty.textContent='沒有符合的花種。未登記（—）不列入結果；可提高門檻或更換玩家。';empty.hidden=false;topFive.textContent='目前沒有符合的推薦。';return;}
 // V22: both the full table and the top-five recommendations use the SAME selected players, type and threshold.
 matching.slice(0,5).forEach((row,index)=>{
  const card=document.createElement('article');card.className='joint-top-card';
  const top=document.createElement('div');top.className='joint-top-card-head';
  const rank=document.createElement('span');rank.className='joint-rank';rank.textContent=`#${index+1}`;
  const flower=document.createElement('strong');flower.textContent=`${flowerDisplayIcon(row.flower)?flowerDisplayIcon(row.flower)+' ':''}${flowerDisplayName(row.flower)}`;
  const max=document.createElement('span');max.className='joint-max';max.textContent=`最高 ${nfmt(Math.max(...row.values))}`;
  top.append(rank,flower,max);
  const amounts=document.createElement('div');amounts.className='joint-top-amounts';
  chosen.forEach((id,i)=>{const pill=document.createElement('span');pill.textContent=`${getPlayerName(id)} ${nfmt(row.values[i])}`;amounts.append(pill)});
  card.append(top,amounts);topFive.append(card);
 });
 const tr=document.createElement('tr');['花朵',...chosen.map(id=>getPlayerName(id))].forEach(title=>{const th=document.createElement('th');th.textContent=title;tr.append(th)});head.append(tr);
 matching.forEach(row=>{const tr=document.createElement('tr'),td=document.createElement('td');td.textContent=flowerDisplayIcon(row.flower)?flowerDisplayIcon(row.flower)+' '+flowerDisplayName(row.flower):flowerDisplayName(row.flower);tr.append(td);row.values.forEach(value=>{const cell=document.createElement('td');cell.textContent=nfmt(value);tr.append(cell)});body.append(tr)});
}
function renderAnalytics(){
 renderJointPlayers();renderJointStatistics();analyticsSelections();const p=Number($('#analysisPlayer').value||0),kind=$('#analysisType').value,kindLabel=kind==='petals'?'花瓣':'精華';
 const limit=Math.max(0,Math.min(9999999,Math.floor(Number($('#analysisThreshold').value)||0)));
 const updateRoot=$('#playerUpdatedList');updateRoot.replaceChildren();
 state.players.forEach((name,id)=>{const items=Object.values(state.items).filter(x=>Number(x.player_id)===id);const dates=items.map(x=>x.updated_at).filter(Boolean).map(x=>Date.parse(x)).filter(Number.isFinite);const latest=dates.length?new Date(Math.max(...dates)).toISOString():null;updateRoot.append(makeRow(name,fmtFullTime(latest),`${items.length} 種已登記花朵`))});
 // 依目前總覽已有的花種，列出本玩家未登記的欄位；0 是已登記。
 const missing=[];
 for(const flowerName of allNames()){
  const record=getItem(p,flowerName);
  const gaps=[];
  if(flowerName!=='特殊精華'&&validQuantity(record,'petals')===null)gaps.push('🌸 花瓣');
  if(validQuantity(record,'nectar')===null)gaps.push('🍯 精華');
  if(gaps.length)missing.push({flower:flowerName,gaps});
 }
 const missingRoot=$('#missingStockList');missingRoot.replaceChildren();
 $('#missingCount').textContent=`${missing.length} 種`;
 if(!missing.length)missingRoot.append(makeEmpty('目前總覽中的花種都已登記完成。'));
 else{
  const info=document.createElement('p');info.className='analytics-context';
  info.textContent=`${getPlayerName(p)} · ${missing.length} 種花朵有尚未登記的欄位`;
  missingRoot.append(info);
  missing.forEach(x=>missingRoot.append(makeRow(x.flower,x.gaps.join('、'))));
 }
 const entries=Object.values(state.items).filter(x=>Number(x.player_id)===p).map(x=>({...x,amount:validQuantity(x,kind)})).filter(x=>x.amount!==null);
 const low=entries.filter(x=>x.amount<limit).sort((a,b)=>a.amount-b.amount||compareFlowers(a.flower,b.flower));
 $('#lowCount').textContent=`${low.length} 種`;
 const lowRoot=$('#lowStockList');lowRoot.replaceChildren();
 if(!low.length)lowRoot.append(makeEmpty(`${getPlayerName(p)}目前沒有已登記且${kindLabel}少於 ${nfmt(limit)} 的花朵。`));
 else{const descr=document.createElement('p');descr.className='analytics-context';descr.textContent=`${getPlayerName(p)} · ${kindLabel} < ${nfmt(limit)}（由少到多）`;lowRoot.append(descr);low.forEach(x=>lowRoot.append(makeRow(x.flower,nfmt(x.amount))))}
 const extremeRoot=$('#playerExtremes');extremeRoot.replaceChildren();
 if(!entries.length)extremeRoot.append(makeEmpty(`${getPlayerName(p)}尚未登記任何${kindLabel}數量。`));
 else{
  const min=Math.min(...entries.map(x=>x.amount)),max=Math.max(...entries.map(x=>x.amount));
  const head=document.createElement('p');head.className='analytics-context';head.textContent=`${getPlayerName(p)} · ${kindLabel}（已登記 ${entries.length} 種）`;extremeRoot.append(head);
  for(const [title,v] of [['📉 最少',min],['📈 最多',max]]){const sub=document.createElement('h3');sub.className='analytics-subhead';sub.textContent=`${title}：${nfmt(v)}`;extremeRoot.append(sub);entries.filter(x=>x.amount===v).sort((a,b)=>compareFlowers(a.flower,b.flower)).forEach(x=>extremeRoot.append(makeRow(x.flower,nfmt(x.amount))))}
 }
 const flower=$('#analysisFlower').value,cmpRoot=$('#flowerCompare');cmpRoot.replaceChildren();
 if(!flower){cmpRoot.append(makeEmpty('還沒有任何花朵紀錄。'));return}
 const cmp=state.players.map((name,id)=>({name,id,amount:validQuantity(getItem(id,flower),kind)}));
 const registered=cmp.filter(x=>x.amount!==null);
 const msg=document.createElement('p');msg.className='analytics-context';msg.textContent=`${flowerDisplayName(flower)} · ${kindLabel}（已登記 ${registered.length}/${state.players.length} 人）`;cmpRoot.append(msg);
 if(!registered.length){cmpRoot.append(makeEmpty('此花朵目前沒有已登記的數量。'));return}
 const min=Math.min(...registered.map(x=>x.amount)),max=Math.max(...registered.map(x=>x.amount));
 const maxNames=registered.filter(x=>x.amount===max).map(x=>x.name).join('、');const minNames=registered.filter(x=>x.amount===min).map(x=>x.name).join('、');
 cmpRoot.append(makeRow('🏆 最多：'+maxNames,nfmt(max)));cmpRoot.append(makeRow('📉 最少：'+minNames,nfmt(min)));
 const separator=document.createElement('h3');separator.className='analytics-subhead';separator.textContent='所有玩家（由多到少）';cmpRoot.append(separator);
 cmp.sort((a,b)=>(b.amount??-1)-(a.amount??-1)||a.id-b.id).forEach(x=>cmpRoot.append(makeRow(x.name,nfmt(x.amount))));
}

function renderHistory(){const root=$('#historyList');root.replaceChildren();if(!state.history.length){const p=document.createElement('p');p.className='empty';p.textContent='尚無更新紀錄 🌱';root.append(p);return}for(const h of state.history.slice(0,100)){const row=document.createElement('div');row.className='history-entry';const left=document.createElement('div'),strong=document.createElement('strong'),p=document.createElement('p'),tm=document.createElement('time');strong.textContent=`${getPlayerName(h.player_id)} · ${flowerDisplayName(h.flower)}`;p.textContent=`🌸 ${nfmt(h.old_petals)} → ${nfmt(h.new_petals)}　🍯 ${nfmt(h.old_nectar)} → ${nfmt(h.new_nectar)}`;tm.textContent=timeText(h.changed_at);left.append(strong,p);row.append(left,tm);root.append(row)}}
function renderDeleteOptions(){
 const f=$('#deleteFlower'),scope=$('#deleteScope');if(!f||!scope)return;
 const old=f.value,oldScope=scope.value,names=allNames();
 f.replaceChildren(...names.map(n=>new Option(flowerDisplayName(n),n)));
 if(names.includes(old))f.value=old;
 scope.replaceChildren(new Option('所有玩家（刪除此花名的全部庫存）','all'),...state.players.map((n,i)=>new Option(n,String(i))));
 if(oldScope==='all'||(oldScope!==''&&Number.isInteger(+oldScope)&&+oldScope>=0&&+oldScope<state.players.length))scope.value=oldScope;
 $('#deleteInventory').disabled=!canEdit()||!names.length;
}
async function deleteStoredInventory(flower,playerId){
 if(!requireEdit())return false;
 const actual=String(flower||'');const rows=Object.values(state.items).filter(x=>x.flower===actual&&(playerId===null||x.player_id===playerId));
 if(!rows.length){toast('這個範圍沒有可刪除的紀錄',true);return false}
 const label=playerId===null?'所有玩家':getPlayerName(playerId);
 if(!confirm(`確定刪除「${actual}」在「${label}」的 ${rows.length} 筆庫存？\n此操作會從 Supabase 真正刪除紀錄，無法直接復原。`))return false;
 try{
  await gateway('delete_inventory',{flower:actual,player_id:playerId});
  await fetchCloud();toast(`已刪除 ${rows.length} 筆「${actual}」庫存`);return true;
 }catch(e){toast('刪除失敗：'+e.message,true);return false}
}
async function deleteFromSettings(){
 const flower=$('#deleteFlower').value,typed=$('#deleteConfirmName').value.trim(),scope=$('#deleteScope').value;
 if(!flower||typed!==flower){toast('請輸入與選擇完全一致的花名',true);return}
 const success=await deleteStoredInventory(flower,scope==='all'?null:Number(scope));
 if(success)$('#deleteConfirmName').value='';
}
async function deleteFromEdit(){
 if(!editContext)return;const {player,flower}=editContext;
 if(await deleteStoredInventory(flower,player))$('#editDialog').close();
}
function renderSettings(){const container=$('#playerNames');container.replaceChildren();state.players.forEach((name,i)=>{const label=document.createElement('label');label.textContent=`玩家 ${i+1}`;const input=document.createElement('input');input.value=name;input.dataset.playerIndex=i;input.maxLength=28;label.append(input);container.append(label)});renderDeleteOptions();const cfg=getConfig();$('#sbUrl').value=cfg.url||'';$('#sbKey').value=cfg.key||'';setStatus()}
async function savePlayerNames(){if(!requireEdit())return;const players=$$('#playerNames input').map(el=>el.value.trim());if(players.some(n=>!n)){toast('玩家名稱不能空白',true);return}try{if(sb){await gateway('rename',{players});await fetchCloud()}else{state.players=players;saveLocal();renderPlayerSelects();renderTable()}toast('玩家名稱已更新')}catch(e){toast(e.message,true)}}
async function addPlayer(){if(!requireEdit())return;const name=$('#newPlayerName').value.trim();if(!name||name.length>28){toast('請輸入 1～28 個字的玩家名稱',true);return}try{if(sb){await gateway('add_player',{name});await fetchCloud()}else{state.players.push(name);saveLocal();renderPlayerSelects();renderTable();renderSettings()}$('#newPlayerName').value='';toast('已新增玩家 '+name)}catch(e){toast('新增失敗：'+e.message,true)}}
function csvCell(v){let s=String(v??'');return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function exportCsv(){const rows=[['玩家編號','玩家名稱','花朵','花瓣','精華','最後更新'],...Object.values(state.items).sort((a,b)=>a.player_id-b.player_id||a.flower.localeCompare(b.flower,'zh-Hant')).map(i=>[i.player_id+1,getPlayerName(i.player_id),i.flower,i.petals??'',i.nectar??'',i.updated_at||''])];const csv='\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n');const a=document.createElement('a'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.href=url;a.download=`pikmin-inventory-${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('已下載 CSV 備份')}
function parseCsv(csv){let rows=[],record=[],field='',quoted=false;for(let i=0;i<csv.length;i++){const c=csv[i];if(quoted){if(c==='"'&&csv[i+1]==='"'){field+='"';i++}else if(c==='"')quoted=false;else field+=c}else if(c==='"')quoted=true;else if(c===','){record.push(field);field=''}else if(c==='\n'){record.push(field.replace(/\r$/,''));rows.push(record);record=[];field=''}else field+=c}if(field||record.length){record.push(field);rows.push(record)}return rows}
async function importCsv(file){if(!requireEdit())return;const content=(await file.text()).replace(/^\ufeff/,'');let rows=parseCsv(content).slice(1);if(!rows.length){toast('CSV 檔案沒有資料',true);return}const groups=new Map();for(const cells of rows){const p=Number(cells[0])-1,flower=manualName(cells[2]);if(!Number.isInteger(p)||p<0||p>=state.players.length||!flower)throw Error(`CSV 中有非法花名「${cells[2]}」或玩家編號；請先修正再匯入`);const petals=parseNum(cells[3]),nectar=parseNum(cells[4]);if(petals===undefined||nectar===undefined)throw Error('CSV 數量格式不正確');if(!groups.has(p))groups.set(p,[]);groups.get(p).push({flower,petals,nectar})}if(!groups.size){toast('CSV 格式不符合備份格式',true);return}if(!confirm(`將從 CSV 匯入 ${[...groups.values()].reduce((s,v)=>s+v.length,0)} 筆資料（共 ${groups.size} 位玩家）。會覆蓋有提供數字的欄位，確定嗎？`))return;try{for(const [p,items] of groups)await batchSave(items,p);toast('CSV 已匯入');nav('dashboard')}catch(e){toast('匯入失敗：'+e.message,true)}}
function getConfig(){try{const saved=JSON.parse(localStorage.getItem(CONFIG))||{};return {url:saved.url||DEFAULT_URL,key:saved.key||''}}catch{return {url:DEFAULT_URL,key:''}}}
function initializeClient(){const cfg=getConfig();sb=cfg.url?cfg:null;setStatus()}
async function gateway(action,body={}){const cfg=getConfig();if(!cfg.url)throw Error('缺少 Supabase 網址');const url=cfg.url.replace(/\/$/,'')+'/functions/v1/flower-gateway';const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(cfg.key?{'apikey':cfg.key}:{}),...(token?{'Authorization':'Bearer '+token}:{})},cache:'no-store',body:JSON.stringify({action,...body})});let data;try{data=await response.json()}catch{throw Error(`伺服器回傳格式錯誤 (${response.status})，請確認已部署 flower-gateway 並關閉 Verify JWT`)}if(!response.ok){if(response.status===401&&action!=='login'){token='';localStorage.removeItem(SESSION);setStatus()}throw Error(data?.error||`連線錯誤 ${response.status}`)}return data}
function assignSnapshot(result,publicMode=false){
 if(!Array.isArray(result.players)||!Array.isArray(result.inventory))throw Error('雲端回傳格式不正確');
 state.players=result.players.map(p=>p.name);
 state.items={};for(const x of result.inventory)state.items[`${x.player_id}::${x.flower}`]=x;
 state.history=publicMode?[]:(result.history||[]);
 latestSync=new Date().toISOString();syncError='';
 try{localStorage.setItem(PUBLIC_CACHE,JSON.stringify({url:getConfig().url,players:result.players,inventory:result.inventory,savedAt:latestSync}))}catch{}
 renderPlayerSelects();renderTable();if(page==='analytics')renderAnalytics();if(page==='history')renderHistory();if(page==='settings')renderSettings();
 setStatus();
}
function showCachedSnapshot(){
 try{const cached=JSON.parse(localStorage.getItem(PUBLIC_CACHE)||'null');if(cached?.url!==getConfig().url||!Array.isArray(cached?.inventory)||!Array.isArray(cached?.players))return;
 state.players=cached.players.map(p=>p.name);state.items={};for(const x of cached.inventory)state.items[`${x.player_id}::${x.flower}`]=x;
 latestSync=cached.savedAt||null;renderPlayerSelects();renderTable();if(page==='analytics')renderAnalytics();setStatus();
 }catch(e){console.warn('cached snapshot unavailable',e)}
}
async function fetchPublic(){if(!sb)return;const result=await gateway('public_bootstrap');assignSnapshot(result,true)}
async function fetchCloud(){if(!sb||!token)return;const result=await gateway('bootstrap');assignSnapshot(result,false)}
async function reloadCloud(silent=false){
 if(!sb)return;
 if(syncInFlight)return syncInFlight;
 syncInFlight=(async()=>{
  try{if(token)await fetchCloud();else await fetchPublic();return true}
  catch(e){
   // Only a real 401 should cause the session to be removed (handled in gateway).
   if(!token){try{await fetchPublic();return true}catch(publicError){e=publicError}}
   syncError='無法讀取雲端：'+(e?.message||'請確認網路及 Supabase 狀態');setStatus();
   if(!silent)toast(syncError,true);return false;
  }
 })();
 try{return await syncInFlight}finally{syncInFlight=null}
}
async function connect(){
 initializeClient();if(!sb)return;
 showCachedSnapshot();await reloadCloud(false);
}
async function signIn(){
 initializeClient();if(!sb){toast('尚未設定雲端網址',true);return}
 const password=$('#password').value;if(!password){toast('請輸入共用密碼',true);return}
 try{const result=await gateway('login',{password});token=result.token;localStorage.setItem(SESSION,token);$('#password').value='';await fetchCloud();setStatus();toast('登入成功！下次開啟會自動登入')}catch(e){token='';localStorage.removeItem(SESSION);toast('登入失敗：'+e.message,true)}
}
async function signOut(){token='';localStorage.removeItem(SESSION);await reloadCloud();setStatus();toast('已登出，仍可公開查看資料')}
async function setConfig(){
 const url=$('#sbUrl').value.trim(),key=$('#sbKey').value.trim();
 if(!/^https:\/\/[^/]+\.supabase\.co\/?$/.test(url)){toast('請輸入正確的 Supabase Project URL',true);return}
 if(/service_role|sb_secret_/i.test(key)){toast('不要使用 secret / service_role 金鑰',true);return}
 localStorage.setItem(CONFIG,JSON.stringify({url,key}));token='';localStorage.removeItem(SESSION);initializeClient();await reloadCloud();toast('設定已儲存；已嘗試讀取雲端庫存');
}

function setTab(next){activeTab=next;$$('.tab').forEach(el=>el.classList.toggle('active',el.dataset.tab===next));$$('.tab-body').forEach(el=>el.classList.toggle('active',el.id===`tab-${next}`))}
function bind(){ $$('.nav-item').forEach(el=>el.addEventListener('click',()=>nav(el.dataset.page)));$$('.tab').forEach(el=>el.addEventListener('click',()=>setTab(el.dataset.tab)));$('#quickImport').addEventListener('click',()=>nav('import'));$('#authBtn').addEventListener('click',()=>nav('settings'));$('#searchInput').addEventListener('input',renderTable);$('#colorFilter').addEventListener('change',renderTable);$('#sortMode').addEventListener('change',e=>{localStorage.setItem('flower-station-sort-mode',e.target.value);renderTable()});for(const id of ['analysisPlayer','analysisType','analysisThreshold','analysisFlower']){$('#'+id).addEventListener(id==='analysisThreshold'?'input':'change',renderAnalytics)}$('#playerFilter').addEventListener('change',renderTable);for(const id of ['jointKind','jointThreshold'])$('#'+id).addEventListener(id==='jointThreshold'?'input':'change',renderJointStatistics);$('#generateQuick').addEventListener('click',generateQuickRows);$('#quickPreview').addEventListener('click',quickToPreview);$('#quickFamilySelect').addEventListener('change',e=>{for(const o of $('#quickFamilies').options)o.selected=o.value===e.target.value});$('#parseText').addEventListener('click',()=>setPreview(parseText($('#textInput').value)));$('#parseSheet').addEventListener('click',()=>setPreview(parseSheet($('#sheetInput').value)));$('#imageInput').addEventListener('change',e=>{fileSelection=[...e.target.files];$('#imageFileList').textContent=fileSelection.length?`✅ 已選擇 ${fileSelection.length} 張：${fileSelection.map(f=>f.name).join('、')}${fileSelection.length>3?' ⚠️ 每次最多 3 張，請重新選擇。':''}${!canEdit()?' ｜請先按右上角「登入以編輯」':''}`:'';});$('#scanImages').addEventListener('click',scanScreenshots);$('#addPreviewRow').addEventListener('click',()=>{preview.push({flower:'',petals:null,nectar:null,source:'手動新增'});renderPreview()});$('#savePreview').addEventListener('click',commitPreview);$('#editForm').addEventListener('submit',async e=>{if(e.submitter?.value!=='save')return;e.preventDefault();await saveEdit();$('#editDialog').close()});$('#deleteInventory').addEventListener('click',deleteFromSettings);$('#editDelete').addEventListener('click',deleteFromEdit);$('#savePlayers').addEventListener('click',savePlayerNames);$('#addPlayer').addEventListener('click',addPlayer);$('#saveCloud').addEventListener('click',setConfig);$('#disconnectCloud').addEventListener('click',async()=>{await signOut()});$('#signIn').addEventListener('click',signIn);$('#signOut').addEventListener('click',signOut);$('#exportCsv').addEventListener('click',exportCsv);$('#csvFile').addEventListener('change',async e=>{if(e.target.files[0])await importCsv(e.target.files[0]);e.target.value=''});$('#reloadHistory').addEventListener('click',async()=>{if(sb)try{if(token)await fetchCloud();else await fetchPublic()}catch(e){toast(e.message,true)}renderHistory()})}
async function init(){const savedSort=localStorage.getItem('flower-station-sort-mode');if(['flower','color','name'].includes(savedSort))$('#sortMode').value=savedSort;bind();renderQuickCatalog();renderPlayerSelects();renderTable();renderHistory();renderSettings();await connect();
 setInterval(()=>{if(!document.hidden&&sb&&!busy)reloadCloud(true)},45000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&sb&&!busy)reloadCloud(true)});
 window.addEventListener('online',()=>{if(sb)reloadCloud(false)});
 $('#refreshCloud').addEventListener('click',()=>reloadCloud(false));
}
window.addEventListener('load',init);
})();

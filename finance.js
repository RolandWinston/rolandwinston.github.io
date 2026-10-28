(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const el = (tag,text,cls) => {const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
  const fmt = v => v === null || v === undefined ? '待核对' : new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2}).format(v);
  const pct = v => v === null || v === undefined ? '待核对' : fmt(v)+'%';
  const date = v => String(v || '待核对').slice(0,10);
  const link = (text,url) => {const a=el('a',text,'text-link');a.href=url;return a;};
  const root=new URL('.',document.currentScript.src);
  async function load(name){const r=await fetch(new URL('documents/'+name,root));if(!r.ok)throw Error('资料正在准备，请稍后刷新。');return r.json();}
  function resultTable(rows,container,size=10){
    let page=0;
    const nav=el('div',undefined,'finance-toolbar'), status=el('span'),prev=el('button','上一页'),next=el('button','下一页');prev.type=next.type='button';nav.append(prev,status,next);
    const scroll=el('div',undefined,'data-scroll');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label','历史研究结果，可横向滚动');
    const table=el('table',undefined,'showcase-table'),thead=el('thead'),tr=el('tr'),tbody=el('tbody');
    ['研究日期与市场','期间','本金','保证金设置','历史最高名义敞口 / 净权益','成本与路径','净年化','总收益','最大回撤','开仓 / 完整回合','停机状态'].forEach(t=>{const th=el('th',t);th.scope='col';tr.append(th);});thead.append(tr);table.append(thead,tbody);scroll.append(table);container.append(scroll,nav);
    function render(){tbody.replaceChildren();for(const r of rows.slice(page*size,page*size+size)){
      const row=el('tr');const cells=[`${date(r.date)} · ${r.symbol||'待核对'}`,`${date(r.periodStart)} 起，${date(r.periodEnd)} 前`,fmt(r.capital),r.leverage != null ? fmt(r.leverage)+'倍':'现金价格代理',r.exposure != null ? fmt(r.exposure)+'倍':'待核对',`${r.cost||'待核对'}；${r.path||'待核对'}`,pct(r.netCagrPct),pct(r.netReturnPct),pct(r.maxDrawdownPct),`${fmt(r.entries)} / ${fmt(r.completeRounds)}`,r.halted===true?'回测触发停机':r.halted===false?'回测持续运行':'待核对'];cells.forEach(c=>row.append(el('td',c)));tbody.append(row);
    }status.textContent=`第 ${page*size+1}—${Math.min(rows.length,(page+1)*size)} 条，共 ${rows.length} 条`;prev.disabled=page===0;next.disabled=(page+1)*size>=rows.length;}
    prev.onclick=()=>{page--;render();};next.onclick=()=>{page++;render();};render();
  }
  function chart(c,parent){
    const fig=el('figure'),heading=el('h4',c.title),wrap=el('div',undefined,'research-chart'),caption=el('figcaption',c.caption),readout=el('p',undefined,'chart-readout');
    const slider=el('input');slider.type='range';slider.min='0';slider.max=String(c.points.length-1);slider.value=slider.max;slider.setAttribute('aria-label','选择曲线日期');slider.style.width='100%';
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('role','img');svg.setAttribute('aria-label',`${c.title}，${c.caption}`);wrap.append(svg);fig.append(heading,wrap,caption,slider,readout);parent.append(fig);
    let selected=c.points.length-1;
    function draw(){
      const w=Math.max(270,wrap.clientWidth),h=290,pad={l:66,r:20,t:32,b:42};svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.style.width='100%';svg.style.height=h+'px';svg.replaceChildren();
      const vals=c.points.map(p=>p[1]),ts=c.points.map(p=>Date.parse(p[0]));let lo=Math.min(...vals),hi=Math.max(...vals),range=hi-lo||Math.max(1,Math.abs(hi)*.1);lo-=range*.08;hi+=range*.08;
      const x=t=>pad.l+(t-ts[0])/(ts.at(-1)-ts[0]||1)*(w-pad.l-pad.r),y=v=>h-pad.b-(v-lo)/(hi-lo)*(h-pad.t-pad.b);
      function node(tag,attrs,text){const e=document.createElementNS(svg.namespaceURI,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;svg.append(e);return e;}
      const num=v=>Math.abs(v)>0&&Math.abs(v)<.001?v.toExponential(1):new Intl.NumberFormat('zh-CN',{maximumFractionDigits:3}).format(v);
      for(let i=0;i<4;i++){const v=lo+(hi-lo)*i/3;node('line',{x1:pad.l,y1:y(v),x2:w-pad.r,y2:y(v),stroke:'#dfe7ec','stroke-width':1});node('text',{x:pad.l-8,y:y(v)+4,'text-anchor':'end','font-size':12,fill:'#405565'},num(v));}
      node('text',{x:pad.l,y:16,'font-size':12,fill:'#405565'},c.title.includes('净值')?'账户净值 · 起点 1':'指标读数');
      if(lo<0&&hi>0)node('line',{x1:pad.l,y1:y(0),x2:w-pad.r,y2:y(0),stroke:'#879ca9','stroke-width':1.5});
      node('path',{d:c.points.map((p,i)=>(i?'L':'M')+x(ts[i]).toFixed(2)+','+y(p[1]).toFixed(2)).join(' '),fill:'none',stroke:'#216789','stroke-width':2});
      const ticks=w<500?[0,c.points.length-1]:[0,Math.floor(c.points.length/2),c.points.length-1];for(const i of ticks)node('text',{x:x(ts[i]),y:h-12,'text-anchor':i===0?'start':i===c.points.length-1?'end':'middle','font-size':12,fill:'#405565'},c.points[i][0]);
      node('circle',{cx:x(ts[selected]),cy:y(vals[selected]),r:4,fill:'#c45926',stroke:'white','stroke-width':1.5});
      readout.textContent=`${c.points[selected][0]} · ${num(vals[selected])}`;
    }
    slider.oninput=()=>{selected=Number(slider.value);draw();};new ResizeObserver(draw).observe(wrap);draw();
    const values=el('details'),summary=el('summary','查看曲线数值');values.append(summary);fig.append(values);values.addEventListener('toggle',()=>{if(!values.open||values.dataset.ready)return;values.dataset.ready='1';const box=el('div',undefined,'data-scroll');box.tabIndex=0;box.style.maxHeight='300px';const t=el('table',undefined,'showcase-table');const head=el('thead');const hr=el('tr');['日期','读数'].forEach(v=>hr.append(el('th',v)));head.append(hr);const b=el('tbody');for(const p of c.points){const r=el('tr');r.append(el('td',p[0]),el('td',String(p[1])));b.append(r);}t.append(head,b);box.append(t);values.append(box);});
  }
  async function main(){
    const d=await load('finance-catalog.json');
    if($('finance-list')){
      const items=[];
      for(const item of d.items){const detail=el('details',undefined,'research-item');detail.id='research-'+item.id;const summary=el('summary'),head=el('div');head.append(el('span',item.group,'item-group'),el('h3',item.name),el('span',item.purpose,'item-purpose'));summary.append(head);detail.append(summary);$('finance-list').append(detail);items.push({item,detail});
        detail.addEventListener('toggle',()=>{if(!detail.open||detail.dataset.ready)return;detail.dataset.ready='1';const body=el('div',undefined,'item-body');body.append(el('p',item.stage,'item-stage'));if(item.exposureLabel)body.append(el('p',item.exposureLabel));for(const c of item.charts)chart(c,body);body.append(link('查看研究口径与全部情景 ↗',new URL('documents/finance-notes.html?item='+encodeURIComponent(item.id),root)));if(item.results.length){body.append(el('h4','历史候选结果'));resultTable(item.results,body);}else body.append(el('p',item.resultSummary||'历史批次已保存。','results-caption'));detail.append(body);});
      }
      function filter(){const q=$('finance-search').value.trim().toLowerCase(),kind=$('finance-kind').value,group=$('finance-group').value;let count=0;for(const{item,detail}of items){const hit=(!q||[item.name,item.purpose,...(item.aliases||[])].join(' ').toLowerCase().includes(q))&&(!kind||kind===item.kind)&&(!group||group===item.group);detail.hidden=!hit;if(hit)count++;} $('finance-count').textContent=`显示 ${count} 条，共 ${d.items.length} 条`; $('finance-empty').hidden=count>0;}
      ['finance-search','finance-kind','finance-group'].forEach(id=>$(id).addEventListener(id==='finance-search'?'input':'change',filter));$('finance-reset').onclick=()=>{$('finance-search').value='';$('finance-kind').value='';$('finance-group').value='';filter();};filter();
      const id=new URLSearchParams(location.search).get('item');const chosen=items.find(x=>x.item.id===id);if(chosen){chosen.detail.open=true;chosen.detail.scrollIntoView({block:'start'});}
    }
    if($('note-item')){const notes=await load('finance-context.json');for(const item of d.items){const option=el('option',item.name);option.value=item.id;$('note-item').append(option);}const id=new URLSearchParams(location.search).get('item');if(d.items.some(i=>i.id===id))$('note-item').value=id;
      function show(){const id=$('note-item').value,item=d.items.find(i=>i.id===id),note=notes.items[id],out=$('finance-note');out.replaceChildren(el('h3',item.name));const ctx=note?.context||{};for(const[k,v]of Object.entries(ctx)){if(v==null||v==='')continue;const labels={method:'研究方法',costs:'成本口径',adverse:'不利情景与边界',status:'版本状态',source:'来源',formula:'指标口径'};out.append(el('h4',labels[k]||'补充记录'),el('p',typeof v==='string'?v:JSON.stringify(v)));}const s=notes.sources[item.sourceKey];if(s)out.append(el('p',`来源：${s.title} · ${s.date}`));if(item.originUrl)out.append(link('打开原始参考 ↗',item.originUrl));const all=note?.allScenarios||[];if(all.length){out.append(el('h4',`全部 ${all.length} 条情景`));resultTable(all,out,25);}else out.append(el('p','该条目保留目录和已有批次状态；完整结果尚待逐项映射。'));out.append(link('返回本项展示 ↗',new URL('projects/finance.html?item='+encodeURIComponent(id)+'#catalog',root)));history.replaceState(null,'','?item='+encodeURIComponent(id));}
      $('note-item').onchange=show;show();const ul=el('ul',undefined,'note-list');for(const s of Object.values(notes.sources))ul.append(el('li',`${s.title} · ${s.date}`));$('finance-sources').append(ul);
    }
  }
  main().catch(e=>{const target=$('finance-count')||$('finance-note');if(target){target.textContent=e.message;target.setAttribute('role','alert');}});
})();

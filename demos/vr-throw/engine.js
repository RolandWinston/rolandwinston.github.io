(function(root){
'use strict';
const defaults={schemaVersion:1,action:'throw-right',minReleaseSpeed:0.2,maxReleaseSpeed:8,velocityScale:1,gravity:9.81,maxFlightSeconds:3,releaseCooldown:0.25,requireTracked:true};
const ranges={minReleaseSpeed:[0,5],maxReleaseSpeed:[0.1,15],velocityScale:[0.1,3],gravity:[1,20],maxFlightSeconds:[0.2,5],releaseCooldown:[0,2]};
function issue(field,message,fix){return {field,message,fix};}
function validate(value){
 const errors=[];
 if(!value||typeof value!=='object'||Array.isArray(value))return [issue('规则','需要一个 JSON 对象','从示例规则开始，保留最外层的大括号。')];
 for(const key of Object.keys(value))if(!Object.prototype.hasOwnProperty.call(defaults,key))errors.push(issue(key,'不是本示例支持的字段','删除这个字段；游戏 API 和可执行代码不能放进规则。'));
 for(const key of Object.keys(defaults))if(!Object.prototype.hasOwnProperty.call(value,key))errors.push(issue(key,'缺少这个字段','从示例规则中补回它。'));
 if(value.schemaVersion!==1)errors.push(issue('schemaVersion','本版本只接受 1','把版本号设为 1。'));
 if(value.action!=='throw-right')errors.push(issue('action','本示例支持右手松手投掷','使用 throw-right。'));
 if(value.requireTracked!==true)errors.push(issue('requireTracked','投掷需要有效追踪','保持 true；失追踪时不能猜测松手速度。'));
 for(const [key,[low,high]] of Object.entries(ranges))if(typeof value[key]!=='number'||!Number.isFinite(value[key])||value[key]<low||value[key]>high)errors.push(issue(key,`需要 ${low} 到 ${high} 之间的数字`,`填写范围内的数字，不要加单位或引号。`));
 if(Number.isFinite(value.minReleaseSpeed)&&Number.isFinite(value.maxReleaseSpeed)&&value.minReleaseSpeed>value.maxReleaseSpeed)errors.push(issue('minReleaseSpeed','不能大于最大速度','降低最小速度，或提高 maxReleaseSpeed。'));
 return errors;
}
function parse(text){try{const value=JSON.parse(text);return {value,errors:validate(value)};}catch(e){return {value:null,errors:[issue('JSON 格式','格式不正确，尚未应用','检查逗号、双引号和大括号；只粘贴 JSON，不带 Markdown 代码围栏。')]};}}
function validPose(p){return !!p&&p.tracked===true&&p.position&&['x','y','z'].every(k=>typeof p.position[k]==='number'&&Number.isFinite(p.position[k])&&Math.abs(p.position[k])<=100);}
function checkMotion(clip){if(!clip||clip.schemaVersion!==1||!Array.isArray(clip.frames)||clip.frames.length<2||clip.frames.length>1801)throw Error('动作文件需要 2–1801 帧，且版本为 1。');let prev=-1;for(const f of clip.frames){if(!f||!Number.isFinite(f.time)||f.time<0||f.time<=prev||f.time>31||typeof f.rightHeld!=='boolean')throw Error('动作时间必须递增，且需要右手扳机状态。');prev=f.time;}return true;}
function run(clip,rules){const errors=validate(rules);if(errors.length)throw Error(errors[0].field+'：'+errors[0].message);checkMotion(clip);
 const releases=[],skipped=[];let last=-Infinity;
 for(let i=1;i<clip.frames.length;i++){const a=clip.frames[i-1],b=clip.frames[i];if(!a.rightHeld||b.rightHeld)continue;
  const dt=b.time-a.time;if(!validPose(a.rightGrip)||!validPose(b.rightGrip)||dt<=0.001||dt>0.1){skipped.push({frame:i,reason:'松手附近失追踪或采样间隔过大'});continue;}
  if(b.time-last<rules.releaseCooldown){skipped.push({frame:i,reason:'还在松手冷却时间内'});continue;}
  const from={...b.rightGrip.position};let v={};for(const k of ['x','y','z'])v[k]=(b.rightGrip.position[k]-a.rightGrip.position[k])/dt;
  const rawSpeed=Math.hypot(v.x,v.y,v.z);if(rawSpeed<rules.minReleaseSpeed){skipped.push({frame:i,reason:`松手速度 ${rawSpeed.toFixed(2)}m/s 低于 ${rules.minReleaseSpeed}m/s`});continue;}
  const factor=Math.min(rawSpeed*rules.velocityScale,rules.maxReleaseSpeed)/Math.max(rawSpeed,1e-9);for(const k of ['x','y','z'])v[k]*=factor;
  const points=[];let landed=false;
  for(let step=0;step<=Math.ceil(rules.maxFlightSeconds*120);step++){const t=Math.min(step/120,rules.maxFlightSeconds);const p={x:from.x+v.x*t,y:from.y+v.y*t-.5*rules.gravity*t*t,z:from.z+v.z*t,time:t};if(p.y<=0){p.y=0;landed=true;}points.push(p);if(landed||t>=rules.maxFlightSeconds)break;}
  const end=points[points.length-1];releases.push({frame:i,time:b.time,rawSpeed,speed:Math.hypot(v.x,v.y,v.z),range:Math.hypot(end.x-from.x,end.z-from.z),landed,points});last=b.time;
 }
 return {source:clip.source||'unknown',frames:clip.frames.length,releases,skipped};
}
function requestText(goal,pack,rules=defaults){return `请帮我修改一个 VR Lab 右手投掷示例。\n\n我的需求：${goal.trim()}\n\n运行环境：VR Lab 离线动作回放；当前模型 ${pack.modelLabel}；动作来源 ${pack.motion.source}。这是规则数据任务。\n请只返回一个 JSON 对象，保留下列全部字段；不要返回 JavaScript、Python、Lua 或游戏 API。\n${JSON.stringify(rules,null,2)}\n\n参数范围：${JSON.stringify(ranges)}。requireTracked 必须为 true；minReleaseSpeed 不能大于 maxReleaseSpeed。\n速度单位 m/s，重力单位 m/s²。投掷在 rightHeld 从 true 变 false 时触发。你可调整力度、速度门槛、重力和飞行时限。这里没有目标游戏接口；不要声称已经控制了某个游戏。\n解释你修改了什么时，请另给一段文字，不要混进 JSON。`;}
const api={defaults,ranges,validate,parse,checkMotion,run,requestText};root.VRLabKitEngine=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

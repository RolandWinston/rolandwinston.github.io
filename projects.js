(() => {
  const form=document.querySelector('#brief-form');
  if(form){
    const result=document.querySelector('#brief-result'),status=document.querySelector('#brief-status');
    const checks={asset:'尺寸与透明通道；边缘与缺帧；资源命名和登记；目标场景中的显示与动画。',code:'输入输出与异常状态；相关差异；启动与主要操作；回退路径。',review:'原始输入与最新版本；逐项对照；保护内容；缺项、冲突与待人工决定项。'};
    const generate=()=>{
      const goal=document.querySelector('#brief-goal').value.trim();
      const limits=document.querySelector('#brief-limits').value.trim();
      result.value=`任务目标\n${goal}\n\n输入与来源\n开始前确认文件、版本、使用场景和可改范围。\n\n约束\n${limits || '执行前明确本轮范围和禁止改动项。'}\n\n执行与回传\n先定位依赖，给出实现步骤；回传修改文件、差异、运行命令及退出码。\n\n验收检查\n${checks[document.querySelector('#brief-type').value]}\n\n交付\n记录产物入口、实际通过项、失败样本、遗留问题和恢复位置。UI 由使用者手动确认。`;
    };
    form.addEventListener('submit',e=>{e.preventDefault();generate();status.textContent='工单已生成，可复制或下载。';});
    document.querySelector('#copy-brief').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(result.value);status.textContent='工单已复制。';}catch{result.focus();result.select();status.textContent='请按 Ctrl+C 复制已选中的内容。';}});
    document.querySelector('#download-brief').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([result.value],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='项目执行工单.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='工单 TXT 已生成。';});
    generate();
  }
  const stages={
    data:['INPUT / DATA IDENTITY','先确认输入是否一致','缓存数据按时间、标的和版本识别。审计核对 606,550 根原始数据，并在处理前后核对 442 项冻结输入。','10 标的的 15 分钟数据与冻结清单','时间范围、数据身份和 SHA-256 一致性','可复核的输入清单与审计回执'],
    signal:['VALIDATION / CAUSALITY','独立重建信号','独立计算器不调用原策略函数，从完整预热数据重建 37,364 行信号；保存的回执记录 40 项因果检查通过。','完整预热源、原信号和策略规则','逐行核对、因果断言与输入不变性','信号差异报告与历史审计结论'],
    execution:['STATE / RECONCILIATION','请求与成交是不同的状态','控制台区分选择、pending、实际执行和成交确认。未知订单回执进入待核对状态，阻止盲目重复提交。','版本选择、请求记录和订单账本','额度、精度、报价时效、持仓与未知订单','可追踪的状态和异常处理记录'],
    delivery:['RELEASE / VERIFICATION','交付绑定到具体版本','2026-10-14 版本保存了 79 项执行/安装和 24 项控制台检查回执。7 个固定文件记录变更前后 SHA；新 ETH 包仍未部署。','固定文件清单、前置版本和测试回执','安装前置核对、代码回退、账本保留','待人工 UI 验收的本地交付包']
  };
  document.querySelectorAll('[data-stage]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    const values=stages[button.dataset.stage];
    ['stage-tag','stage-title','stage-copy','stage-input','stage-check','stage-output'].forEach((id,index)=>document.getElementById(id).textContent=values[index]);
  }));
})();

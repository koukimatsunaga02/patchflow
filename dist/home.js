'use strict';
(function(){
  // Old editing links keep their capability fragment when the homepage becomes the root.
  const current=new URL(location.href);
  if(/^#(?:edit|cloud)=/.test(current.hash)||['audio','video'].includes(current.searchParams.get('mode'))){
    const editor=new URL('editor.html',current);editor.search=current.search;editor.hash=current.hash;location.replace(editor.href);return;
  }
  const root=document.documentElement,themeButton=document.getElementById('home-theme');
  function setTheme(theme){root.dataset.theme=theme==='dark'?'dark':'light';const dark=root.dataset.theme==='dark';themeButton.setAttribute('aria-label',dark?'ライトモードに切り替え':'ダークモードに切り替え');themeButton.setAttribute('aria-pressed',String(dark));try{localStorage.setItem('patchflow-theme',root.dataset.theme)}catch{}}
  try{setTheme(localStorage.getItem('patchflow-theme')||'light')}catch{setTheme('light')}
  themeButton.addEventListener('click',()=>setTheme(root.dataset.theme==='dark'?'light':'dark'));
  const output=document.getElementById('demo-total'),extensionText=document.getElementById('demo-extension-label'),joint=document.getElementById('demo-junction'),baseChip=document.getElementById('base-length-chip'),extensionChip=document.getElementById('extension-length-chip');
  document.querySelectorAll('[data-demo-length]').forEach(button=>button.addEventListener('click',()=>{
    const length=Number(button.dataset.demoLength),total=3+length;
    document.querySelectorAll('[data-demo-length]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    extensionText.textContent=length+'m';
    output.innerHTML='<span>3m + '+length+'m</span><strong>合計 '+total+'m</strong>';
    const x=448+116*(3/total);joint.setAttribute('transform','translate('+x.toFixed(2)+' 276)');
    const baseCenter=448+(x-448)/2,extensionCenter=x+(564-x)/2;
    baseChip.setAttribute('transform','translate('+(baseCenter-475).toFixed(2)+' 0)');extensionChip.setAttribute('transform','translate('+(extensionCenter-529).toFixed(2)+' 0)');
  }));
})();

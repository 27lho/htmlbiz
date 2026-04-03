document.addEventListener('DOMContentLoaded',function(){
  // Simple lightbox for gallery
  const items = document.querySelectorAll('.masonry-item');
  const lb = document.getElementById('lightbox');
  if(items && lb){
    const img = lb.querySelector('img');
    items.forEach(a=>a.addEventListener('click',e=>{
      e.preventDefault();
      img.src = a.href;
      img.alt = a.querySelector('img').alt || '';
      lb.style.display = 'flex';
      lb.setAttribute('aria-hidden','false');
    }))
    lb.addEventListener('click',()=>{lb.style.display='none';lb.setAttribute('aria-hidden','true')})
  }
})

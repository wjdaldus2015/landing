$('.btn-contact').click(function(){
  window.scrollTo({top: document.body.scrollHeight, behavior: "smooth"});
});

//sc-intro 


gsap.to('.sc-intro .title', {
  backgroundPositionX: '0%',
  stagger: 1,
  scrollTrigger: {
    trigger: '.sc-intro .title',
    scrub: 1,
    start: '0% 20%',
    end: '100% 60%',
    // markers:true
  },
});




//sc-project 
document.querySelectorAll('.btn-filter').forEach(button => {
  button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter');
      
      // 필터가 'all'이면 모든 항목 표시
      if (filter === 'all') {
          document.querySelectorAll('.content-item').forEach(item => {
              item.classList.remove('hidden'); // 모든 항목을 표시
          });
      } else {
          // 각 항목의 data-category 확인 후 필터링
          document.querySelectorAll('.content-item').forEach(item => {
              const categories = item.getAttribute('data-category').split(',');
              if (categories.includes(filter)) {
                  item.classList.remove('hidden'); // 해당 카테고리의 항목을 표시
              } else {
                  item.classList.add('hidden'); // 필터에 맞지 않는 항목 숨기기
              }
          });
      }
  });
});


$(window).mousemove(function(e){
  
  x=e.clientX;
  y=e.clientY;

  gsap.to('.cursor',{
      x:x,
      y:y,
  })

})









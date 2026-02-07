document.addEventListener('DOMContentLoaded', function() {
  const heroTitle = document.getElementById('heroTitle');
  const scrollIndicator = document.querySelector('.scroll-indicator');
  const actionsSection = document.getElementById('actionsSection');
  const hero = document.querySelector('.hero');

  window.addEventListener('scroll', function() {
    const scrollTop = window.scrollY;
    const heroHeight = hero.offsetHeight;
    
    // Inicia o fade quando chegar perto do final da hero section
    const fadeStartPoint = heroHeight - 400;
    const fadeEndPoint = heroHeight + 200;
    
    // Calcula o progresso (0 a 1)
    let progress = (scrollTop - fadeStartPoint) / (fadeEndPoint - fadeStartPoint);
    progress = Math.max(0, Math.min(1, progress));

    // Fade out do título
    heroTitle.style.opacity = 1 - progress;
    
    // Fade out do scroll indicator
    scrollIndicator.style.opacity = Math.max(0, 1 - progress * 2);
    
    // Fade in da seção de ações (aparece como overlay)
    actionsSection.style.opacity = progress;
  });
});



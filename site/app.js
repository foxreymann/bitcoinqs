const nav = document.querySelector('nav');
const mobileToggle = document.querySelector('.mobile-toggle');
const navLinks = document.querySelector('.nav-links');

window.addEventListener('scroll', () => {
  nav.style.boxShadow = window.scrollY > 10 ? '0 4px 30px rgba(0,0,0,.3)' : 'none';
});

mobileToggle.addEventListener('click', () => {
  const open = navLinks.style.display === 'flex';
  navLinks.style.display = open ? 'none' : 'flex';
  navLinks.style.flexDirection = 'column';
  navLinks.style.position = 'absolute';
  navLinks.style.top = '64px';
  navLinks.style.left = '0';
  navLinks.style.right = '0';
  navLinks.style.background = 'rgba(10,10,15,.95)';
  navLinks.style.padding = '16px 24px';
  navLinks.style.gap = '16px';
  navLinks.style.borderBottom = '1px solid var(--border)';
  if (open) navLinks.style.display = 'none';
});

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  }
}, { threshold: 0.1 });

document.querySelectorAll('.card, .roadmap-item, .arch-layer').forEach((el) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
  observer.observe(el);
});

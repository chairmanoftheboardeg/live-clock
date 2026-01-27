/* About page JS: menus + reveal only */
const burger = document.querySelector("#burger");
const navlinks = document.querySelector("#navlinks");
const moreBtn = document.querySelector("#moreBtn");
const moreMenu = document.querySelector("#moreMenu");

burger?.addEventListener("click", () => navlinks.classList.toggle("show"));
moreBtn?.addEventListener("click", (e) => { e.preventDefault(); moreMenu.classList.toggle("show"); });

document.addEventListener("click", (e) => {
  const inWrap = e?.target && (moreMenu.contains(e.target) || moreBtn.contains(e.target));
  if (!inWrap) moreMenu.classList.remove("show");
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") moreMenu?.classList.remove("show"); });

const items = document.querySelectorAll(".reveal");
const io = new IntersectionObserver((entries) => {
  for (const ent of entries) if (ent.isIntersecting) ent.target.classList.add("in");
}, { threshold: 0.12 });
items.forEach(i => io.observe(i));

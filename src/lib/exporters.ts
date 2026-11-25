import type { Project } from './model';

export function projectJson(project: Project) {
  return JSON.stringify(project, null, 2);
}

function serialized(project: Project) {
  return JSON.stringify({ ...project, active: 0 }).replace(/</g, '\\u003c');
}

export function reactExport(project: Project) {
  const config = serialized(project);
  return `import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import "./carousel.css";

type Slide = { id: string; name: string; eyebrow: string; title: string; body: string; cta: string; image: string; color: string; accent: string; focal: string };
const config = ${config};

function easing(value: string) {
  if (value === "Linear") return "linear";
  if (value === "Ease in out") return "cubic-bezier(.4,0,.2,1)";
  if (value === "Spring" || value === "Back") return "cubic-bezier(.34,1.56,.64,1)";
  return "cubic-bezier(.22,.75,.25,1)";
}

export function Carousel() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(config.autoplay);
  const pointerStart = useRef<number | null>(null);
  const slides: Slide[] = config.slides;
  const count = slides.length;
  const step = (direction: number) => setActive((current) => {
    const next = current + direction;
    return config.loop ? (next + count) % count : Math.max(0, Math.min(count - 1, next));
  });
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { if (playing) setPlaying(false); return; }
    if (!playing || config.layout === "marquee") return;
    const timer = window.setInterval(() => setActive((current) => {
      if (!config.loop && current >= count - 1) { setPlaying(false); return current; }
      return (current + 1) % count;
    }), config.interval);
    return () => window.clearInterval(timer);
  }, [playing, count]);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); step(1); }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); step(-1); }
  };
  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    pointerStart.current = config.layout === "vertical" ? event.clientY : event.clientX;
  };
  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (pointerStart.current === null) return;
    const end = config.layout === "vertical" ? event.clientY : event.clientX;
    const distance = end - pointerStart.current;
    if (Math.abs(distance) > 42) step(distance < 0 ? 1 : -1);
    pointerStart.current = null;
  };
  const frameStyle = (slide: Slide, index: number): CSSProperties => {
    const linearDelta = index - active;
    const delta = config.loop && config.seamlessLoop && count > 1
      ? ((linearDelta + count / 2) % count + count) % count - count / 2
      : linearDelta;
    const distance = Math.abs(delta);
    let transform = "translateX(" + (delta * 100) + "%)";
    let opacity = index === active ? 1 : 0;
    let visibility: CSSProperties["visibility"] = distance > 2 ? "hidden" : "visible";
    let width = "100%";
    let left = "0";
    let marginLeft = "0";
    let position: CSSProperties["position"] = "absolute";
    if (config.layout === "vertical") transform = "translateY(" + (delta * 100) + "%)";
    if (config.layout === "standard" || config.layout === "hero" || config.layout === "vertical") {
      if (config.motion === "fade") transform = "translate3d(0,0,0)";
      if (config.motion === "zoom") transform = "scale(" + (index === active ? 1 : .92) + ")";
      if (config.motion === "lift") transform = "translateY(" + (index === active ? 0 : 14) + "%)";
    }
    if (config.layout === "centered") {
      width = "72%"; left = "50%"; marginLeft = "-36%";
      transform = "translateX(calc(" + delta + " * (100% + var(--gap)))) scale(" + (index === active ? 1 : .82) + ")";
      opacity = distance > 2 ? 0 : 1;
    }
    if (config.layout === "multi") {
      width = "calc((100% - " + (config.gap * (config.visible - 1)) + "px) / " + config.visible + ")";
      transform = "translateX(calc(" + delta + " * (100% + var(--gap))))";
      visibility = distance <= 3 ? "visible" : "hidden";
      opacity = distance <= 3 ? 1 : 0;
    }
    if (config.layout === "coverflow") {
      width = "70%"; left = "50%"; marginLeft = "-35%";
      transform = "translateX(" + (delta * 28) + "%) rotateY(" + (delta * -24) + "deg) scale(" + (index === active ? 1 : Math.max(.72, 1 - distance * .12)) + ")";
      opacity = distance > 2 ? 0 : Math.max(.35, 1 - distance * .25);
    }
    if (config.layout === "stack") {
      width = "72%"; left = "14%";
      transform = "translate(" + (delta * 12) + "px," + (distance * 14) + "px) rotate(" + (delta * 2) + "deg) scale(" + Math.max(.76, 1 - distance * .07) + ")";
      opacity = distance > 3 ? 0 : 1;
      visibility = distance > 3 ? "hidden" : "visible";
    }
    if (config.layout === "marquee") {
      position = "relative"; width = "min(34vw, 420px)"; left = "auto"; marginLeft = "0";
      transform = "none"; opacity = 1; visibility = "visible";
    } else if (config.motion === "fade" && !["centered", "multi", "coverflow", "stack"].includes(config.layout)) {
      opacity = index === active ? 1 : 0;
      visibility = index === active ? "visible" : "hidden";
    }
    return {
      position, left, width, marginLeft, transform, opacity, visibility,
      zIndex: 20 - distance,
      backgroundColor: slide.color,
      backgroundImage: slide.image ? "linear-gradient(0deg,rgba(8,13,15,.82),rgba(8,13,15,.04) 75%),url(" + JSON.stringify(slide.image) + ")" : "radial-gradient(ellipse at 80% 12%," + slide.accent + "55,transparent 43%)",
      backgroundPosition: slide.focal,
    };
  };
  const displayedSlides = config.layout === "marquee" ? [...slides, ...slides] : slides;
  return <section className={"cm-carousel cm-" + config.layout} aria-label="Featured stories" tabIndex={0} onKeyDown={onKeyDown} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { pointerStart.current = null; }} style={{ "--time": config.duration + "ms", "--gap": config.gap + "px", "--ease": easing(config.easing), "--marquee-speed": config.interval + "ms", touchAction: config.layout === "vertical" ? "pan-x" : "pan-y" } as CSSProperties}>
    <div className="cm-track">{displayedSlides.map((slide, index) => {
      const logicalIndex = index % count;
      return <article key={slide.id + "-" + index} className={"cm-slide " + (logicalIndex === active ? "is-active" : "")} style={frameStyle(slide, logicalIndex)}>
        <small>{slide.eyebrow}</small><h2>{slide.title}</h2><p>{slide.body}</p><a href="#story">{slide.cta} ↗</a>
      </article>;
    })}</div>
    {config.layout !== "marquee" && <nav className="cm-nav" aria-label="Carousel controls">
      <button type="button" aria-label="Previous slide" onClick={() => step(-1)}>←</button>
      <span aria-live="polite">{String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
      <button type="button" aria-label="Next slide" onClick={() => step(1)}>→</button>
      <button type="button" aria-label={playing ? "Pause autoplay" : "Play autoplay"} onClick={() => setPlaying((value) => !value)}>{playing ? "Pause" : "Play"}</button>
    </nav>}
  </section>;
}`;
}

export function cssExport(project: Project) {
  return `:root{color-scheme:dark}
.cm-carousel{--time:${project.duration}ms;--gap:${project.gap}px;--ease:cubic-bezier(.22,.75,.25,1);position:relative;isolation:isolate;container-type:inline-size;overflow:hidden;width:100%;max-width:100%;min-height:clamp(360px,48vw,640px);border-radius:18px;font-family:Inter,system-ui,sans-serif;perspective:1200px;background:#222d34;color:#fff}
.cm-track{position:relative;min-height:inherit;height:100%;transform-style:preserve-3d;perspective:1200px;touch-action:pan-y}
.cm-slide{box-sizing:border-box;position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;min-height:inherit;padding:clamp(24px,6cqw,72px);border-radius:inherit;background-size:cover;background-repeat:no-repeat;color:white;backface-visibility:hidden;transition:transform var(--time) var(--ease),opacity var(--time) var(--ease),filter var(--time) var(--ease);will-change:transform,opacity}
.cm-slide small{letter-spacing:.16em;font-size:11px;text-transform:uppercase;opacity:.82}
.cm-slide h2{font-size:clamp(38px,7cqw,82px);letter-spacing:-.06em;line-height:.98;max-width:760px;margin:16px 0}
.cm-slide p{max-width:420px;line-height:1.6;color:#e3e7e5;margin:0}
.cm-slide a{color:inherit;margin-top:18px;text-decoration:none;width:max-content;border-bottom:1px solid #ffffff70;padding-bottom:5px}
.cm-nav{position:absolute;z-index:30;right:20px;bottom:18px;display:flex;align-items:center;gap:10px}
.cm-nav span{font:11px ui-monospace,monospace;min-width:54px;text-align:center}
.cm-nav button{border:1px solid #ffffff60;background:#17201caa;color:white;border-radius:999px;min-width:40px;height:40px;padding:0 10px;cursor:pointer}
.cm-nav button:focus-visible,.cm-carousel:focus-visible{outline:2px solid #68ddb8;outline-offset:3px}
.cm-hero{min-height:min(72vh,760px)}
.cm-coverflow .cm-track,.cm-centered .cm-track,.cm-stack .cm-track{transform-style:preserve-3d}
.cm-marquee{min-height:300px}
.cm-marquee .cm-track{display:flex;align-items:stretch;gap:var(--gap);width:max-content;animation:cm-flow var(--marquee-speed,28s) linear infinite}
.cm-marquee:hover .cm-track{animation-play-state:paused}
.cm-marquee .cm-slide{inset:auto;flex:0 0 min(34vw,420px);min-width:260px;min-height:300px}
.cm-vertical .cm-track{touch-action:pan-x}
@keyframes cm-flow{to{transform:translateX(-50%)}}
@container (max-width:600px){.cm-carousel{min-height:360px;border-radius:12px}.cm-slide{padding:24px}.cm-slide h2{font-size:clamp(34px,10cqw,54px)}.cm-multi .cm-slide{width:72%}.cm-nav{right:12px;bottom:12px}.cm-nav button{min-width:36px;height:36px}}
@media(prefers-reduced-motion:reduce){.cm-carousel *{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}.cm-marquee .cm-track{animation:none}}`;
}

export function htmlExport(project: Project) {
  const data = serialized(project);
  const title = project.name.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] ?? character);
  const css = cssExport(project);
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${css}
body{margin:0;padding:clamp(16px,4vw,64px);background:#12151b;color:#fff}.cm-carousel{max-width:1440px;margin:auto}
</style></head>
<body><main id="carousel"></main>
<script>
const config=${data};
const root=document.querySelector("#carousel");
let active=0;
let playing=Boolean(config.autoplay);
let pointerStart=null;
const count=config.slides.length;
const section=document.createElement("section");
section.className="cm-carousel cm-"+config.layout;
section.tabIndex=0;
section.setAttribute("aria-label","Featured stories");
section.style.setProperty("--time",config.duration+"ms");
section.style.setProperty("--gap",config.gap+"px");
section.style.setProperty("--ease",config.easing==="Linear"?"linear":config.easing==="Ease in out"?"cubic-bezier(.4,0,.2,1)":config.easing==="Spring"||config.easing==="Back"?"cubic-bezier(.34,1.56,.64,1)":"cubic-bezier(.22,.75,.25,1)");
section.style.setProperty("--marquee-speed",config.interval+"ms");
section.style.touchAction=config.layout==="vertical"?"pan-x":"pan-y";
const track=document.createElement("div");
track.className="cm-track";
const entries=config.layout==="marquee"?config.slides.concat(config.slides):config.slides;
const cards=entries.map((slide,index)=>{
  const card=document.createElement("article");
  card.className="cm-slide";
  card.style.backgroundColor=slide.color;
  card.style.backgroundImage=slide.image?"linear-gradient(0deg,rgba(8,13,15,.82),rgba(8,13,15,.04) 75%),url("+JSON.stringify(slide.image)+")":"radial-gradient(ellipse at 80% 12%,"+slide.accent+"55,transparent 43%)";
  card.style.backgroundPosition=slide.focal;
  const eyebrow=document.createElement("small"),headline=document.createElement("h2"),body=document.createElement("p"),link=document.createElement("a");
  eyebrow.textContent=slide.eyebrow;headline.textContent=slide.title;body.textContent=slide.body;link.textContent=slide.cta+" ↗";link.href="#story";
  card.append(eyebrow,headline,body,link);
  track.append(card);
  return card;
});
section.append(track);
const nav=document.createElement("nav");
nav.className="cm-nav";nav.setAttribute("aria-label","Carousel controls");
const previous=document.createElement("button"),counter=document.createElement("span"),next=document.createElement("button"),pause=document.createElement("button");
previous.type=next.type=pause.type="button";
previous.setAttribute("aria-label","Previous slide");next.setAttribute("aria-label","Next slide");
previous.textContent="←";next.textContent="→";
counter.setAttribute("aria-live","polite");
let autoplayTimer=null;
function stopAutoplay(){
  playing=false;
  if(autoplayTimer!==null){window.clearInterval(autoplayTimer);autoplayTimer=null}
  pause.textContent="Play";pause.setAttribute("aria-label","Play autoplay");
}
function startAutoplay(){
  if(config.layout==="marquee"||window.matchMedia("(prefers-reduced-motion: reduce)").matches){playing=false;pause.textContent="Play";pause.setAttribute("aria-label","Play autoplay");return}
  playing=true;
  if(autoplayTimer!==null)window.clearInterval(autoplayTimer);
  pause.textContent="Pause";pause.setAttribute("aria-label","Pause autoplay");
  autoplayTimer=window.setInterval(()=>{if(!config.loop&&active>=count-1){stopAutoplay();return}go(1)},config.interval);
}
pause.onclick=()=>{if(playing)stopAutoplay();else startAutoplay()};
 if(config.layout!=="marquee"){nav.append(previous,counter,next,pause);section.append(nav)}
 root.append(section);
function go(direction){
  const target=active+direction;
  active=config.loop?(target+count)%count:Math.max(0,Math.min(count-1,target));
  render();
}
function render(){
  cards.forEach((card,index)=>{
    const logical=index%count,linearDelta=logical-active;
    const delta=config.loop&&config.seamlessLoop&&count>1?((linearDelta+count/2)%count+count)%count-count/2:linearDelta;
    const distance=Math.abs(delta),selected=logical===active;
    let transform="translateX("+delta*100+"%)",opacity=selected?1:0,visibility=distance>2?"hidden":"visible";
    card.style.position="absolute";card.style.left="0";card.style.width="100%";card.style.marginLeft="0";
    if(config.layout==="vertical")transform="translateY("+delta*100+"%)";
    if(config.layout==="standard"||config.layout==="hero"||config.layout==="vertical"){
      if(config.motion==="fade")transform="translate3d(0,0,0)";
      if(config.motion==="zoom")transform="scale("+(selected?1:.92)+")";
      if(config.motion==="lift")transform="translateY("+(selected?0:14)+"%)";
    }
    if(config.layout==="centered"){
      card.style.width="72%";card.style.left="50%";card.style.marginLeft="-36%";
      transform="translateX("+delta*100+"%) scale("+(selected?1:.82)+")";opacity=distance>2?0:1;
    }
    if(config.layout==="multi"){
      card.style.width="calc((100% - "+(config.gap*(config.visible-1))+"px) / "+config.visible+")";
      transform="translateX(calc("+delta+" * (100% + var(--gap))))";visibility=distance<=3?"visible":"hidden";opacity=distance<=3?1:0;
    }
    if(config.layout==="coverflow"){
      card.style.width="70%";card.style.left="50%";card.style.marginLeft="-35%";
      transform="translateX("+delta*28+"%) rotateY("+delta*-24+"deg) scale("+(selected?1:Math.max(.72,1-distance*.12))+")";
      opacity=distance>2?0:Math.max(.35,1-distance*.25);
    }
    if(config.layout==="stack"){
      card.style.width="72%";card.style.left="14%";
      transform="translate("+delta*12+"px,"+distance*14+"px) rotate("+delta*2+"deg) scale("+Math.max(.76,1-distance*.07)+")";
      opacity=distance>3?0:1;visibility=distance>3?"hidden":"visible";
    }
    if(config.layout==="marquee"){
      card.style.position="relative";card.style.inset="auto";card.style.left="auto";card.style.width="min(34vw,420px)";card.style.marginLeft="0";
      card.style.flex="0 0 min(34vw,420px)";transform="none";opacity=1;visibility="visible";
    }else if(config.motion==="fade"&&["centered","multi","coverflow","stack"].indexOf(config.layout)<0){
      opacity=selected?1:0;visibility=selected?"visible":"hidden";
    }
    card.style.transform=transform;card.style.opacity=String(opacity);card.style.visibility=visibility;
    card.style.zIndex=String(20-distance);card.style.pointerEvents=opacity>0?"auto":"none";
    card.classList.toggle("is-active",selected);
  });
  counter.textContent=String(active+1).padStart(2,"0")+" / "+String(count).padStart(2,"0");
}
previous.onclick=()=>go(-1);next.onclick=()=>go(1);
section.onkeydown=event=>{if(event.key==="ArrowRight"||event.key==="ArrowDown"){event.preventDefault();go(1)}if(event.key==="ArrowLeft"||event.key==="ArrowUp"){event.preventDefault();go(-1)}};
section.onpointerdown=event=>{pointerStart=config.layout==="vertical"?event.clientY:event.clientX};
section.onpointerup=event=>{if(pointerStart===null)return;const end=config.layout==="vertical"?event.clientY:event.clientX;const distance=end-pointerStart;if(Math.abs(distance)>42)go(distance<0?1:-1);pointerStart=null};
section.onpointercancel=()=>{pointerStart=null};
render();
if(playing)startAutoplay();else{pause.textContent="Play";pause.setAttribute("aria-label","Play autoplay")}
</script></body></html>`;
}

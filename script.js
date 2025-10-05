// selectors
const sleepEl = document.getElementById('sleep');
const studyEl = document.getElementById('study');
const screenEl = document.getElementById('screen');
const stressEl = document.getElementById('stress');
const analyzeBtn = document.getElementById('analyzeBtn');
const sampleBtn = document.getElementById('sampleBtn');

const kpiScore = document.getElementById('kpiScore');
const kpiCat = document.getElementById('kpiCat');
const kpiSleep = document.getElementById('kpiSleep');
const kpiStudy = document.getElementById('kpiStudy');
const kpiStress = document.getElementById('kpiStress');
const adviceText = document.getElementById('adviceText');

const weekBtn = document.getElementById('weekBtn');
const monthBtn = document.getElementById('monthBtn');

const footer = document.getElementById('siteFooter');
const resetBtn = document.getElementById('resetDemo');

// charts
let overviewChart = null;
let pieChart = null;
let trendChart = null;

// compute score
function computeScore(sleep, study, screen, stress) {
  let score = (study * 10) + (sleep * 6) - (screen * 2);
  if (stress === 'High') score -= 15;
  if (stress === 'Medium') score -= 5;
  return Math.round(Math.max(0, Math.min(100, score)));
}
function categoryFromScore(score) {
  if (score >= 80) return '🌟 Excellent';
  if (score >= 50) return '🙂 Average';
  return '⚠️ Needs Improvement';
}
function getAdvice(sleep, study, screen, stress) {
  let adv = [];
  if (sleep < 6) adv.push('Try to get 7–8 hours of sleep nightly.');
  if (study < 3) adv.push('Increase focused study blocks (try Pomodoro).');
  if (screen > 5) adv.push('Reduce passive screen time; schedule phone-free blocks.');
  if (stress === 'High') adv.push('Add short exercise, breathing or a walk.');
  if (!adv.length) adv.push('Great balance — keep these habits consistent.');
  return adv.join(' ');
}

// charts rendering
function renderOverviewChart(values) {
  const ctx = document.getElementById('overviewChart').getContext('2d');
  if (overviewChart) overviewChart.destroy();
  overviewChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Sleep', 'Study', 'Screen Time'],
      datasets: [{
        label: 'Hours',
        data: values,
        backgroundColor: ['rgba(139,92,246,0.95)','rgba(6,182,212,0.95)','rgba(249,115,22,0.95)'],
        borderRadius: 8
      }]
    },
    options: { plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}} }
  });
}
function renderPieChart(sleep, study, screen) {
  const ctx = document.getElementById('pieChart').getContext('2d');
  if (pieChart) pieChart.destroy();
  const other = Math.max(0, 24 - (sleep + study + screen));
  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Sleep','Study','Screen','Other'],
      datasets: [{ data:[sleep,study,screen,other], backgroundColor:['#8b5cf6','#06b6d4','#f97316','#374151'] }]
    },
    options: { plugins:{legend:{position:'bottom'}} }
  });
}
function generateSamples(days=7) {
  const arr=[];
  for(let i=0;i<days;i++){
    const d=new Date(); d.setDate(d.getDate()-(days-1-i));
    const sleep = +(6 + Math.sin(i/2)*0.8 + Math.random()*0.8).toFixed(1);
    const study = +(2 + Math.abs(Math.cos(i/2))*2 + Math.random()).toFixed(1);
    const screen = +(3 + Math.random()*3).toFixed(1);
    const stress = (Math.random()>0.7)?'High':(Math.random()>0.4)?'Medium':'Low';
    const score = computeScore(sleep,study,screen,stress);
    arr.push({date:d.toISOString().slice(0,10),sleep,study,screen,stress,score});
  }
  return arr;
}
function renderTrend(days=7) {
  const data = loadSamples() || generateSamples(days);
  const labels = data.slice(-days).map(x => x.date.slice(5));
  const scores = data.slice(-days).map(x => x.score);
  const ctx = document.getElementById('trendChart').getContext('2d');
  if (trendChart) trendChart.destroy();
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label:'Performance',
        data:scores,
        borderColor:'#8b5cf6',
        backgroundColor:'rgba(139,92,246,0.12)',
        tension:0.3, pointRadius:4
      }]
    },
    options:{plugins:{legend:{display:false}},scales:{y:{min:0,max:100}}}
  });
}

// storage helpers
function saveSample(sample){ const arr = loadSamples() || generateSamples(7); arr.push(sample); if(arr.length>90) arr.shift(); localStorage.setItem('la_samples', JSON.stringify(arr)); }
function loadSamples(){ const raw = localStorage.getItem('la_samples'); return raw?JSON.parse(raw):null; }

// analyze handler
function handleAnalyze(sleep,study,screen,stress){
  const score = computeScore(sleep,study,screen,stress);
  const cat = categoryFromScore(score);
  const advice = getAdvice(sleep,study,screen,stress);

  kpiScore.textContent = score;
  kpiCat.textContent = cat;
  kpiSleep.textContent = sleep + ' h';
  kpiStudy.textContent = study + ' h';
  kpiStress.textContent = stress;
  adviceText.textContent = advice;

  renderOverviewChart([sleep,study,screen]);
  renderPieChart(sleep,study,screen);

  saveSample({date:new Date().toISOString(),sleep,study,screen,stress,score});
}

// UI events
analyzeBtn.addEventListener('click', () => {
  const sleep = parseFloat(sleepEl.value) || 0;
  const study = parseFloat(studyEl.value) || 0;
  const screen = parseFloat(screenEl.value) || 0;
  const stress = stressEl.value;
  handleAnalyze(sleep,study,screen,stress);
});

sampleBtn.addEventListener('click', () => {
  const s = {sleep:7.2, study:4.1, screen:3.0, stress:'Medium'};
  sleepEl.value = s.sleep; studyEl.value = s.study; screenEl.value = s.screen; stressEl.value = s.stress;
  handleAnalyze(s.sleep,s.study,s.screen,s.stress);
});

weekBtn.addEventListener('click', () => { weekBtn.classList.add('active'); monthBtn.classList.remove('active'); renderTrend(7); });
monthBtn.addEventListener('click', () => { monthBtn.classList.add('active'); weekBtn.classList.remove('active'); renderTrend(30); });

resetBtn.addEventListener('click', () => {
  localStorage.removeItem('la_samples'); renderTrend(7); alert('Demo data reset');
});

// footer reveal when scrolled to bottom
function observeFooter() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) footer.classList.add('visible');
      else footer.classList.remove('visible');
    });
  }, { root: null, threshold: 0.02 });
  io.observe(footer);
}

// init
(function init(){
  // defaults
  kpiScore.textContent = '—'; kpiCat.textContent='—';
  kpiSleep.textContent='—'; kpiStudy.textContent='—'; kpiStress.textContent='—';
  renderOverviewChart([7,4,3]); renderPieChart(7,4,3); renderTrend(7);
  observeFooter();
})();

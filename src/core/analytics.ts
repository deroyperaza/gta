// Google Analytics 4 game events (the gtag tag itself loads in index.html). Page views, time on site and
// outbound clicks come from GA's enhanced measurement; these add what the game knows.
import { bus } from './bus';

const track = (name: string, params: Record<string, unknown> = {}) => (window as any).gtag?.('event', name, params);

export function initAnalytics() {
  bus.on('game:new', () => track('game_start', { mode: 'new' }));
  bus.on('game:load', () => track('game_start', { mode: 'continue' }));
  bus.on('mission:started', (def: any) => track('mission_start', { mission_id: def?.id, mission_title: def?.title }));
  bus.on('mission:passed', (p: any) => track('mission_pass', { mission_id: p?.def?.id, mission_title: p?.def?.title }));
  // Donate links: capture phase, because the dialogue stops their clicks from bubbling
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement)?.closest?.('a.give, a.give-all') as HTMLAnchorElement | null;
    if (!a) return;
    const org = a.closest('.mp-card, .lesson')?.querySelector('b')?.textContent
      ?? (a.classList.contains('dlg-give') ? document.querySelector('#dlg-title')?.textContent : null)
      ?? (a.classList.contains('give-all') ? 'Brooklyn Gives (all causes)' : '');
    const where = a.closest('#passed') ? 'mission_passed' : a.classList.contains('dlg-give') ? 'conversation' : 'journal';
    track('donate_click', { org: (org ?? '').trim().slice(0, 100), link_url: a.href, placement: where });
  }, true);
}

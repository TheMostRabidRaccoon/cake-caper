import type { Board, Frame } from './game';

// Presentation only: resolve from this visible beat, never a future frame or a hidden plan.
export function heistScene(board: Board, frame?: Frame, finished = false) {
 const visible = frame?.after ?? board;
 const has = (type: string) => frame?.events.some(event => event.type === type) ?? false;
 const title = finished ? (visible.cake === 'home' ? 'Cake home. Crew legendary.' : 'All raccoons accounted for.')
  : has('cake_spilled') ? 'Wagon loose. Cake down!'
  : has('cake_home') ? 'Beautifully suspicious teamwork.'
  : has('wagon_runaway') ? 'Nobody held the wagon!'
  : has('cake_recovered') ? 'Five-second rule. Probably.'
  : has('cake_loaded') ? 'Precious cargo: aboard.'
  : has('lid_blocked') ? 'The lid needs a helping paw.'
  : has('dog_blocked') ? 'The dog has questions.'
  : has('empty_wagon') ? 'Excellent brakes. Missing cake.'
  : has('wagon_braced') ? 'A very responsible raccoon.'
  : has('cooler_opened') ? 'Lid held. Your move, teammate.'
  : has('dog_distracted') ? 'Look over there, good dog.'
  : frame ? 'Every paw has a part.'
  : visible.cake === 'grass' ? 'Cake down. Rescue team up.'
  : visible.cake === 'wagon' ? 'Cargo loaded. Mind the slope.'
  : visible.cake === 'home' ? 'Cake home. Crew legendary.' : 'A backyard. A cake. An operation.';
 return { board: visible, title, open: has('cooler_opened'), braced: has('wagon_braced'),
  runaway: has('wagon_runaway'), spilled: has('cake_spilled'), distracted: has('dog_distracted'),
  delivered: has('cake_home'), finished };
}

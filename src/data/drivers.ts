/**
 * Your driver has thoughts (Deroy, Nov 23 2026: "a talk to the taxi driver option that lets them share their opinions on
 * the state of the world and the state of the city"). One driver per kind of ride, in their own voice. Opinions and
 * jokes, not facts; every driver here is invented.
 */
export interface Driver { name: string; lines: string[] }

export const DRIVERS: Record<string, Driver> = {
  everready: { name: 'Don Félix · Coquí Car Service', lines: [
    'Thirty years I drive this car. Same potholes. I know them like family. That one on Atlantic, I went to its quinceañera.',
    'Rent? Don\'t talk to me about rent. My daughter lives in my basement and pays me in grandchildren.',
    'Everybody in a hurry. For what? The BQE is a parking lot with a view.',
    'The world is crazy, mi amor. Wars, prices, the weather. And still everybody needs a ride to JFK at four in the morning.',
    'These apps cut the driver\'s money and call it "innovation." I call it Tuesday.',
    'My cousin in Santo Domingo asks why I stay. I say: the grandchildren. And the bacon, egg and cheese.',
    'You know what Brooklyn needs? More bus lanes. I\'m a driver and I\'m telling you. The bus is my friend. The double-parked truck is my enemy.',
    'The radio says the city is "booming." The radio doesn\'t pay my insurance.',
  ] },
  surge: { name: 'Gurpreet · Surge driver', lines: [
    'I have an engineering degree. Here I have 4.97 stars. One man gave me a three because it rained.',
    'The app takes a big piece and tells me I\'m my own boss. My boss is a phone that beeps.',
    'Everybody worries robots will take the jobs. The robots already took the tips.',
    'World news makes me tired. I listen to cricket highlights. Cricket never lets me down. Okay, sometimes.',
    'Every block, a new coffee place. Same coffee. Different font.',
    'Night shift is easy: finance guys going out and nurses going home. Only one of them tips.',
    'My son wants to drive like me. I said no. Go to Brooklyn Tech. Be the one who rides in the back.',
  ] },
  shlep: { name: 'Abdou · Pynk driver', lines: [
    'Shortcut? Yes. Is it shorter? Spiritually.',
    'In Dakar the traffic is worse. But there, we talk to each other. Here, everybody talks to their phone.',
    'The city is changing. My first apartment here is now a "boutique residence." I lived in the boutique. It had mice.',
    'The world, I think, is tired. But Brooklyn on a Saturday? Brooklyn is not tired. Brooklyn is loud.',
    'My wife says I should drive less and rest more. I say: tell that to the rent.',
    'People ask me where I\'m from. I say Flatbush. They say no, really. I say really. Twelve years.',
  ] },
  van: { name: 'Mr. Clive · dollar van', lines: [
    'Two dollars, cash. Cheaper than the bus, and I play better music.',
    'The city wants to license all of us. I been licensed by Flatbush Avenue for twenty years.',
    'The world is like this van: everybody squeezes in, somebody complains, and we all get where we going.',
    'Back home in Kingston we have the same vans. Here it\'s the same, just colder, and the police more bored.',
    'Gentrification? Bwoy. Now the people moving in ride my van and call it "authentic."',
    'Hold on to something. The pothole by Church Avenue has its own weather.',
  ] },
  bus: { name: 'Your bus operator', lines: [
    'Twenty years on this route. I\'ve seen three plans for a bus lane and one actual bus lane.',
    'People think the bus is slow. The bus is not slow. The double-parked car is slow.',
    'The world\'s falling apart, but the bus still comes. Eventually. With a sign that says "NOT IN SERVICE."',
    'Please move to the back. That\'s my whole philosophy. Make room. Somebody else is getting on.',
    'You know who runs this city? Bus operators, nurses, supers and grandmothers. Everyone else is on the panel.',
  ] },
};

export function driverFor(kind: 'bus' | 'van' | 'car', service?: string): { key: string; d: Driver } {
  const key = kind === 'car' ? service ?? 'surge' : kind;
  return { key, d: DRIVERS[key] ?? DRIVERS.surge };
}
